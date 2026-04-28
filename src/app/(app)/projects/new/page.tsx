import QuickStart from "./quick-start";
import ProjectWizard from "./wizard";

/**
 * Project creation entry point.
 *
 * Default path: a single-textarea quick-start that lets the AI fill the
 * logframe and immediately auto-runs the matcher on the project page.
 *
 * Power users who want to fill the cadre-logique form by hand can opt in
 * via /projects/new?advanced=true — the original 5-step wizard.
 */
export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ advanced?: string }>;
}) {
  const sp = await searchParams;
  if (sp?.advanced === "true") return <ProjectWizard />;
  return <QuickStart />;
}
