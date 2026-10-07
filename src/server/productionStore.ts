import { Pool } from "pg";
import type { PoolClient } from "pg";
import type { Team } from "../types";

const databaseUrl = String(
  process.env.DATABASE_URL ||
    process.env.PRISMA_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    ""
).trim();
if (process.env.VERCEL && !databaseUrl) {
  // Do NOT hard-throw here: this module is imported at API-function load time, so an
  // unconditional throw would crash the whole serverless function with "API initialization
  // failed" even for endpoints that never touch the database (e.g. admin login / credential
  // flows, which run entirely in-memory). Instead warn and fall back to the in-memory/JSON
  // store. Any operation that genuinely requires the DB still throws a clear error at call
  // time (see PgQuery.run / saveProductionTeam / updateProductionTeam / deleteProductionTeam).
  console.warn(
    "[DATABASE] No DATABASE_URL (or PRISMA_DATABASE_URL / POSTGRES_URL) configured on Vercel. " +
    "Falling back to the in-memory/JSON store. Admin/credential flows work; persistent DB " +
    "operations will error until a database URL is provided."
  );
}

// Standard node-postgres pool. Kept small with short timeouts so a fresh serverless
// function instance never leaves connections hanging between invocations.
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      // Cloud Postgres providers expect TLS; rejectUnauthorized:false matches the
      // `sslmode=require` included in these cloud connection strings.
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;

// Minimal Neon-compatible `sql` template tag implemented on top of node-postgres,
// so the existing queries and `sql.transaction([...])` calls below keep working
// unchanged (parameteric `$1..$n` placeholders replace `${value}` interpolation).
class PgQuery {
  private text: string;
  private params: unknown[];

  constructor(strings: TemplateStringsArray, values: unknown[]) {
    let text = "";
    const params: unknown[] = [];
    strings.forEach((chunk, i) => {
      text += chunk;
      if (i < values.length) {
        params.push(values[i]);
        text += `$${params.length}`;
      }
    });
    this.text = text;
    this.params = params;
  }

  then<R>(resolve: (value: any[]) => R, reject?: (reason?: any) => R): Promise<R> {
    return this.run(pool).then(resolve, reject);
  }

  run(client?: PoolClient | Pool | null): Promise<any[]> {
    const target: any = client || pool;
    if (!target) throw new Error("DATABASE_URL is required for production registration storage.");
    return target.query(this.text, this.params).then((result: any) => result.rows);
  }
}

type SqlTag = ((strings: TemplateStringsArray, ...values: unknown[]) => PgQuery) & {
  transaction: (queries: PgQuery[]) => Promise<void>;
};

const sql: SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) =>
  new PgQuery(strings, values);

sql.transaction = async (queries: PgQuery[]): Promise<void> => {
  if (!pool) throw new Error("DATABASE_URL is required for production registration storage.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const q of queries) await q.run(client);
    await client.query("COMMIT");
  } catch (err) {
    try { await client.query("ROLLBACK"); } catch { /* noop */ }
    throw err;
  } finally {
    client.release();
  }
};

export const productionStoreEnabled = Boolean(pool);

export type DuplicateCode = 'TEAM_NAME_EXISTS' | 'EMAIL_EXISTS' | 'USN_EXISTS' | 'PHONE_EXISTS';

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