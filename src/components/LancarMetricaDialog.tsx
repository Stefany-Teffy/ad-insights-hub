import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Search, ChevronLeft, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { useCriativosPorOferta, useUpsertMetricaDiaria } from "@/hooks/useSupabase";
import type { Criativo } from "@/services/api";

interface LancarMetricaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ofertaId: string;
  fonte?: string;
}

const STATUS_LABELS: Record<string, string> = {
  liberado: "Liberado",
  em_teste: "Em Teste",
  nao_validado: "Não Validado",
  pausado: "Pausado",
  arquivado: "Arquivado",
};

const STATUS_COLORS: Record<string, string> = {
  liberado: "bg-green-500/10 text-green-500 border-green-500/20",
  em_teste: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  nao_validado: "bg-muted text-muted-foreground border-border",
  pausado: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  arquivado: "bg-destructive/10 text-destructive border-destructive/20",
};

const FONTE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  youtube: "YouTube",
  tiktok: "TikTok",
  outro: "Outro",
};

type Step = 1 | 2 | 3;

export function LancarMetricaDialog({
  open,
  onOpenChange,
  ofertaId,
  fonte: fonteProp,
}: LancarMetricaDialogProps) {
  const [step, setStep] = useState<Step>(1);
  const [selectedCriativo, setSelectedCriativo] = useState<Criativo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fonteFilter, setFonteFilter] = useState<string>(fonteProp || "all");
  
  // Form fields
  const [data, setData] = useState<Date | undefined>(new Date());
  const [spend, setSpend] = useState("");
  const [faturado, setFaturado] = useState("");
  const [impressoes, setImpressoes] = useState("");
  const [cliques, setCliques] = useState("");
  const [conversoes, setConversoes] = useState("");

  const { data: criativos, isLoading: isLoadingCriativos } = useCriativosPorOferta(
    ofertaId,
    fonteProp || undefined
  );
  const upsertMetricaMutation = useUpsertMetricaDiaria();

  // Filter criativos
  const filteredCriativos = useMemo(() => {
    if (!criativos) return [];
    
    return criativos.filter((c) => {
      const matchesSearch = searchTerm === "" || 
        c.id_unico.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFonte = fonteFilter === "all" || c.fonte === fonteFilter;
      const notArchived = c.status !== "arquivado";
      return matchesSearch && matchesFonte && notArchived;
    });
  }, [criativos, searchTerm, fonteFilter]);

  const resetForm = () => {
    setStep(1);
    setSelectedCriativo(null);
    setSearchTerm("");
    setFonteFilter(fonteProp || "all");
    setData(new Date());
    setSpend("");
    setFaturado("");
    setImpressoes("");
    setCliques("");
    setConversoes("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const handleSelectCriativo = (criativo: Criativo) => {
    setSelectedCriativo(criativo);
    setStep(2);
  };

  const handleConfirm = () => {
    setStep(3);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleSave = async () => {
    if (!selectedCriativo || !data) {
      toast.error('Criativo e data são obrigatórios.');
      return;
    }

    try {
      await upsertMetricaMutation.mutateAsync({
        criativo_id: selectedCriativo.id,
        data: format(data, "yyyy-MM-dd"),
        spend: spend ? parseFloat(spend) : 0,
        faturado: faturado ? parseFloat(faturado) : 0,
        impressoes: impressoes ? parseInt(impressoes) : 0,
        cliques: cliques ? parseInt(cliques) : 0,
        conversoes: conversoes ? parseInt(conversoes) : 0,
        fonte_dados: "manual",
      });

      toast.success('Métricas salvas com sucesso!');

      handleOpenChange(false);
    } catch (error) {
      toast.error('Falha ao salvar métricas. Tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Lançar Métricas - Selecionar Criativo"}
            {step === 2 && "Lançar Métricas - Confirmar"}
            {step === 3 && "Lançar Métricas - Formulário"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Selecione o criativo para lançar as métricas diárias."}
            {step === 2 && "Confirme o criativo selecionado antes de continuar."}
            {step === 3 && "Preencha os dados das métricas do dia."}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Creative */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              {!fonteProp && (
                <Select value={fonteFilter} onValueChange={setFonteFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <ScrollArea className="h-[300px] border rounded-md">
              {isLoadingCriativos ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCriativos.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Nenhum criativo encontrado.
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredCriativos.map((criativo) => (
                    <button
                      key={criativo.id}
                      onClick={() => handleSelectCriativo(criativo)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{criativo.id_unico}</span>
                        <span className="text-xs text-muted-foreground">
                          {FONTE_LABELS[criativo.fonte] || criativo.fonte} • {criativo.copy_responsavel}
                        </span>
                      </div>
                      <Badge 
                        variant="outline"
                        className={cn(STATUS_COLORS[criativo.status || "em_teste"])}
                      >
                        {STATUS_LABELS[criativo.status || "em_teste"]}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && selectedCriativo && (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">ID Único</Label>
                  <p className="font-medium">{selectedCriativo.id_unico}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Fonte</Label>
                  <p className="font-medium">
                    {FONTE_LABELS[selectedCriativo.fonte] || selectedCriativo.fonte}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Copywriter</Label>
                  <p className="font-medium">{selectedCriativo.copy_responsavel}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge 
                    variant="outline"
                    className={cn("mt-1", STATUS_COLORS[selectedCriativo.status || "em_teste"])}
                  >
                    {STATUS_LABELS[selectedCriativo.status || "em_teste"]}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <Button onClick={handleConfirm}>
                Confirmar
                <Check className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Metrics Form */}
        {step === 3 && selectedCriativo && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
              <Badge variant="outline" className={STATUS_COLORS[selectedCriativo.status || "em_teste"]}>
                {FONTE_LABELS[selectedCriativo.fonte] || selectedCriativo.fonte}
              </Badge>
              <span className="font-medium">{selectedCriativo.id_unico}</span>
              <span className="text-muted-foreground text-sm">
                {selectedCriativo.copy_responsavel}
              </span>
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {data ? format(data, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={data}
                    onSelect={setData}
                    initialFocus
                    className="pointer-events-auto"
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Metrics Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spend">Spend (R$)</Label>
                <Input
                  id="spend"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={spend}
                  onChange={(e) => setSpend(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faturado">Faturado (R$)</Label>
                <Input
                  id="faturado"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={faturado}
                  onChange={(e) => setFaturado(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="impressoes">Impressões</Label>
                <Input
                  id="impressoes"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={impressoes}
                  onChange={(e) => setImpressoes(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliques">Cliques</Label>
                <Input
                  id="cliques"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={cliques}
                  onChange={(e) => setCliques(e.target.value)}
                />
              </div>
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="conversoes">Conversões</Label>
                <Input
                  id="conversoes"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={conversoes}
                  onChange={(e) => setConversoes(e.target.value)}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Voltar
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={upsertMetricaMutation.isPending || !data}
                >
                  {upsertMetricaMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
