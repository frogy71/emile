/**
 * The 7-step Free → Pro nurture sequence.
 *
 * Used to seed `email_sequence_templates`. Editing here regenerates the
 * defaults via the seed script (idempotent upsert on step_number). Once
 * an admin tweaks the copy in /admin/email-sequences the DB row wins —
 * the seed script never overwrites a row whose `updated_at` differs from
 * `created_at`.
 *
 * Each body uses {{first_name}}, {{org_name}}, {{unsubscribe_link}},
 * {{app_url}} as placeholders. The send engine substitutes them at
 * dispatch time.
 */

export interface SequenceStep {
  stepNumber: number;
  delayDays: number;
  subject: string;
  bodyHtml: string;
}

const baseStyles = `
  body { margin: 0; padding: 0; background: #faf9f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a1a1a; }
  .wrap { max-width: 600px; margin: 0 auto; padding: 32px 16px; }
  .card { background: #faf9f6; border: 2px solid #1a1a1a; border-radius: 16px; box-shadow: 4px 4px 0px 0px #1a1a1a; overflow: hidden; }
  .header { background: #1a1a1a; color: #faf9f6; padding: 20px 28px; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 900; }
  .header h1 span { color: #c8f76f; }
  .body { padding: 28px; line-height: 1.6; }
  .body p { margin: 0 0 16px; font-size: 15px; }
  .body h2 { font-size: 20px; font-weight: 900; margin: 0 0 12px; }
  .cta { display: inline-block; background: #c8f76f; color: #1a1a1a; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 800; border: 2px solid #1a1a1a; box-shadow: 4px 4px 0px 0px #1a1a1a; margin: 12px 0 8px; }
  .grant-card { border: 2px solid #1a1a1a; border-radius: 12px; padding: 16px; margin: 12px 0; background: #fff; }
  .grant-card .title { font-weight: 800; font-size: 15px; margin: 0 0 6px; }
  .grant-card .meta { font-size: 13px; color: #555; margin: 0; }
  .quote { border-left: 4px solid #c8f76f; padding: 12px 16px; margin: 16px 0; background: #fff; font-style: italic; color: #333; }
  .footer { padding: 20px 28px; border-top: 1px solid #ddd; font-size: 12px; color: #777; text-align: center; }
  .footer a { color: #777; }
  .badge { display: inline-block; background: #ffe066; border: 2px solid #1a1a1a; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 800; }
`;

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>${baseStyles}</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header"><h1>Émile<span>.</span></h1></div>
      <div class="body">${content}</div>
      <div class="footer">
        Émile — la plateforme qui aide les associations à trouver leurs subventions.<br/>
        Vous recevez cet email parce que vous avez créé un compte sur Émile.<br/>
        <a href="{{unsubscribe_link}}">Se désabonner de ces emails</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export const SEQUENCE_STEPS: SequenceStep[] = [
  {
    stepNumber: 1,
    delayDays: 1,
    subject: "Bienvenue sur Émile, {{first_name}} 👋",
    bodyHtml: wrap(`
      <h2>Bienvenue sur Émile</h2>
      <p>Bonjour {{first_name}},</p>
      <p>Merci d'avoir rejoint Émile. Vous faites partie d'un cercle d'organisations qui ne laissent plus passer les subventions qu'elles méritent.</p>
      <p>Notre IA a déjà commencé à scanner notre base de plus de 10 000 subventions actives pour identifier celles qui correspondent à <strong>{{org_name}}</strong>.</p>
      <p>Voici ce qui vous attend :</p>
      <ul>
        <li>Des matchs personnalisés, classés par pertinence</li>
        <li>Des deadlines suivies pour vous, on vous prévient avant qu'il soit trop tard</li>
        <li>Des résumés clairs : critères, montants, démarches, en 30 secondes</li>
      </ul>
      <p>Première étape : connectez-vous et regardez vos premières recommandations.</p>
      <p style="text-align: center;"><a class="cta" href="{{app_url}}/dashboard">Voir mes recommandations →</a></p>
      <p>À très vite,<br/>L'équipe Émile</p>
    `),
  },
  {
    stepNumber: 2,
    delayDays: 3,
    subject: "3 subventions que vous ne connaissiez peut-être pas",
    bodyHtml: wrap(`
      <h2>3 pépites repérées pour vous cette semaine</h2>
      <p>Bonjour {{first_name}},</p>
      <p>Chaque semaine, on indexe entre 200 et 500 nouveaux appels à projets. Beaucoup passent sous le radar des associations parce qu'ils ne sont annoncés sur aucun site grand public.</p>
      <p>Voici trois exemples concrets repérés ces derniers jours, qui pourraient correspondre à <strong>{{org_name}}</strong> :</p>

      <div class="grant-card">
        <p class="title">Fondation de France — Initiatives solidaires</p>
        <p class="meta">Jusqu'à 50 000 € · Associations en France · Plusieurs sessions par an</p>
      </div>
      <div class="grant-card">
        <p class="title">FDVA — Fonctionnement et innovation</p>
        <p class="meta">Jusqu'à 20 000 € · Associations loi 1901 · Dépôt en ligne</p>
      </div>
      <div class="grant-card">
        <p class="title">Fonds de dotation Macif — Initiatives associatives</p>
        <p class="meta">Jusqu'à 15 000 € · Économie sociale et solidaire · 2 sessions / an</p>
      </div>

      <p>Connectez-vous pour voir <strong>vos</strong> matchs (et leurs scores de pertinence).</p>
      <p style="text-align: center;"><a class="cta" href="{{app_url}}/dashboard">Voir mes 3 meilleurs matchs →</a></p>
      <p>L'équipe Émile</p>
    `),
  },
  {
    stepNumber: 3,
    delayDays: 5,
    subject: "Le piège des subventions invisibles",
    bodyHtml: wrap(`
      <h2>80 % des associations passent à côté de subventions auxquelles elles sont éligibles</h2>
      <p>Bonjour {{first_name}},</p>
      <p>C'est le constat que les fondations elles-mêmes nous remontent : la moitié des appels à projets n'attirent pas assez de candidatures pertinentes, parce que les bonnes associations ne savent simplement pas qu'ils existent.</p>

      <div class="quote">
        « On a découvert qu'on était éligibles à un dispositif régional qui finance 70 % de notre projet. On l'avait raté trois années de suite. » — Directrice d'une association culturelle, Lyon
      </div>

      <p>Le problème n'est pas la qualité de votre projet. C'est l'asymétrie d'information : les financeurs publient sur 50 sites différents, avec des critères opaques.</p>
      <p>Émile résout ça en agrégeant <strong>10 000+ subventions</strong> dans une seule interface, et en filtrant celles qui correspondent à votre profil et vos projets.</p>
      <p style="text-align: center;"><a class="cta" href="{{app_url}}/grants">Explorer la base complète →</a></p>
      <p>L'équipe Émile</p>
    `),
  },
  {
    stepNumber: 4,
    delayDays: 8,
    subject: "Comment une association similaire a décroché 150k€ en 2 semaines",
    bodyHtml: wrap(`
      <h2>De zéro à 150 000 € en deux semaines</h2>
      <p>Bonjour {{first_name}},</p>
      <p>Aurélie dirige une petite association d'éducation populaire de 4 salariés. En décembre dernier, elle découvre Émile.</p>
      <p>Ce qui s'est passé ensuite :</p>
      <ul>
        <li><strong>Jour 1</strong> : elle décrit son projet en 3 minutes. L'IA remonte 47 subventions classées par pertinence.</li>
        <li><strong>Jour 3</strong> : elle découvre un appel régional qu'elle ignorait, deadline dans 9 jours.</li>
        <li><strong>Jour 5</strong> : Émile génère une trame de dossier pré-remplie à partir de son projet.</li>
        <li><strong>Jour 12</strong> : elle dépose 3 dossiers (au lieu d'1 habituellement).</li>
        <li><strong>2 mois plus tard</strong> : 2 réponses positives, 150 000 € sécurisés.</li>
      </ul>

      <div class="quote">
        « Le truc qui change tout, c'est de ne plus rater des deadlines parce qu'on n'avait pas vu l'AAP passer. Émile m'a fait gagner l'équivalent d'1 ETP. » — Aurélie
      </div>

      <p>Vous êtes au même point qu'Aurélie il y a 6 mois. Le passage en Pro débloque les 50 meilleurs matchs au lieu de 5, plus la génération de dossiers.</p>
      <p style="text-align: center;"><a class="cta" href="{{app_url}}/pricing">Découvrir Émile Pro →</a></p>
      <p>L'équipe Émile</p>
    `),
  },
  {
    stepNumber: 5,
    delayDays: 12,
    subject: "Vos 3 meilleurs matchs sont floutés, {{first_name}}",
    bodyHtml: wrap(`
      <h2>Vous ne voyez qu'une partie de vos opportunités</h2>
      <p>Bonjour {{first_name}},</p>
      <p>En version gratuite, on vous montre les 5 meilleurs matchs. C'est une introduction.</p>
      <p>Mais en moyenne, une association a entre <strong>30 et 60 subventions pertinentes</strong> à un instant T. Les plus intéressantes — celles à montant élevé, avec moins de concurrence — se trouvent souvent au-delà du top 5.</p>

      <p style="text-align: center; font-size: 32px; margin: 20px 0;">🔒 🔒 🔒</p>
      <p style="text-align: center;"><span class="badge">3 matchs &gt; 80/100 actuellement floutés pour {{org_name}}</span></p>

      <p>Ces matchs incluent (dans votre cas, d'après notre score) :</p>
      <ul>
        <li>Une subvention européenne avec deadline dans &lt; 30 jours</li>
        <li>Un appel régional dont le montant max dépasse 80 000 €</li>
        <li>Un dispositif de fondation privée moins connu, avec peu de candidats</li>
      </ul>

      <p>Émile Pro, c'est <strong>79 €/mois</strong> — soit moins qu'une heure de travail au tarif chargé d'un ou une chargé(e) de mission. Et un seul dossier remporté rentabilise des années d'abonnement.</p>
      <p style="text-align: center;"><a class="cta" href="{{app_url}}/pricing">Voir tous mes matchs →</a></p>
      <p>L'équipe Émile</p>
    `),
  },
  {
    stepNumber: 6,
    delayDays: 18,
    subject: "Offre spéciale : -20 % sur votre premier mois Pro",
    bodyHtml: wrap(`
      <h2>Une offre pour vous remercier d'être resté</h2>
      <p>Bonjour {{first_name}},</p>
      <p>Vous explorez Émile depuis presque 3 semaines. Merci d'avoir donné une chance à l'outil.</p>
      <p>Pour vous laisser tester Pro sans engagement, on vous offre <strong>-20 % sur votre premier mois</strong> :</p>

      <div style="text-align: center; padding: 20px; background: #c8f76f; border: 2px solid #1a1a1a; border-radius: 12px; margin: 16px 0;">
        <p style="font-size: 12px; font-weight: 800; margin: 0;">CODE PROMO</p>
        <p style="font-size: 28px; font-weight: 900; margin: 8px 0; letter-spacing: 2px;">EMILE20</p>
        <p style="font-size: 13px; margin: 0;">Premier mois à 63,20 € au lieu de 79 €</p>
      </div>

      <p>Avec Pro, {{org_name}} débloque :</p>
      <ul>
        <li><strong>50 meilleurs matchs</strong> au lieu de 5</li>
        <li><strong>Génération de dossiers</strong> à partir de votre projet (5 / mois)</li>
        <li>Matching <strong>illimité</strong> au lieu de 3 / mois</li>
        <li>Apprentissage : Émile s'améliore à chaque feedback que vous donnez</li>
      </ul>

      <p>Code valable 7 jours. Annulable en 1 clic, à tout moment.</p>
      <p style="text-align: center;"><a class="cta" href="{{app_url}}/pricing?promo=EMILE20">Activer mon -20% →</a></p>
      <p>L'équipe Émile</p>
    `),
  },
  {
    stepNumber: 7,
    delayDays: 30,
    subject: "On ne veut pas vous spammer",
    bodyHtml: wrap(`
      <h2>Dernier message — promis</h2>
      <p>Bonjour {{first_name}},</p>
      <p>Ça fait 30 jours que vous avez créé votre compte. C'est le dernier email automatique qu'on vous envoie. On ne veut pas vous saouler.</p>
      <p>Juste pour être clair sur ce que vous allez perdre en restant en gratuit :</p>
      <ul>
        <li>Les <strong>45 meilleurs matchs</strong> que vous ne verrez jamais</li>
        <li>Les <strong>nouvelles subventions ajoutées chaque semaine</strong> (200 à 500 / semaine) qui vous correspondent</li>
        <li>Le temps gagné sur la rédaction de dossiers</li>
        <li>Les deadlines manquées parce que personne ne vous a prévenu</li>
      </ul>
      <p>Si Émile ne vous est pas utile aujourd'hui, ce n'est pas grave. Mais si vous y avez pensé sans franchir le pas, c'est probablement le bon moment.</p>
      <p style="text-align: center;"><a class="cta" href="{{app_url}}/pricing">Passer en Pro maintenant →</a></p>
      <p>Si vous préférez vraiment qu'on arrête : <a href="{{unsubscribe_link}}">se désabonner</a>.</p>
      <p>Bonne continuation à {{org_name}},<br/>L'équipe Émile</p>
    `),
  },
];
