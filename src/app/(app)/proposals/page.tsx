import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ProposalsPage() {
  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Propositions</h1>
        <p className="text-muted-foreground">
          Vos brouillons de propositions générés par IA
        </p>
      </div>

      <Card className="mt-8">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">
            Aucune proposition pour le moment
          </h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Explorez les subventions, trouvez un bon match, puis générez votre
            première proposition en un clic.
          </p>
          <Link href="/grants">
            <Button className="mt-6">
              Explorer les subventions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
