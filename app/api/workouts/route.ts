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

export async function GET(request:Request) {
  try {
    await ready();
    const profileId=Number(new URL(request.url).searchParams.get("profileId"))||1;const currentKey=profileId===1?"current":`current-${profileId}`;
    const current = await env.DB.prepare("SELECT * FROM workouts WHERE workout_key = ?").bind(currentKey).first();
    const history = await env.DB.prepare("SELECT id, name, muscle_group, exercises, completed_sets, total_sets, volume, workout_date, updated_at FROM workouts WHERE status = ? AND profile_id = ? ORDER BY workout_date DESC, id DESC LIMIT 20").bind("completed",profileId).all();
    return Response.json({ current, history: history.results });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not load workouts" }, { status: 500 }); }
}

export async function PUT(request: Request) {
  try {
    await ready();
    const body = await request.json() as { profileId?:number; name?:string; muscleGroup?:string; exercises: unknown; completedSets: number; totalSets: number; volume: number; };
    if (!Array.isArray(body.exercises)) return Response.json({ error: "Exercises are required" }, { status: 400 });
    const date = new Date().toISOString().slice(0, 10);
    const profileId=body.profileId||1;const currentKey=profileId===1?"current":`current-${profileId}`;
    await env.DB.prepare(`INSERT INTO workouts (workout_key, name, muscle_group, exercises, status, completed_sets, total_sets, volume, workout_date, updated_at, profile_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
      ON CONFLICT(workout_key) DO UPDATE SET exercises=excluded.exercises, completed_sets=excluded.completed_sets, total_sets=excluded.total_sets, volume=excluded.volume, workout_date=excluded.workout_date, updated_at=CURRENT_TIMESTAMP`)
      .bind(currentKey, body.name?.trim()||"My workout", body.muscleGroup?.trim()||"Full body", JSON.stringify(body.exercises), "active", body.completedSets || 0, body.totalSets || 0, body.volume || 0, date,profileId).run();
    return Response.json({ saved: true, savedAt: new Date().toISOString() });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not save workout" }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    await ready();
    const body = await request.json() as { profileId?:number; name?:string; muscleGroup?:string; exercises: unknown; completedSets: number; totalSets: number; volume: number; };
    const now = new Date();
    await env.DB.prepare("INSERT INTO workouts (workout_key, name, muscle_group, exercises, status, completed_sets, total_sets, volume, workout_date, profile_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(`finished-${now.getTime()}`, body.name?.trim()||"My workout", body.muscleGroup?.trim()||"Full body", JSON.stringify(body.exercises), "completed", body.completedSets || 0, body.totalSets || 0, body.volume || 0, now.toISOString().slice(0,10),body.profileId||1).run();
    return Response.json({ saved: true }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not finish workout" }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    await ready();
    const body = await request.json() as { id: number; exercises: unknown; completedSets: number; totalSets: number; volume: number; };
    if (!body.id || !Array.isArray(body.exercises)) return Response.json({ error: "Workout and exercises are required" }, { status: 400 });
    const result = await env.DB.prepare("UPDATE workouts SET exercises = ?, completed_sets = ?, total_sets = ?, volume = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = ?")
      .bind(JSON.stringify(body.exercises), body.completedSets || 0, body.totalSets || 0, body.volume || 0, body.id, "completed").run();
    if (!result.meta.changes) return Response.json({ error: "Saved workout not found" }, { status: 404 });
    return Response.json({ saved: true, savedAt: new Date().toISOString() });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not update workout" }, { status: 500 }); }
}

export async function DELETE(request:Request){try{await ready();const body=await request.json() as {id?:number;profileId?:number;current?:boolean};if(body.current){const profileId=body.profileId||1;const key=profileId===1?"current":`current-${profileId}`;await env.DB.prepare("DELETE FROM workouts WHERE workout_key=?").bind(key).run()}else if(body.id){await env.DB.prepare("DELETE FROM workouts WHERE id=? AND profile_id=?").bind(body.id,body.profileId||1).run()}else return Response.json({error:"Workout is required"},{status:400});return Response.json({deleted:true})}catch(error){return Response.json({error:error instanceof Error?error.message:"Could not delete workout"},{status:500})}}
