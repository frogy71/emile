/**
 * Alert system for new grant matches
 *
 * Two alert types:
 * 1. In-app notifications (stored in DB, shown in dashboard)
 * 2. Email alerts (sent via Resend)
 *
 * Trigger: After ingestion, compute matches for all orgs,
 * then alert users whose new matches are above their min_score threshold.
 *
 * Frequency: configurable per user (daily or weekly)
 */

export interface MatchAlert {
  organizationId: string;
  projectId: string | null;
  grantId: string;
  grantTitle: string;
  score: number;
  recommendation: string;
  topStrengths: string[];
  deadline: string | null;
  maxAmount: number | null;
}

/**
 * Build email HTML for match alert digest
 */
export function buildAlertEmailHtml(params: {
  organizationName: string;
  matches: MatchAlert[];
  appUrl: string;
}): string {
  const { organizationName, matches, appUrl } = params;

  const matchRows = matches
    .sort((a, b) => b.score - a.score)
    .map(
      (m) => `
      <tr>
        <td style="padding: 16px; border-bottom: 2px solid #1a1a1a;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="
              width: 48px; height: 48px; border-radius: 50%;
              border: 2.5px solid #1a1a1a;
              background: ${m.score >= 80 ? "#c8f76f" : m.score >= 60 ? "#ffe066" : "#ffa3d1"};
              display: flex; align-items: center; justify-content: center;
              font-weight: 800; font-size: 16px;
            ">${m.score}</div>
            <div style="flex: 1;">
              <div style="font-weight: 800; font-size: 15px; color: #1a1a1a;">
                ${m.grantTitle}
              </div>
              <div style="font-size: 13px; color: #6b6b6b; margin-top: 4px;">
                ${m.topStrengths.join(" · ")}
              </div>
              ${
                m.deadline
                  ? `<div style="font-size: 12px; color: #6b6b6b; margin-top: 4px;">
                  ⏰ Deadline: ${new Date(m.deadline).toLocaleDateString("fr-FR")}
                  ${m.maxAmount ? ` · 💶 Jusqu'à ${m.maxAmount.toLocaleString("fr-FR")} €` : ""}
                </div>`
                  : ""
              }
            </div>
          </div>
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin: 0; padding: 0; background-color: #faf9f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 24px;">

        <!-- Header -->
        <div style="margin-bottom: 24px;">
          <span style="font-size: 24px; font-weight: 900; color: #1a1a1a;">
            Emile<span style="background: #1a1a1a; color: #c8f76f; padding: 2px 8px; border-radius: 8px; margin-left: 4px; font-size: 18px;">.</span>
          </span>
        </div>

        <!-- Main card -->
        <div style="background: #ffffff; border: 2px solid #1a1a1a; border-radius: 16px; box-shadow: 4px 4px 0px 0px #1a1a1a; overflow: hidden;">

          <!-- Green header -->
          <div style="background: #c8f76f; padding: 20px 24px; border-bottom: 2px solid #1a1a1a;">
            <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #1a1a1a;">
              🎯 ${matches.length} ${matches.length === 1 ? "nouvelle subvention matche" : "nouvelles subventions matchent"} votre profil !
            </h1>
            <p style="margin: 4px 0 0; font-size: 14px; font-weight: 600; color: #1a1a1a;">
              ${organizationName}
            </p>
          </div>

          <!-- Matches table -->
          <table style="width: 100%; border-collapse: collapse;">
            ${matchRows}
          </table>

          <!-- CTA -->
          <div style="padding: 24px; text-align: center;">
            <a href="${appUrl}/dashboard"
              style="
                display: inline-block; padding: 12px 24px;
                background: #1a1a1a; color: #faf9f6;
                border-radius: 12px; font-weight: 700;
                text-decoration: none; font-size: 14px;
                border: 2px solid #1a1a1a;
                box-shadow: 3px 3px 0px 0px #c8f76f;
              "
            >
              Voir mes matches sur Emile →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #6b6b6b;">
          <p>
            Vous recevez cet email car vous avez activé les alertes sur Emile.
            <br>
            <a href="${appUrl}/settings" style="color: #6b6b6b;">Gérer mes alertes</a>
          </p>
        </div>

      </div>
    </body>
    </html>
  `;
}

/**
 * Build plain text version
 */
export function buildAlertEmailText(params: {
  organizationName: string;
  matches: MatchAlert[];
  appUrl: string;
}): string {
  const { organizationName, matches, appUrl } = params;

  const matchLines = matches
    .sort((a, b) => b.score - a.score)
    .map(
      (m) =>
        `[${m.score}/100] ${m.grantTitle}${m.deadline ? ` — Deadline: ${new Date(m.deadline).toLocaleDateString("fr-FR")}` : ""}${m.maxAmount ? ` — Jusqu'à ${m.maxAmount.toLocaleString("fr-FR")} €` : ""}`
    )
    .join("\n");

  return `Emile — Nouvelles subventions pour ${organizationName}

${matches.length} ${matches.length === 1 ? "nouvelle subvention matche" : "nouvelles subventions matchent"} votre profil :

${matchLines}

→ Voir mes matches : ${appUrl}/dashboard

---
Gérer mes alertes : ${appUrl}/settings`;
}
