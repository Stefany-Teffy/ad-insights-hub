import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Pencil, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUpdateOferta } from '@/hooks/useSupabase';
import { parseThresholds, type Oferta, type Thresholds } from '@/services/api';
import { getMetricStatus, formatRoas, formatCurrency } from '@/lib/metrics';
import { cn } from '@/lib/utils';

interface ThresholdsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  oferta: Oferta | null;
  metricas?: {
    roas: number;
    ic: number;
    cpc: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  neutral: 'bg-muted text-muted-foreground border-border',
};

export function ThresholdsDialog({
  open,
  onOpenChange,
  oferta,
  metricas = { roas: 0, ic: 0, cpc: 0 },
}: ThresholdsDialogProps) {
  const { toast } = useToast();
  const updateOfertaMutation = useUpdateOferta();

  // Mode: 'view' or 'edit'
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  
  // Edit form state
  const [roasVerde, setRoasVerde] = useState('');
  const [roasAmarelo, setRoasAmarelo] = useState('');
  const [icVerde, setIcVerde] = useState('');
  const [icAmarelo, setIcAmarelo] = useState('');
  const [cpcVerde, setCpcVerde] = useState('');
  const [cpcAmarelo, setCpcAmarelo] = useState('');
  const [validoA, setValidoA] = useState<Date>(new Date());

  // Current thresholds
  const currentThresholds = parseThresholds(oferta?.thresholds);

  // Initialize form values when dialog opens or oferta changes
  useEffect(() => {
    if (oferta && open) {
      const t = parseThresholds(oferta.thresholds);
      setRoasVerde(t.roas.verde.toString());
      setRoasAmarelo(t.roas.amarelo.toString());
      setIcVerde(t.ic.verde.toString());
      setIcAmarelo(t.ic.amarelo.toString());
      setCpcVerde(t.cpc.verde.toString());
      setCpcAmarelo(t.cpc.amarelo.toString());
      setValidoA(new Date());
      setMode('view');
    }
  }, [oferta, open]);

  // Convert to format expected by metrics utilities
  const thresholdsForMetrics = {
    roas: { green: currentThresholds.roas.verde, yellow: currentThresholds.roas.amarelo },
    ic: { green: currentThresholds.ic.verde, yellow: currentThresholds.ic.amarelo },
    cpc: { green: currentThresholds.cpc.verde, yellow: currentThresholds.cpc.amarelo },
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant="outline" className={cn(STATUS_COLORS[status])}>
        {status === 'success' ? 'Verde' : status === 'warning' ? 'Amarelo' : 'Vermelho'}
      </Badge>
    );
  };

  const handleSave = async () => {
    if (!oferta) return;

    // Validate inputs
    const newThresholds: Thresholds = {
      roas: { 
        verde: parseFloat(roasVerde) || currentThresholds.roas.verde, 
        amarelo: parseFloat(roasAmarelo) || currentThresholds.roas.amarelo 
      },
      ic: { 
        verde: parseFloat(icVerde) || currentThresholds.ic.verde, 
        amarelo: parseFloat(icAmarelo) || currentThresholds.ic.amarelo 
      },
      cpc: { 
        verde: parseFloat(cpcVerde) || currentThresholds.cpc.verde, 
        amarelo: parseFloat(cpcAmarelo) || currentThresholds.cpc.amarelo 
      },
    };

    try {
      await updateOfertaMutation.mutateAsync({
        id: oferta.id,
        updates: {
          thresholds: JSON.parse(JSON.stringify(newThresholds)),
        },
      });

      toast({
        title: 'Métricas atualizadas!',
        description: `Os thresholds da oferta "${oferta.nome}" foram atualizados com sucesso.`,
      });

      setMode('view');
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    // Reset to current values
    const t = parseThresholds(oferta?.thresholds);
    setRoasVerde(t.roas.verde.toString());
    setRoasAmarelo(t.roas.amarelo.toString());
    setIcVerde(t.ic.verde.toString());
    setIcAmarelo(t.ic.amarelo.toString());
    setCpcVerde(t.cpc.verde.toString());
    setCpcAmarelo(t.cpc.amarelo.toString());
    setMode('view');
  };

  const handleClose = () => {
    setMode('view');
    onOpenChange(false);
  };

  if (!oferta) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Métricas Esperadas</DialogTitle>
          <DialogDescription>
            Visualize e configure os thresholds de saúde da oferta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Offer Info - Always read-only */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Oferta</Label>
                <p className="font-medium">{oferta.nome}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Nicho</Label>
                <p className="font-medium">{oferta.nicho}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">País</Label>
                <p className="font-medium">{oferta.pais}</p>
              </div>
            </div>
          </div>

          <Separator />

          {mode === 'view' ? (
            <>
              {/* Current Thresholds Display */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Thresholds Atuais</h4>
                
                <div className="space-y-3">
                  {/* ROAS */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">ROAS</span>
                      <span className="text-sm text-muted-foreground">
                        Verde &gt; {currentThresholds.roas.verde.toFixed(2)} | 
                        Amarelo &gt; {currentThresholds.roas.amarelo.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatRoas(metricas.roas)}</span>
                      {getStatusBadge(getMetricStatus(metricas.roas, 'roas', thresholdsForMetrics))}
                    </div>
                  </div>

                  {/* IC */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">IC</span>
                      <span className="text-sm text-muted-foreground">
                        Verde &lt; {formatCurrency(currentThresholds.ic.verde)} | 
                        Amarelo &lt; {formatCurrency(currentThresholds.ic.amarelo)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatCurrency(metricas.ic)}</span>
                      {getStatusBadge(getMetricStatus(metricas.ic, 'ic', thresholdsForMetrics))}
                    </div>
                  </div>

                  {/* CPC */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">CPC</span>
                      <span className="text-sm text-muted-foreground">
                        Verde &lt; {formatCurrency(currentThresholds.cpc.verde)} | 
                        Amarelo &lt; {formatCurrency(currentThresholds.cpc.amarelo)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{formatCurrency(metricas.cpc)}</span>
                      {getStatusBadge(getMetricStatus(metricas.cpc, 'cpc', thresholdsForMetrics))}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
                <Button onClick={() => setMode('edit')} className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Atualizar Métricas
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Novos Thresholds</h4>

                {/* ROAS */}
                <div className="space-y-2">
                  <Label>ROAS (maior é melhor)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Verde &gt;</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={roasVerde}
                        onChange={(e) => setRoasVerde(e.target.value)}
                        placeholder="1.30"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Amarelo &gt;</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={roasAmarelo}
                        onChange={(e) => setRoasAmarelo(e.target.value)}
                        placeholder="1.10"
                      />
                    </div>
                  </div>
                </div>

                {/* IC */}
                <div className="space-y-2">
                  <Label>IC - Custo por Conversão (menor é melhor)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Verde &lt;</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={icVerde}
                        onChange={(e) => setIcVerde(e.target.value)}
                        placeholder="50.00"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Amarelo &lt;</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={icAmarelo}
                        onChange={(e) => setIcAmarelo(e.target.value)}
                        placeholder="60.00"
                      />
                    </div>
                  </div>
                </div>

                {/* CPC */}
                <div className="space-y-2">
                  <Label>CPC - Custo por Clique (menor é melhor)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Verde &lt;</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cpcVerde}
                        onChange={(e) => setCpcVerde(e.target.value)}
                        placeholder="1.50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Amarelo &lt;</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cpcAmarelo}
                        onChange={(e) => setCpcAmarelo(e.target.value)}
                        placeholder="2.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Valid from date */}
                <div className="space-y-2">
                  <Label>Válido a partir de</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(validoA, "PPP", { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={validoA}
                        onSelect={(date) => date && setValidoA(date)}
                        locale={ptBR}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={updateOfertaMutation.isPending}
                >
                  {updateOfertaMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
