import { redirect } from "next/navigation";

// /essai is the French-friendly URL surface; the canonical route is /try.
// One implementation, two URLs — keeps SEO clean and avoids drift.
export default function EssaiPage() {
  redirect("/try");
}
