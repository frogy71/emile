import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CGU | Emile",
  description:
    "Conditions générales d'utilisation et de vente du service Emile.",
  robots: { index: true, follow: true },
};

export default function CguPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-3xl font-black">
        Conditions Générales d&apos;Utilisation et de Vente
      </h1>
      <p className="text-sm text-muted-foreground">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">1. Objet</h2>
        <p>
          Les présentes conditions régissent l&apos;accès et l&apos;utilisation
          du service <strong>Emile</strong> (ci-après « le Service »), plateforme
          en ligne d&apos;aide à l&apos;identification et à la constitution de
          demandes de subventions pour organisations à but non lucratif.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">2. Accès et inscription</h2>
        <p>
          Le Service est accessible aux représentants légaux ou mandatés
          d&apos;organisations (associations, fondations, collectivités,
          entreprises à mission). L&apos;inscription implique la création
          d&apos;un compte nominatif et l&apos;acceptation sans réserve des
          présentes CGU.
        </p>
        <p>
          L&apos;utilisateur s&apos;engage à fournir des informations exactes
          et à jour, et à préserver la confidentialité de ses identifiants.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">3. Offres et tarifs</h2>
        <p>Trois offres sont proposées :</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Gratuit</strong> : 3 matchings par mois, top 5 résultats,
            consultation du catalogue et alertes email basiques. Pas de
            génération de dossier IA.
          </li>
          <li>
            <strong>Emile Pro</strong> : 79 € HT / mois — matchings illimités,
            top 50 résultats, 5 dossiers IA générés par mois, alertes
            intelligentes, feedback learning, export DOCX et support email.
          </li>
          <li>
            <strong>Emile Expert</strong> : 199 € HT / mois — tout illimité,
            dossiers IA illimités, accès prioritaire aux nouvelles subventions,
            dashboard analytics avancé, support prioritaire, multi-projets
            illimité.
          </li>
        </ul>
        <p>
          Les fonctionnalités détaillées de chaque offre sont décrites sur la
          page{" "}
          <a href="/pricing" className="text-primary hover:underline">
            /pricing
          </a>
          . Les prix sont affichés hors taxes. La TVA applicable est indiquée
          au moment du paiement.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">4. Paiement et facturation</h2>
        <p>
          Le paiement s&apos;effectue via notre prestataire <strong>Stripe</strong>.
          L&apos;abonnement est prélevé par avance, renouvelé tacitement à
          chaque échéance (mensuelle ou annuelle). Les factures sont disponibles
          dans l&apos;espace « Facturation » de votre compte.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">5. Résiliation</h2>
        <p>
          L&apos;utilisateur peut résilier son abonnement à tout moment depuis
          le portail client Stripe. La résiliation prend effet à la fin de la
          période en cours — aucun remboursement pro-rata n&apos;est proposé.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">6. Droit de rétractation</h2>
        <p>
          Conformément à l&apos;article L.221-28 du Code de la consommation, le
          droit de rétractation ne s&apos;applique pas aux contrats de
          fourniture de services pleinement exécutés avant la fin du délai de
          rétractation. En souscrivant à Emile Pro, l&apos;utilisateur demande
          expressément l&apos;exécution immédiate du Service et renonce
          explicitement à son droit de rétractation pour la période déjà
          consommée.
        </p>
        <p>
          Pour les utilisateurs considérés comme consommateurs au sens de la
          loi, un délai de 14 jours s&apos;applique selon les conditions
          légales.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">7. Obligations de l&apos;utilisateur</h2>
        <p>
          L&apos;utilisateur s&apos;interdit :
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            toute utilisation frauduleuse, automatisée massive ou destinée à
            revendre les données du catalogue ;
          </li>
          <li>
            toute tentative de contournement des limites techniques ou
            tarifaires ;
          </li>
          <li>
            toute diffusion de contenus illégaux, diffamatoires ou contraires
            à l&apos;ordre public via le Service.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">8. Propriété intellectuelle</h2>
        <p>
          Emile conserve tous les droits sur sa plateforme, ses algorithmes et
          ses bases de données agrégées. L&apos;utilisateur conserve la
          propriété des contenus qu&apos;il saisit (informations organisation,
          projets, propositions générées). Il accorde à Emile une licence non
          exclusive d&apos;hébergement et de traitement limitée à la durée de
          l&apos;abonnement et à la finalité du Service.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">9. Intelligence artificielle</h2>
        <p>
          Le Service utilise des modèles d&apos;IA (Anthropic Claude) pour
          assister au matching et à la rédaction. Les contenus générés par IA
          sont <strong>toujours à valider par l&apos;utilisateur</strong> avant
          soumission officielle à un financeur. Emile ne garantit ni
          l&apos;exactitude ni l&apos;éligibilité finale du dossier produit.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">10. Disponibilité du Service</h2>
        <p>
          Emile met en œuvre les moyens raisonnables pour assurer la
          disponibilité du Service 24/7, sans toutefois garantir une
          disponibilité de 100%. Des interruptions de maintenance peuvent
          survenir ; elles sont, dans la mesure du possible, annoncées à
          l&apos;avance.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">11. Responsabilité</h2>
        <p>
          Emile est un outil d&apos;aide à la décision. L&apos;utilisateur
          reste seul responsable de ses candidatures et de leur issue. La
          responsabilité d&apos;Emile est, en tout état de cause, limitée aux
          montants encaissés au titre de l&apos;abonnement sur les 12 derniers
          mois.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">12. Modification des CGU</h2>
        <p>
          Emile se réserve le droit de modifier les présentes CGU. Les
          utilisateurs seront informés par email au moins 15 jours avant
          l&apos;entrée en vigueur de changements substantiels.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">13. Droit applicable et juridiction</h2>
        <p>
          Les présentes CGU sont régies par le droit français. À défaut de
          résolution amiable, tout litige relève des tribunaux compétents du
          ressort du siège social de l&apos;éditeur.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">14. Contact</h2>
        <p>
          Toute question relative aux présentes CGU peut être adressée à{" "}
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
