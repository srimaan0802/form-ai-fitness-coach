import { env } from "cloudflare:workers";

const schemaSql = `CREATE TABLE IF NOT EXISTS workouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workout_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Lower body strength',
  muscle_group TEXT NOT NULL DEFAULT 'Legs',
  exercises TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  completed_sets INTEGER NOT NULL DEFAULT 0,
  total_sets INTEGER NOT NULL DEFAULT 0,
  volume INTEGER NOT NULL DEFAULT 0,
  workout_date TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

async function ready() {
  await env.DB.prepare(schemaSql).run();
  await env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_workouts_status_date ON workouts(status, workout_date)").run();
}

export async function GET() {
  try {
    await ready();
    const current = await env.DB.prepare("SELECT * FROM workouts WHERE workout_key = ?").bind("current").first();
    const history = await env.DB.prepare("SELECT id, name, muscle_group, completed_sets, total_sets, volume, workout_date, updated_at FROM workouts WHERE status = ? ORDER BY workout_date DESC, id DESC LIMIT 20").bind("completed").all();
    return Response.json({ current, history: history.results });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not load workouts" }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    await ready();
    const body = await request.json() as { exercises: unknown; completedSets: number; totalSets: number; volume: number; };
    if (!Array.isArray(body.exercises)) return Response.json({ error: "Exercises are required" }, { status: 400 });
    const date = new Date().toISOString().slice(0, 10);
    await env.DB.prepare(`INSERT INTO workouts (workout_key, name, muscle_group, exercises, status, completed_sets, total_sets, volume, workout_date, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(workout_key) DO UPDATE SET exercises=excluded.exercises, completed_sets=excluded.completed_sets, total_sets=excluded.total_sets, volume=excluded.volume, workout_date=excluded.workout_date, updated_at=CURRENT_TIMESTAMP`)
      .bind("current", "Lower body strength", "Legs", JSON.stringify(body.exercises), "active", body.completedSets || 0, body.totalSets || 0, body.volume || 0, date).run();
    return Response.json({ saved: true, savedAt: new Date().toISOString() });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not save workout" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    await ready();
    const body = await request.json() as { exercises: unknown; completedSets: number; totalSets: number; volume: number; };
    const now = new Date();
    await env.DB.prepare("INSERT INTO workouts (workout_key, name, muscle_group, exercises, status, completed_sets, total_sets, volume, workout_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(`finished-${now.getTime()}`, "Lower body strength", "Legs", JSON.stringify(body.exercises), "completed", body.completedSets || 0, body.totalSets || 0, body.volume || 0, now.toISOString().slice(0,10)).run();
    return Response.json({ saved: true }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not finish workout" }, { status: 500 }); }
}
