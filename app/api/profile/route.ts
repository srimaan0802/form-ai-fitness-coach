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
  try{await ready();let profiles=await env.DB.prepare("SELECT * FROM profiles ORDER BY id").all();if(!profiles.results.length){await env.DB.prepare("INSERT INTO profiles (profile_key,name,level,goal,units,weekly_days) VALUES (?,?,?,?,?,?)").bind("primary","Sam Johnson","Intermediate","Build strength","lb",4).run();profiles=await env.DB.prepare("SELECT * FROM profiles ORDER BY id").all()}return Response.json({profiles:profiles.results});}
  catch(error){return Response.json({error:error instanceof Error?error.message:"Could not load profile"},{status:500})}
}

export async function PUT(request:Request){
  try{await ready();const body=await request.json() as {id?:number;name?:string;level?:string;goal?:string;units?:string;weeklyDays?:number};
    const name=body.name?.trim();if(!name)return Response.json({error:"Name is required"},{status:400});
    if(!body.id)return Response.json({error:"Profile is required"},{status:400});
    await env.DB.prepare("UPDATE profiles SET name=?,level=?,goal=?,units=?,weekly_days=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(name,body.level||"Intermediate",body.goal||"Build strength",body.units||"lb",body.weeklyDays||4,body.id).run();
    return Response.json({saved:true});
  }catch(error){return Response.json({error:error instanceof Error?error.message:"Could not save profile"},{status:500})}
}

export async function POST(request:Request){try{await ready();const body=await request.json() as {name?:string};const name=body.name?.trim();if(!name)return Response.json({error:"Name is required"},{status:400});const key=`profile-${Date.now()}`;const result=await env.DB.prepare("INSERT INTO profiles (profile_key,name,level,goal,units,weekly_days) VALUES (?,?,?,?,?,?) RETURNING *").bind(key,name,"Beginner","General fitness","lb",3).first();return Response.json({profile:result},{status:201})}catch(error){return Response.json({error:error instanceof Error?error.message:"Could not create profile"},{status:500})}}

export async function DELETE(request:Request){try{await ready();const body=await request.json() as {id?:number};const count=await env.DB.prepare("SELECT COUNT(*) AS count FROM profiles").first<{count:number}>();if((count?.count||0)<=1)return Response.json({error:"Keep at least one profile"},{status:400});await env.DB.prepare("DELETE FROM profiles WHERE id=?").bind(body.id).run();return Response.json({deleted:true})}catch(error){return Response.json({error:error instanceof Error?error.message:"Could not remove profile"},{status:500})}}
