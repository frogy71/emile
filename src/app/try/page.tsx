import { redirect } from "next/navigation";

// The project form lives directly on the landing page now, so /try is no
// longer a separate route. Keep this redirect for backward compatibility
// with old links, ads, emails, and external bookmarks.
export default function TryRedirect() {
  redirect("/");
}
