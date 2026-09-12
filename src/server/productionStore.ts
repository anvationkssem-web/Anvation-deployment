import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';
import type { AdminUser, AuditLog, Checkpoint, Team } from '../types';

// Load the local connection string before the store is initialized. server.ts
// imports this module before its later application-level .env loader runs.
if (!process.env.VERCEL) {
  try {
    const envFile = path.join(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      for (const rawLine of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const separator = line.indexOf('=');
        if (separator === -1) continue;
        const key = line.slice(0, separator).trim();
        if (!key || process.env[key] !== undefined) continue;
        let value = line.slice(separator + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  } catch (error) {
    console.warn('[DATABASE] Could not load local .env:', error);
  }
}

// Use the connection variables supplied by the existing Vercel Prisma
// Postgres integration. These values remain server-only and are never bundled
// into the frontend because this module is imported only by the backend.
const databaseCandidates = [
  process.env.DATABASE_URL,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL
].map((value) => String(value || '').trim()).filter(Boolean);
export let databaseUrl = databaseCandidates[0] || '';
if (process.env.VERCEL && !databaseUrl) console.error('[DATABASE] No Prisma Postgres URL configured. Vercel should provide DATABASE_URL, POSTGRES_PRISMA_URL, or POSTGRES_URL.');
let sql = databaseUrl ? neon(databaseUrl) : null;

export let productionStoreEnabled = Boolean(sql);

export async function checkProductionDatabase(): Promise<{
  configured: boolean;
  connected: boolean;
}> {
  if (databaseCandidates.length === 0) return { configured: false, connected: false };
  for (const candidate of databaseCandidates) {
    try {
      const candidateSql = neon(candidate);
      await candidateSql`SELECT 1 AS ok`;
      databaseUrl = candidate;
      sql = candidateSql;
      productionStoreEnabled = true;
      return { configured: true, connected: true };
    } catch (error) {
      console.error('[DATABASE] Health check failed for configured candidate:', error);
    }
  }
  return { configured: true, connected: false };
}

function handleDbError(error: any): never {
  // Neon 404 means the project/endpoint doesn't exist — disable the store
  // so every subsequent call falls through to the local in-memory store.
  const msg = String(error?.message || error || '');
  const isNotFound = msg.includes('resource-not-found') || msg.includes('404') || (error?.status === 404);
  if (isNotFound) {
    productionStoreEnabled = false;
    console.error('[DATABASE] Neon endpoint not found — disabling production store, falling back to local.');
  }
  throw error;
}

export function describeDatabaseError(error: any): string {
  const details = [error?.message, error?.detail, error?.hint, error?.code]
    .filter((value) => value !== undefined && value !== null && String(value).trim())
    .map((value) => String(value).trim());
  return details.length ? details.join(' | ') : String(error || 'Unknown database error');
}

export type DuplicateCode = 'TEAM_NAME_EXISTS' | 'EMAIL_EXISTS' | 'USN_EXISTS' | 'PHONE_EXISTS';

export interface ProductionAdminState {
  adminUsers: AdminUser[];
  checkpoints: Checkpoint[];
  auditLogs: AuditLog[];
}

export type ProductionWebsiteState = Record<string, unknown>;

function requireProductionDatabase(operation: string): void {
  if (sql && productionStoreEnabled) return;
  throw new Error(`[DATABASE] ${operation} requires a configured PostgreSQL connection.`);
}

export async function ensureProductionSchema(): Promise<void> {
  if (!sql || !productionStoreEnabled) return;
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
  if (!sql || !productionStoreEnabled) return null;
  try {
    await ensureProductionSchema();
    const rows = await sql`SELECT state_json FROM website_state WHERE state_key = 'primary' LIMIT 1`;
    if (!rows.length) return null;
    return rows[0].state_json as ProductionWebsiteState;
  } catch (e) { handleDbError(e); }
}

export async function saveProductionWebsiteState(state: ProductionWebsiteState): Promise<void> {
  requireProductionDatabase('Saving website state');
  if (!sql || !productionStoreEnabled) return;
  try {
    await ensureProductionSchema();
    await sql`
      INSERT INTO website_state (state_key, state_json, updated_at)
      VALUES ('primary', ${JSON.stringify(state)}::jsonb, NOW())
      ON CONFLICT (state_key) DO UPDATE
      SET state_json = EXCLUDED.state_json, updated_at = NOW()
    `;
  } catch (e) { handleDbError(e); }
}

export async function loadProductionAdminState(): Promise<ProductionAdminState | null> {
  if (!sql || !productionStoreEnabled) return null;
  try {
    await ensureProductionSchema();
    const rows = await sql`SELECT state_json FROM admin_state WHERE state_key = 'primary' LIMIT 1`;
    if (!rows.length) return null;
    return rows[0].state_json as ProductionAdminState;
  } catch (e) { handleDbError(e); }
}

export async function saveProductionAdminState(state: ProductionAdminState): Promise<void> {
  requireProductionDatabase('Saving admin state');
  if (!sql || !productionStoreEnabled) return;
  try {
    await ensureProductionSchema();
    await sql`
      INSERT INTO admin_state (state_key, state_json, updated_at)
      VALUES ('primary', ${JSON.stringify(state)}::jsonb, NOW())
      ON CONFLICT (state_key) DO UPDATE
      SET state_json = EXCLUDED.state_json, updated_at = NOW()
    `;
  } catch (e) { handleDbError(e); }
}

export async function loadProductionTeams(): Promise<Team[]> {
  if (!sql || !productionStoreEnabled) return [];
  try {
    await ensureProductionSchema();
    const rows = await sql`SELECT team_json FROM registrations ORDER BY created_at ASC`;
    return rows.map((row) => row.team_json as Team);
  } catch (e) { handleDbError(e); }
}

export async function findProductionDuplicate(conflict: {
  teamName?: string;
  participants?: Array<{ email?: string; usn?: string; phone?: string }>;
}): Promise<{ code: DuplicateCode; value: string } | null> {
  requireProductionDatabase('Checking registration duplicates');
  if (!sql || !productionStoreEnabled) return null;
  try {
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
  } catch (e) {
    console.error('[DATABASE] Registration duplicate check failed:', e);
    throw e;
  }
}

export async function saveProductionTeam(team: Team): Promise<void> {
  requireProductionDatabase('Saving registration');
  if (!sql || !productionStoreEnabled) return;
  const activeSql = sql;
  try {
    await ensureProductionSchema();
    const statements = [activeSql`
      INSERT INTO registrations (team_id, team_name, team_name_key, leader_email, preferred_track, team_json)
      VALUES (${team.id}, ${team.teamName}, ${team.teamName.trim().replace(/\s+/g, ' ').toLowerCase()}, ${team.leaderEmail}, ${team.preferredTrack}, ${JSON.stringify(team)}::jsonb)
    `];
    for (const participant of team.members) {
      statements.push(activeSql`
        INSERT INTO registration_participants (participant_id, team_id, email, usn, phone, participant_json)
        VALUES (${participant.id}, ${team.id}, ${participant.email.trim().toLowerCase()}, ${participant.usn.trim().toUpperCase()}, ${participant.phone.replace(/[^0-9]/g, '')}, ${JSON.stringify(participant)}::jsonb)
      `);
    }
    await activeSql.transaction(statements);
  } catch (e: any) {
    console.error('[DATABASE] Registration transaction failed:', describeDatabaseError(e), {
      teamId: team.id,
      participantCount: team.members.length
    });
    if (e?.code === '23505') throw e; // re-throw unique constraint violations
    handleDbError(e);
  }
}

export async function updateProductionTeam(team: Team): Promise<void> {
  requireProductionDatabase('Updating registration');
  if (!sql || !productionStoreEnabled) return;
  const activeSql = sql;
  try {
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
      ...team.members.map((participant) => activeSql`
        INSERT INTO registration_participants (participant_id, team_id, email, usn, phone, participant_json)
        VALUES (${participant.id}, ${team.id}, ${participant.email.trim().toLowerCase()}, ${participant.usn.trim().toUpperCase()}, ${participant.phone.replace(/[^0-9]/g, '')}, ${JSON.stringify(participant)}::jsonb)
      `)
    ]);
  } catch (e) { handleDbError(e); }
}

export async function deleteProductionTeam(teamId: string): Promise<void> {
  requireProductionDatabase('Deleting registration');
  if (!sql || !productionStoreEnabled) return;
  try {
    await ensureProductionSchema();
    await sql.transaction([
      sql`DELETE FROM registration_participants WHERE team_id = ${teamId}`,
      sql`DELETE FROM registrations WHERE team_id = ${teamId}`
    ]);
  } catch (e) { handleDbError(e); }
}

export async function clearProductionTeams(): Promise<void> {
  requireProductionDatabase('Clearing registrations');
  if (!sql || !productionStoreEnabled) return;
  try {
    await ensureProductionSchema();
    await sql`DELETE FROM registrations`;
  } catch (e) { handleDbError(e); }
}