import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales | Emile",
  description: "Mentions légales du service Emile.",
  robots: { index: true, follow: true },
};

export default function MentionsPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-black">Mentions légales</h1>
      <p className="text-sm text-muted-foreground">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Éditeur du site</h2>
        <p>
          Le service <strong>Emile</strong> est édité par François Trésorier,
          entrepreneur individuel (à compléter : forme juridique, SIRET,
          adresse du siège, numéro RCS le cas échéant).
        </p>
        <p>
          Adresse de contact :{" "}
          <a
            href="mailto:contact@emile.ai"
            className="text-primary hover:underline"
          >
            contact@emile.ai
          </a>
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Directeur de la publication</h2>
        <p>François Trésorier.</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Hébergement</h2>
        <p>
          Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca
          Ave #4133, Covina, CA 91723, États-Unis. Les bases de données sont
          hébergées par <strong>Supabase Inc.</strong>, 970 Toa Payoh N,
          Singapore. Les emails transactionnels sont expédiés via{" "}
          <strong>Resend Inc.</strong> Les paiements sont traités par{" "}
          <strong>Stripe Payments Europe, Ltd.</strong>, 1 Grand Canal Street
          Lower, Dublin 2, Irlande.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble des éléments du site (textes, interfaces, logos,
          code) est protégé par le Code de la propriété intellectuelle. Toute
          reproduction, représentation ou diffusion sans autorisation écrite
          préalable est interdite.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Données de subventions</h2>
        <p>
          Les informations sur les financements affichées dans l&apos;application
          sont agrégées depuis des sources publiques (portails de financeurs,
          sites institutionnels) et enrichies par traitement automatisé. Elles
          sont fournies à titre indicatif et ne se substituent pas aux
          documents officiels du financeur, qui font seuls foi.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Signalement</h2>
        <p>
          Pour signaler un contenu erroné ou une donnée obsolète, contactez-nous
          à{" "}
          <a
            href="mailto:contact@emile.ai"
            className="text-primary hover:underline"
          >
            contact@emile.ai
          </a>
          .
        </p>
      </section>
    </article>
  );
}
