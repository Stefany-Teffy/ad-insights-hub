import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatCurrency, formatRoas, getOfferHealth, getHealthColor } from "@/lib/metrics";
import { parseThresholds, type Oferta } from "@/services/api";

interface OfferCardProps {
  oferta: Oferta;
}

// Convert thresholds to format expected by metrics utils
function convertThresholds(thresholds: ReturnType<typeof parseThresholds>) {
  return {
    roas: { green: thresholds.roas.verde, yellow: thresholds.roas.amarelo },
    ic: { green: thresholds.ic.verde, yellow: thresholds.ic.amarelo },
    cpc: { green: thresholds.cpc.verde, yellow: thresholds.cpc.amarelo },
  };
}

export function OfferCard({ oferta }: OfferCardProps) {
  const navigate = useNavigate();
  const thresholds = convertThresholds(parseThresholds(oferta.thresholds));
  
  // Placeholder metrics - in a complete implementation, these would come from 
  // aggregated metrics per offer (metricas_diarias_oferta view/query)
  const metrics = {
    spendTotal: 0,
    spendToday: 0,
    spend7d: 0,
    roasTotal: 0,
    roasToday: 0,
    roas7d: 0,
  };
  
  // Placeholder creative counts - would come from a separate query
  const creativesCount = {
    liberado: 0,
    em_teste: 0,
    nao_validado: 0,
  };
  
  const health = getOfferHealth(metrics.roasTotal, thresholds);

  return (
    <Card
      onClick={() => navigate(`/ofertas/${oferta.id}`)}
      className="cursor-pointer p-4 shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-primary/20 active:scale-[0.99]"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={cn("h-2.5 w-2.5 rounded-full", getHealthColor(health))} />
            <h3 className="font-semibold text-foreground">{oferta.nome}</h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{oferta.nicho}</span>
            <span>•</span>
            <span>{oferta.pais}</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Spend Column */}
        <div className="space-y-3">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Spend Total</p>
            <p className="text-xs font-semibold">{formatCurrency(metrics.spendTotal)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Spend Hoje</p>
            <p className="text-xs font-medium">{formatCurrency(metrics.spendToday)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Spend 7d</p>
            <p className="text-xs font-medium">{formatCurrency(metrics.spend7d)}</p>
          </div>
        </div>

        {/* ROAS Column */}
        <div className="space-y-3">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">ROAS Total</p>
            <p
              className={cn(
                "text-sm font-semibold",
                health === "success" && "text-success",
                health === "warning" && "text-warning",
                health === "danger" && "text-danger",
              )}
            >
              {formatRoas(metrics.roasTotal)}
            </p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">ROAS Hoje</p>
            <p className="text-sm font-medium">{formatRoas(metrics.roasToday)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">ROAS 7d</p>
            <p className="text-sm font-medium">{formatRoas(metrics.roas7d)}</p>
          </div>
        </div>
      </div>

      {/* Footer - Creative Badges */}
      <div className="flex items-center gap-2 pt-3 border-t border-border flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {creativesCount.liberado} Liberados
        </Badge>
        <Badge variant="outline" className="text-xs">
          {creativesCount.em_teste} Em Teste
        </Badge>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {creativesCount.nao_validado} Não Validados
        </Badge>
      </div>
    </Card>
  );
}
