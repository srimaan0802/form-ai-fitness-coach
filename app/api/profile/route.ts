import { env } from "cloudflare:workers";

const schemaSql = `CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_key TEXT NOT NULL UNIQUE DEFAULT 'primary',
  name TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'Intermediate',
  goal TEXT NOT NULL DEFAULT 'Build strength',
  units TEXT NOT NULL DEFAULT 'lb',
  weekly_days INTEGER NOT NULL DEFAULT 4,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

async function ready(){ await env.DB.prepare(schemaSql).run(); }

export async function GET(){
  try{await ready();const profile=await env.DB.prepare("SELECT * FROM profiles WHERE profile_key = ?").bind("primary").first();return Response.json({profile});}
  catch(error){return Response.json({error:error instanceof Error?error.message:"Could not load profile"},{status:500})}
}

export async function PUT(request:Request){
  try{await ready();const body=await request.json() as {name?:string;level?:string;goal?:string;units?:string;weeklyDays?:number};
    const name=body.name?.trim();if(!name)return Response.json({error:"Name is required"},{status:400});
    await env.DB.prepare(`INSERT INTO profiles (profile_key,name,level,goal,units,weekly_days,updated_at) VALUES (?,?,?,?,?,?,CURRENT_TIMESTAMP)
      ON CONFLICT(profile_key) DO UPDATE SET name=excluded.name,level=excluded.level,goal=excluded.goal,units=excluded.units,weekly_days=excluded.weekly_days,updated_at=CURRENT_TIMESTAMP`)
      .bind("primary",name,body.level||"Intermediate",body.goal||"Build strength",body.units||"lb",body.weeklyDays||4).run();
    return Response.json({saved:true});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Could not save profile"},{status:500})}
}
