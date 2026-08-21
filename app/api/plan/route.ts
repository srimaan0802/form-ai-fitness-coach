import { env } from "cloudflare:workers";

const schemaSql=`CREATE TABLE IF NOT EXISTS training_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plan_key TEXT NOT NULL UNIQUE DEFAULT 'primary',
  name TEXT NOT NULL DEFAULT 'My training split',
  days TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const defaultDays=[
  {id:1,day:"Monday",name:"Lower strength",focus:"Quads · Hamstrings · Glutes"},
  {id:2,day:"Tuesday",name:"Upper push",focus:"Chest · Shoulders · Triceps"},
  {id:3,day:"Thursday",name:"Upper pull",focus:"Back · Biceps · Rear delts"},
  {id:4,day:"Saturday",name:"Full body",focus:"Compound lifts · Core"}
];

async function ready(){await env.DB.prepare(schemaSql).run()}
export async function GET(request:Request){try{await ready();const profileId=Number(new URL(request.url).searchParams.get("profileId"))||1;const key=profileId===1?"primary":`primary-${profileId}`;const plan=await env.DB.prepare("SELECT * FROM training_plans WHERE plan_key = ?").bind(key).first();return Response.json({plan:plan||{name:"4-day strength split",days:JSON.stringify(defaultDays)}})}catch(error){return Response.json({error:error instanceof Error?error.message:"Could not load plan"},{status:500})}}
export async function PUT(request:Request){try{await ready();const body=await request.json() as {profileId?:number;name?:string;days?:unknown};if(!Array.isArray(body.days)||!body.days.length)return Response.json({error:"Add at least one workout day"},{status:400});const profileId=body.profileId||1;const key=profileId===1?"primary":`primary-${profileId}`;await env.DB.prepare(`INSERT INTO training_plans (plan_key,name,days,updated_at,profile_id) VALUES (?,?,?,CURRENT_TIMESTAMP,?) ON CONFLICT(plan_key) DO UPDATE SET name=excluded.name,days=excluded.days,updated_at=CURRENT_TIMESTAMP`).bind(key,body.name?.trim()||"My training split",JSON.stringify(body.days),profileId).run();return Response.json({saved:true})}catch(error){return Response.json({error:error instanceof Error?error.message:"Could not save plan"},{status:500})}}
