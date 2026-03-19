// Search data.gouv.fr for all grant-related datasets we might be missing

async function search(q) {
  const res = await fetch("https://www.data.gouv.fr/api/1/datasets/?q=" + encodeURIComponent(q) + "&page_size=8");
  const data = await res.json();
  for (const ds of (data.data || [])) {
    const files = (ds.resources||[]).filter(r => ["csv","xlsx","ods","json"].includes(r.format?.toLowerCase()));
    if (files.length > 0) {
      console.log("  📋 " + ds.title?.slice(0,80));
      console.log("     Org: " + (ds.organization?.name || "?") + " | Formats: " + files.map(r=>r.format).join(","));
      console.log("     URL: " + files[0].url?.slice(0,100));
      console.log();
    }
  }
}

console.log("=== 1. Subventions aux associations ===\n");
await search("subventions associations");

console.log("=== 2. Appels à projets ===\n");
await search("appels projets");

console.log("=== 3. Aides financières associations ===\n");
await search("aides financieres associations");

console.log("=== 4. Subventions régions ===\n");
await search("subventions region");

console.log("=== 5. Fonds dotation ===\n");
await search("fonds dotation");
