import { neon } from '@neondatabase/serverless';
import type { AdminUser, AuditLog, Checkpoint, Team } from '../types';

// The Neon client needs a standard PostgreSQL URL. POSTGRES_PRISMA_URL can be
// a Prisma Accelerate URL, so prefer the regular pooled/non-pooled URLs.
const databaseUrl = String(
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.STORAGE_URL_NON_POOLING ||
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.DATABASE_URL ||
  ''
).trim();
if (process.env.VERCEL && !databaseUrl) console.error('[DATABASE] No standard PostgreSQL URL configured. Set POSTGRES_URL, STORAGE_URL, or DATABASE_URL.');
const sql = databaseUrl ? neon(databaseUrl) : null;

export const productionStoreEnabled = Boolean(sql);

export type DuplicateCode = 'TEAM_NAME_EXISTS' | 'EMAIL_EXISTS' | 'USN_EXISTS' | 'PHONE_EXISTS';

export interface ProductionAdminState {
  adminUsers: AdminUser[];
  checkpoints: Checkpoint[];
  auditLogs: AuditLog[];
}

export type ProductionWebsiteState = Record<string, unknown>;

export async function ensureProductionSchema(): Promise<void> {
  if (!sql) return;
  await sql`
    CREATE TABLE IF NOT EXISTS registrations (
      team_id TEXT PRIMARY KEY,
      team_name TEXT NOT NULL,
      team_name_key TEXT NOT NULL UNIQUE,
      leader_email TEXT NOT NULL,
      preferred_track TEXT NOT NULL,
      team_json JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS registration_participants (
      participant_id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL REFERENCES registrations(team_id) ON DELETE CASCADE,
      email TEXT NOT NULL,
      usn TEXT NOT NULL,
      phone TEXT NOT NULL,
      participant_json JSONB NOT NULL,
      UNIQUE(email),
      UNIQUE(usn),
      UNIQUE(phone)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS admin_state (
      state_key TEXT PRIMARY KEY,
      state_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS website_state (
      state_key TEXT PRIMARY KEY,
      state_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function loadProductionWebsiteState(): Promise<ProductionWebsiteState | null> {
  if (!sql) return null;
  await ensureProductionSchema();
  const rows = await sql`SELECT state_json FROM website_state WHERE state_key = 'primary' LIMIT 1`;
  if (!rows.length) return null;
  return rows[0].state_json as ProductionWebsiteState;
}

export async function saveProductionWebsiteState(state: ProductionWebsiteState): Promise<void> {
  if (!sql) return;
  await ensureProductionSchema();
  await sql`
    INSERT INTO website_state (state_key, state_json, updated_at)
    VALUES ('primary', ${JSON.stringify(state)}::jsonb, NOW())
    ON CONFLICT (state_key) DO UPDATE
    SET state_json = EXCLUDED.state_json, updated_at = NOW()
  `;
}

export async function loadProductionAdminState(): Promise<ProductionAdminState | null> {
  if (!sql) return null;
  await ensureProductionSchema();
  const rows = await sql`SELECT state_json FROM admin_state WHERE state_key = 'primary' LIMIT 1`;
  if (!rows.length) return null;
  return rows[0].state_json as ProductionAdminState;
}

export async function saveProductionAdminState(state: ProductionAdminState): Promise<void> {
  if (!sql) return;
  await ensureProductionSchema();
  await sql`
    INSERT INTO admin_state (state_key, state_json, updated_at)
    VALUES ('primary', ${JSON.stringify(state)}::jsonb, NOW())
    ON CONFLICT (state_key) DO UPDATE
    SET state_json = EXCLUDED.state_json, updated_at = NOW()
  `;
}

export async function loadProductionTeams(): Promise<Team[]> {
  if (!sql) return [];
  await ensureProductionSchema();
  const rows = await sql`SELECT team_json FROM registrations ORDER BY created_at ASC`;
  return rows.map((row) => row.team_json as Team);
}

export async function findProductionDuplicate(conflict: {
  teamName?: string;
  participants?: Array<{ email?: string; usn?: string; phone?: string }>;
}): Promise<{ code: DuplicateCode; value: string } | null> {
  if (!sql) return null;
  await ensureProductionSchema();
  const teamNameKey = conflict.teamName?.trim().replace(/\s+/g, ' ').toLowerCase();
  if (teamNameKey) {
    const rows = await sql`SELECT team_id FROM registrations WHERE team_name_key = ${teamNameKey} LIMIT 1`;
    if (rows.length) return { code: 'TEAM_NAME_EXISTS', value: conflict.teamName!.trim() };
  }
  for (const participant of conflict.participants || []) {
    const email = String(participant.email || '').trim().toLowerCase();
    const usn = String(participant.usn || '').trim().toUpperCase();
    const phone = String(participant.phone || '').replace(/[^0-9]/g, '');
    if (email) {
      const rows = await sql`SELECT participant_id FROM registration_participants WHERE email = ${email} LIMIT 1`;
      if (rows.length) return { code: 'EMAIL_EXISTS', value: email };
    }
    if (usn) {
      const rows = await sql`SELECT participant_id FROM registration_participants WHERE usn = ${usn} LIMIT 1`;
      if (rows.length) return { code: 'USN_EXISTS', value: usn };
    }
    if (phone) {
      const rows = await sql`SELECT participant_id FROM registration_participants WHERE phone = ${phone} LIMIT 1`;
      if (rows.length) return { code: 'PHONE_EXISTS', value: phone };
    }
  }
  return null;
}

export async function saveProductionTeam(team: Team): Promise<void> {
  if (!sql) throw new Error('DATABASE_URL is required for production registration storage.');
  await ensureProductionSchema();
  const statements = [sql`
    INSERT INTO registrations (team_id, team_name, team_name_key, leader_email, preferred_track, team_json)
    VALUES (${team.id}, ${team.teamName}, ${team.teamName.trim().replace(/\s+/g, ' ').toLowerCase()}, ${team.leaderEmail}, ${team.preferredTrack}, ${JSON.stringify(team)}::jsonb)
  `];
  for (const participant of team.members) {
    statements.push(sql`
      INSERT INTO registration_participants (participant_id, team_id, email, usn, phone, participant_json)
      VALUES (${participant.id}, ${team.id}, ${participant.email.trim().toLowerCase()}, ${participant.usn.trim().toUpperCase()}, ${participant.phone.replace(/[^0-9]/g, '')}, ${JSON.stringify(participant)}::jsonb)
    `);
  }
  await sql.transaction(statements);
}

export async function updateProductionTeam(team: Team): Promise<void> {
  if (!sql) throw new Error('DATABASE_URL is required for production registration storage.');
  await ensureProductionSchema();
  const teamJson = JSON.stringify(team);
  const teamNameKey = team.teamName.trim().replace(/\s+/g, ' ').toLowerCase();
  await sql.transaction([
    sql`
      UPDATE registrations
      SET team_name = ${team.teamName},
          team_name_key = ${teamNameKey},
          leader_email = ${team.leaderEmail},
          preferred_track = ${team.preferredTrack},
          team_json = ${teamJson}::jsonb
      WHERE team_id = ${team.id}
    `,
    sql`DELETE FROM registration_participants WHERE team_id = ${team.id}`,
    ...team.members.map((participant) => sql`
      INSERT INTO registration_participants (participant_id, team_id, email, usn, phone, participant_json)
      VALUES (${participant.id}, ${team.id}, ${participant.email.trim().toLowerCase()}, ${participant.usn.trim().toUpperCase()}, ${participant.phone.replace(/[^0-9]/g, '')}, ${JSON.stringify(participant)}::jsonb)
    `)
  ]);
}

export async function deleteProductionTeam(teamId: string): Promise<void> {
  if (!sql) throw new Error('DATABASE_URL is required for production registration storage.');
  await ensureProductionSchema();
  await sql.transaction([
    sql`DELETE FROM registration_participants WHERE team_id = ${teamId}`,
    sql`DELETE FROM registrations WHERE team_id = ${teamId}`
  ]);
}