import { redirect } from "next/navigation";

// /saved is now folded into /pipeline — every save shows up as a card in
// the "Découvert" column. Keep this route alive as a redirect so existing
// bookmarks, sidebar links, and toast deep-links don't 404.
export default function SavedRedirect() {
  redirect("/pipeline");
}
