import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatRoas, getOfferHealth, getHealthColor } from "@/lib/metrics";
import type { Offer } from "@/lib/mockData";

interface OfferCardProps {
  offer: Offer;
}

export function OfferCard({ offer }: OfferCardProps) {
  const navigate = useNavigate();
  const health = getOfferHealth(offer.metrics.roasTotal, offer.thresholds);

  return (
    <Card
      onClick={() => navigate(`/ofertas/${offer.id}`)}
      className="cursor-pointer p-4 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-primary/20 active:scale-[0.99] h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1 w-full overflow-hidden">
          <div className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", getHealthColor(health))} />
            <h3 className="font-semibold text-foreground truncate">{offer.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
            <span>{offer.niche}</span>
            <span>•</span>
            <span>{offer.country}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
        {/* Spend Column */}
        {/* min-w-0 é essencial para o grid permitir a quebra de linha interna */}
        <div className="space-y-3 min-w-0">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground truncate">Spend Total</p>
            <p className="text-sm font-semibold break-words leading-tight">
              {formatCurrency(offer.metrics.spendTotal)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground truncate">Spend Hoje</p>
            <p className="text-sm font-medium break-words leading-tight">{formatCurrency(offer.metrics.spendToday)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground truncate">Spend 7d</p>
            <p className="text-sm font-medium break-words leading-tight">{formatCurrency(offer.metrics.spend7d)}</p>
          </div>
        </div>

        {/* ROAS Column */}
        <div className="space-y-3 min-w-0">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground truncate">ROAS Total</p>
            <p
              className={cn(
                "text-sm font-semibold break-words leading-tight",
                health === "success" && "text-success",
                health === "warning" && "text-warning",
                health === "danger" && "text-danger",
              )}
            >
              {formatRoas(offer.metrics.roasTotal)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground truncate">ROAS Hoje</p>
            <p className="text-sm font-medium break-words leading-tight">{formatRoas(offer.metrics.roasToday)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground truncate">ROAS 7d</p>
            <p className="text-sm font-medium break-words leading-tight">{formatRoas(offer.metrics.roas7d)}</p>
          </div>
        </div>
      </div>

      {/* Footer - Creative Badges */}
      <div className="flex items-center gap-2 pt-3 border-t border-border mt-auto">
        <Badge variant="secondary" className="text-xs whitespace-nowrap">
          {offer.creativesCount.active} Liberados
        </Badge>
        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {offer.creativesCount.testing} Em Teste
        </Badge>
      </div>
    </Card>
  );
}
