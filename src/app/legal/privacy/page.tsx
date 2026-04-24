import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Emile",
  description:
    "Politique de confidentialité et traitement des données personnelles sur Emile.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-black">Politique de confidentialité</h1>
      <p className="text-sm text-muted-foreground">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Responsable du traitement</h2>
        <p>
          François Trésorier, éditeur d&apos;Emile (voir{" "}
          <a href="/legal/mentions" className="text-primary hover:underline">
            mentions légales
          </a>
          ).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Données collectées</h2>
        <p>Nous collectons uniquement les données nécessaires au fonctionnement du Service :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Compte</strong> : email, mot de passe chiffré, date de
            création.
          </li>
          <li>
            <strong>Organisation</strong> : nom, mission, domaines
            d&apos;intervention, bénéficiaires, budget, taille équipe.
          </li>
          <li>
            <strong>Projets et propositions</strong> : contenus que vous saisissez ou
            générez dans l&apos;outil.
          </li>
          <li>
            <strong>Paiement</strong> : géré intégralement par Stripe. Nous
            stockons uniquement un identifiant client Stripe, jamais vos
            données bancaires.
          </li>
          <li>
            <strong>Techniques</strong> : logs d&apos;accès, adresse IP, métriques
            d&apos;usage (durée d&apos;une session, routes visitées) agrégées
            pour le pilotage du produit.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Finalités et bases légales</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Exécution du contrat</strong> : fourniture du Service,
            envoi d&apos;alertes, facturation.
          </li>
          <li>
            <strong>Intérêt légitime</strong> : amélioration produit,
            prévention de la fraude, sécurité.
          </li>
          <li>
            <strong>Obligation légale</strong> : archivage comptable des
            factures (10 ans).
          </li>
          <li>
            <strong>Consentement</strong> : communications marketing (opt-in
            explicite, opt-out à tout moment).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Durée de conservation</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Compte actif : durée de l&apos;abonnement.</li>
          <li>
            Compte supprimé : 30 jours de rétention en sauvegarde technique,
            puis effacement.
          </li>
          <li>Factures : 10 ans (obligation comptable française).</li>
          <li>Logs techniques : 12 mois.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Sous-traitants et transferts</h2>
        <p>Nous utilisons les sous-traitants suivants :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Vercel Inc.</strong> — hébergement applicatif (régions EU).
          </li>
          <li>
            <strong>Supabase Inc.</strong> — base de données et authentification
            (régions EU Paris disponibles).
          </li>
          <li>
            <strong>Anthropic PBC</strong> — modèles d&apos;IA (traitement de
            vos prompts, sans utilisation pour l&apos;entraînement selon les
            conditions commerciales d&apos;Anthropic).
          </li>
          <li>
            <strong>Stripe Payments Europe, Ltd.</strong> — paiements (Irlande).
          </li>
          <li>
            <strong>Resend Inc.</strong> — envoi d&apos;emails transactionnels.
          </li>
        </ul>
        <p>
          Certains prestataires sont situés hors UE (Anthropic, Resend,
          Vercel). Les transferts s&apos;effectuent sous Clauses Contractuelles
          Types de la Commission européenne.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez à tout moment des droits
          d&apos;accès, de rectification, d&apos;effacement, d&apos;opposition,
          de limitation et de portabilité. Pour exercer ces droits, écrivez à{" "}
          <a
            href="mailto:privacy@emile.ai"
            className="text-primary hover:underline"
          >
            privacy@emile.ai
          </a>
          . Vous pouvez également introduire une réclamation auprès de la CNIL
          ({" "}
          <a
            href="https://www.cnil.fr"
            className="text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            cnil.fr
          </a>
          ).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Cookies</h2>
        <p>
          Emile utilise uniquement des cookies <strong>strictement nécessaires</strong>
          au fonctionnement (session d&apos;authentification). Aucun cookie
          publicitaire ni de tracking tiers n&apos;est posé sans votre
          consentement.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Sécurité</h2>
        <p>
          Chiffrement TLS sur toutes les connexions, hachage bcrypt des mots de
          passe, politiques Row-Level-Security Supabase isolant les données par
          utilisateur, accès administrateur journalisé. En cas de violation
          significative, les utilisateurs concernés seront notifiés sous 72
          heures.
        </p>
      </section>
    </article>
  );
}
