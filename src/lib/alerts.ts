/**
 * Alert email builder — generates digest emails for grant matches
 */

export interface MatchAlert {
  organizationId: string;
  projectId: string | null;
  grantId: string;
  grantTitle: string;
  score: number;
  recommendation: "pursue" | "maybe" | "skip";
  topStrengths: string[];
  deadline: string | null;
  maxAmount: number | null;
}

interface AlertEmailParams {
  organizationName: string;
  matches: MatchAlert[];
  appUrl: string;
}

export function buildAlertEmailHtml({
  organizationName,
  matches,
  appUrl,
}: AlertEmailParams): string {
  const rows = matches
    .map(
      (m) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong>${m.grantTitle}</strong>
          <div style="margin-top: 4px;">
            ${m.topStrengths.map((s) => `<span style="display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-right: 4px;">${s}</span>`).join("")}
          </div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
          <span style="display: inline-block; background: ${m.score >= 70 ? "#c8f76f" : m.score >= 50 ? "#fff3cd" : "#fde8e8"}; color: #1a1a1a; padding: 4px 10px; border-radius: 8px; font-weight: bold;">${m.score}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; white-space: nowrap;">
          ${m.deadline ? new Date(m.deadline).toLocaleDateString("fr-FR") : "—"}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; white-space: nowrap;">
          ${m.maxAmount ? `${m.maxAmount.toLocaleString("fr-FR")} €` : "—"}
        </td>
      </tr>`
    )
    .join("");

  return `
    <div style="font-family: Inter, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #1a1a1a; color: #faf9f6; padding: 20px 24px; border-radius: 16px 16px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">Emile<span style="color: #c8f76f;">.</span></h1>
      </div>
      <div style="padding: 24px; background: #faf9f6; border: 2px solid #1a1a1a; border-top: none; border-radius: 0 0 16px 16px;">
        <p>Bonjour ${organizationName},</p>
        <p>Nous avons trouvé <strong>${matches.length} nouvelle(s) subvention(s)</strong> qui correspondent à votre profil :</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr style="background: #c8f76f;">
              <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Subvention</th>
              <th style="padding: 10px 12px; text-align: center; font-size: 13px;">Score</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Deadline</th>
              <th style="padding: 10px 12px; text-align: left; font-size: 13px;">Montant max</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <a href="${appUrl}/grants" style="display: inline-block; background: #1a1a1a; color: #faf9f6; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; margin-top: 8px;">
          Voir toutes les subventions →
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 24px;">
          Vous recevez cet email car vous êtes inscrit aux alertes Emile.
          <a href="${appUrl}/settings">Gérer mes alertes</a>
        </p>
      </div>
    </div>`;
}

export function buildAlertEmailText({
  organizationName,
  matches,
  appUrl,
}: AlertEmailParams): string {
  const lines = matches.map(
    (m) =>
      `- ${m.grantTitle} (Score: ${m.score}) — Deadline: ${m.deadline ? new Date(m.deadline).toLocaleDateString("fr-FR") : "N/A"} — Max: ${m.maxAmount ? `${m.maxAmount.toLocaleString("fr-FR")} €` : "N/A"}`
  );
  return `Bonjour ${organizationName},\n\n${matches.length} nouvelle(s) subvention(s) correspondent à votre profil :\n\n${lines.join("\n")}\n\nVoir toutes les subventions : ${appUrl}/grants\n\nGérer mes alertes : ${appUrl}/settings`;
}
