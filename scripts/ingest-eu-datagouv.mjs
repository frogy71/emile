/**
 * Ingest EU grants + Fondations d'entreprises from data.gouv.fr
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import XLSX from "xlsx";

const S = process.env.NEXT_PUBLIC_SUPABASE_URL;
const K = process.env.SUPABASE_SERVICE_ROLE_KEY;

function cleanHtml(h) { return h ? h.replace(/<[^>]*>/g," ").replace(/&amp;/g,"&").replace(/&#x27;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g," ").trim() : null; }

async function upsert(grants) {
  let ok=0,err=0;
  for(let i=0;i<grants.length;i+=50){
    const chunk=grants.slice(i,i+50);
    const r=await fetch(S+"/rest/v1/grants",{method:"POST",headers:{apikey:K,Authorization:"Bearer "+K,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(chunk)});
    if(r.ok)ok+=chunk.length;else err+=chunk.length;
  }
  return{ok,err};
}

async function main() {
  console.log("\n🌍 ═══ EU + DATA.GOUV INGESTION ═══\n");

  // ── 1. EU Grants (curated high-quality seed data) ──
  console.log("── EU Funding & Tenders ──");
  const euGrants = [
    { id:"cerv-2026", title:"CERV — Citoyens, Égalité, Droits et Valeurs", prog:"CERV", summary:"Programme européen soutenant les organisations de la société civile : protection des droits et valeurs de l'UE, citoyenneté européenne, mémoire, inclusion, lutte contre les discriminations.", themes:["Droits","Citoyenneté","Égalité","Inclusion","Mémoire"], max:500000 },
    { id:"erasmus-youth-2026", title:"Erasmus+ — Jeunesse et Sport", prog:"ERASMUS+", summary:"Échanges de jeunes, mobilité des travailleurs de jeunesse, partenariats stratégiques. Ouvert aux associations et organisations de jeunesse.", themes:["Jeunesse","Éducation","Sport","Mobilité"], max:300000 },
    { id:"erasmus-education-2026", title:"Erasmus+ — Éducation des adultes", prog:"ERASMUS+", summary:"Partenariats de coopération en éducation des adultes. Innovation pédagogique, inclusion, compétences numériques.", themes:["Éducation","Adultes","Inclusion","Numérique"], max:400000 },
    { id:"erasmus-kA2-2026", title:"Erasmus+ — KA2 Partenariats de coopération", prog:"ERASMUS+", summary:"Projets de coopération entre organisations de différents pays. Échange de pratiques, développement de ressources pédagogiques innovantes.", themes:["Coopération","Éducation","Innovation","Interculturel"], max:400000 },
    { id:"life-2026", title:"LIFE — Environnement et Action Climat", prog:"LIFE", summary:"Projets nature/biodiversité, économie circulaire, atténuation et adaptation au changement climatique. Cofinancement à 60-75%.", themes:["Environnement","Climat","Biodiversité","Économie circulaire"], max:1000000 },
    { id:"esf-2026", title:"FSE+ — Fonds Social Européen Plus", prog:"FSE+", summary:"Inclusion sociale, lutte contre la pauvreté, emploi des jeunes, économie sociale. Cofinancement de projets d'associations.", themes:["Emploi","Inclusion","Pauvreté","Jeunesse","ESS"], max:500000 },
    { id:"amif-2026", title:"AMIF — Asile, Migration et Intégration", prog:"AMIF", summary:"Accueil, intégration et retour. Ouvert aux associations travaillant avec les migrants, réfugiés et demandeurs d'asile.", themes:["Migration","Asile","Intégration","Réfugiés"], max:800000 },
    { id:"crea-culture-2026", title:"Europe Créative — Culture", prog:"CREA", summary:"Coopération culturelle européenne, circulation des œuvres, diversité culturelle, numérisation du patrimoine.", themes:["Culture","Art","Patrimoine","Diversité culturelle"], max:200000 },
    { id:"ndici-2026", title:"NDICI — Coopération internationale", prog:"NDICI", summary:"Financement d'ONG pour projets de développement, droits humains, gouvernance dans les pays tiers. Programmes géographiques et thématiques.", themes:["Développement","Coopération","Droits humains","Gouvernance"], max:2000000 },
    { id:"horizon-cluster2-2026", title:"Horizon Europe — Cluster 2 : Culture, Créativité, Société Inclusive", prog:"HORIZON", summary:"Recherche et innovation sur la démocratie, le patrimoine culturel, les transformations sociales et économiques.", themes:["Recherche","Innovation","Société","Démocratie"], max:3000000 },
    { id:"interreg-2026", title:"Interreg — Coopération territoriale européenne", prog:"INTERREG", summary:"Coopération transfrontalière, transnationale et interrégionale. Projets conjoints entre organisations de différents pays.", themes:["Coopération","Transfrontalier","Innovation","Environnement"], max:500000 },
    { id:"feder-2026", title:"FEDER — Fonds Européen de Développement Régional", prog:"FEDER", summary:"Développement régional, innovation, PME, transition numérique et écologique. Les associations peuvent être partenaires de projets.", themes:["Innovation","Développement régional","Numérique","Écologie"], max:1000000 },
    { id:"feader-2026", title:"FEADER — Développement rural (Leader)", prog:"FEADER", summary:"Programme Leader : développement local en milieu rural. Financement de projets associatifs pour la vitalité des territoires ruraux.", themes:["Rural","Agriculture","Territoire","Développement local"], max:200000 },
    { id:"eu-aid-volunteers-2026", title:"EU Aid Volunteers — Corps européen de solidarité", prog:"CORPS SOLIDARITÉ", summary:"Volontariat européen, projets de solidarité portés par des jeunes, partenariats pour le volontariat.", themes:["Volontariat","Solidarité","Jeunesse","International"], max:100000 },
    { id:"daphne-2026", title:"CERV-DAPHNE — Lutte contre les violences", prog:"CERV-DAPHNE", summary:"Lutte contre toutes les formes de violence : violence de genre, violence envers les enfants, violence domestique. Prévention et soutien aux victimes.", themes:["Violences","Genre","Enfance","Prévention"], max:300000 },
  ].map(s => ({
    source_url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/#" + s.id,
    source_name: "EU Funding & Tenders",
    title: s.title,
    summary: s.summary,
    raw_content: s.summary,
    funder: "Commission Européenne — " + s.prog,
    country: "EU",
    thematic_areas: s.themes,
    eligible_entities: ["association","ong","fondation"],
    eligible_countries: ["FR","EU"],
    min_amount_eur: 10000,
    max_amount_eur: s.max,
    co_financing_required: true,
    deadline: null,
    grant_type: "appel_a_projets",
    language: "en",
    status: "active",
    ai_summary: s.summary,
  }));

  const euR = await upsert(euGrants);
  console.log(`✅ EU: ${euR.ok} inserted\n`);

  // ── 2. Fondations d'entreprises ──
  console.log("── Fondations d'entreprises (data.gouv.fr) ──");
  try {
    const url = "https://static.data.gouv.fr/resources/fondations-d-entreprises/20200810-123428/liste-des-fondations-dentreprise-fe-au-1er-aout-2020.ods";
    const res = await fetch(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const wb = XLSX.read(buf, { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    console.log(`Parsed: ${rows.length} fondations d'entreprises`);
    console.log(`Columns: ${Object.keys(rows[0]||{}).join(", ")}`);

    const feGrants = rows.map(row => {
      const name = row["NOM"]||row["Nom"]||row["DENOMINATION"]||Object.values(row)[0]||"";
      const objet = row["OBJET"]||row["Objet"]||"";
      const ville = row["VILLE"]||row["Ville"]||"";
      const themes = [];
      const kw = { "Éducation":/éducati|enseignement|formation/i, "Culture":/cultur|art|musé|patrimoine/i, "Solidarité":/solidar|social|humanitaire/i, "Environnement":/environnement|écolog|développement durable/i, "Santé":/santé|médic|recherch/i, "Sport":/sport/i, "Jeunesse":/jeune|enfan/i };
      for (const [t,r] of Object.entries(kw)) { if(r.test(objet)||r.test(name)) themes.push(t); }

      return {
        source_url: "https://data.gouv.fr/fe/" + encodeURIComponent(name.slice(0,80)),
        source_name: "data.gouv.fr — Fondations entreprises",
        title: name.slice(0,300),
        summary: objet ? objet.slice(0,500) + (ville?" — "+ville:"") : "Fondation d'entreprise" + (ville?" basée à "+ville:""),
        raw_content: objet||null,
        funder: name.slice(0,200),
        country: "FR",
        thematic_areas: themes.length>0 ? themes : ["Mécénat"],
        eligible_entities: ["association","ong"],
        eligible_countries: ["FR"],
        min_amount_eur:null, max_amount_eur:null,
        co_financing_required:false, deadline:null,
        grant_type:"fondation", language:"fr", status:"active", ai_summary:null,
      };
    }).filter(g => g.title.length > 3);

    const feR = await upsert(feGrants);
    console.log(`✅ FE: ${feR.ok} inserted\n`);
  } catch(e) { console.log("FE error:", e.message); }

  // Final count by source
  console.log("═══ FINAL DB STATE ═══");
  const sources = ["Aides-Territoires","data.gouv.fr — FRUP","data.gouv.fr — Fondations entreprises","EU Funding & Tenders","Fondations françaises","FDVA","Fondation de France","Service Civique","Ministère de la Culture","Ministère Écologie"];
  for (const src of sources) {
    const r = await fetch(S+"/rest/v1/grants?source_name=eq."+encodeURIComponent(src)+"&select=id",{headers:{apikey:K,Authorization:"Bearer "+K,Prefer:"count=exact",Range:"0-0"}});
    const range = r.headers.get("content-range");
    if(range && !range.endsWith("/0")) console.log("  "+src+": "+range.split("/")[1]);
  }
  const total = await fetch(S+"/rest/v1/grants?select=id",{headers:{apikey:K,Authorization:"Bearer "+K,Prefer:"count=exact",Range:"0-0"}});
  console.log("\n📦 TOTAL: " + total.headers.get("content-range").split("/")[1] + " grants");
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
