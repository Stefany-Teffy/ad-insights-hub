import { useState } from 'react';
import { Plus, Pencil, Search, ArrowUpDown, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge, MetricBadge } from '@/components/MetricBadge';
import { CreatableCombobox } from '@/components/ui/creatable-combobox';
import { PeriodoFilter, usePeriodo, type PeriodoValue } from '@/components/PeriodoFilter';
import { ThresholdsDialog } from '@/components/ThresholdsDialog';
import { formatCurrency, formatRoas, getMetricStatus, getMetricClass } from '@/lib/metrics';
import { formatDate, formatDateInput } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useOfertas,
  useCreateOferta,
  useUpdateOferta,
  useArchiveOferta,
  useNichos,
  usePaises,
  useCreateNicho,
  useCreatePais,
  useMetricasDiariasComOferta,
} from '@/hooks/useSupabase';
import { parseThresholds, type Oferta, type MetricaDiariaOfertaComJoin } from '@/services/api';

type SortField = 'roas' | 'ic' | 'cpc' | 'profit' | 'mc' | 'revenue' | 'spend' | 'date' | null;
type SortDirection = 'asc' | 'desc';

// Type alias for convenience
type MetricaDiaComOferta = MetricaDiariaOfertaComJoin;

export default function OffersManagement() {
  const navigate = useNavigate();
  const { periodo, setPeriodo } = usePeriodo('7d');
  
  // Supabase hooks - agora busca métricas diárias com JOIN na oferta
  const { data: metricasDiarias, isLoading: isLoadingMetricas, refetch: refetchMetricas } = useMetricasDiariasComOferta({
    dataInicio: periodo.dataInicio,
    dataFim: periodo.dataFim,
  });
  const { data: ofertas, refetch: refetchOfertas } = useOfertas();
  const { data: nichos, isLoading: isLoadingNichos } = useNichos();
  const { data: paises, isLoading: isLoadingPaises } = usePaises();
  
  const createOfertaMutation = useCreateOferta();
  const updateOfertaMutation = useUpdateOferta();
  const archiveOfertaMutation = useArchiveOferta();
  const createNichoMutation = useCreateNicho();
  const createPaisMutation = useCreatePais();
  
  // UI State
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isThresholdsDialogOpen, setIsThresholdsDialogOpen] = useState(false);
  const [viewingOffer, setViewingOffer] = useState<Oferta | null>(null);
  const [viewingMetrica, setViewingMetrica] = useState<MetricaDiaComOferta | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // New offer form state
  const [newOfferName, setNewOfferName] = useState('');
  const [newOfferNiche, setNewOfferNiche] = useState('');
  const [newOfferCountry, setNewOfferCountry] = useState('');
  const [newOfferStatus, setNewOfferStatus] = useState('ativo');
  const [newOfferDate, setNewOfferDate] = useState<Date>(new Date());
  const [roasGreen, setRoasGreen] = useState('1.30');
  const [roasYellow, setRoasYellow] = useState('1.10');
  const [icGreen, setIcGreen] = useState('50.00');
  const [icYellow, setIcYellow] = useState('60.00');
  const [cpcGreen, setCpcGreen] = useState('1.50');
  const [cpcYellow, setCpcYellow] = useState('2.00');
  
  // Edit form state
  const [editingOffer, setEditingOffer] = useState<Oferta | null>(null);
  const [editName, setEditName] = useState('');
  const [editNiche, setEditNiche] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editFieldsEnabled, setEditFieldsEnabled] = useState({
    name: false,
    niche: false,
    country: false,
    status: false,
  });

  // Convert nichos/paises to combobox options
  const nichosOptions = (nichos || []).map(n => ({ value: n.nome, label: n.nome }));
  const paisesOptions = (paises || []).map(p => ({ value: p.nome, label: p.nome }));

  // Refresh function
  const handleRefresh = () => {
    refetchMetricas();
    refetchOfertas();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter metrics based on search and filters
  const filteredMetricas = (metricasDiarias || []).filter((metrica) => {
    if (!metrica.oferta) return false;
    
    const matchesSearch = metrica.oferta.nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = nicheFilter === 'all' || metrica.oferta.nicho === nicheFilter;
    const matchesCountry = countryFilter === 'all' || metrica.oferta.pais === countryFilter;
    const matchesStatus = statusFilter === 'all' || metrica.oferta.status === statusFilter;
    
    // For health filter, we need thresholds
    const thresholds = parseThresholds(metrica.oferta.thresholds);
    const health = getMetricStatus(metrica.roas || 0, 'roas', {
      roas: { green: thresholds.roas.verde, yellow: thresholds.roas.amarelo },
      ic: { green: thresholds.ic.verde, yellow: thresholds.ic.amarelo },
      cpc: { green: thresholds.cpc.verde, yellow: thresholds.cpc.amarelo },
    });
    const matchesHealth = healthFilter === 'all' || health === healthFilter;
    
    return matchesSearch && matchesNiche && matchesCountry && matchesStatus && matchesHealth;
  });

  // Sort metrics
  const sortedMetricas = [...filteredMetricas].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: number, bValue: number;
    
    switch (sortField) {
      case 'roas':
        aValue = a.roas || 0;
        bValue = b.roas || 0;
        break;
      case 'ic':
        aValue = a.ic || 0;
        bValue = b.ic || 0;
        break;
      case 'cpc':
        aValue = a.cpc || 0;
        bValue = b.cpc || 0;
        break;
      case 'profit':
        aValue = a.lucro || 0;
        bValue = b.lucro || 0;
        break;
      case 'mc':
        aValue = a.mc || 0;
        bValue = b.mc || 0;
        break;
      case 'revenue':
        aValue = a.faturado || 0;
        bValue = b.faturado || 0;
        break;
      case 'spend':
        aValue = a.spend || 0;
        bValue = b.spend || 0;
        break;
      case 'date':
        aValue = new Date(a.data).getTime();
        bValue = new Date(b.data).getTime();
        break;
      default:
        return 0;
    }
    
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const resetNewOfferForm = () => {
    setNewOfferName('');
    setNewOfferNiche('');
    setNewOfferCountry('');
    setNewOfferStatus('ativo');
    setNewOfferDate(new Date());
    setRoasGreen('1.30');
    setRoasYellow('1.10');
    setIcGreen('50.00');
    setIcYellow('60.00');
    setCpcGreen('1.50');
    setCpcYellow('2.00');
  };

  const handleCreateOffer = async () => {
    if (!newOfferName || !newOfferNiche || !newOfferCountry) {
      toast.error('Preencha nome, nicho e país');
      return;
    }

    try {
      await createOfertaMutation.mutateAsync({
        nome: newOfferName,
        nicho: newOfferNiche,
        pais: newOfferCountry,
        status: newOfferStatus,
        data: format(newOfferDate, 'yyyy-MM-dd'),
        thresholds: {
          roas: { verde: parseFloat(roasGreen), amarelo: parseFloat(roasYellow) },
          ic: { verde: parseFloat(icGreen), amarelo: parseFloat(icYellow) },
          cpc: { verde: parseFloat(cpcGreen), amarelo: parseFloat(cpcYellow) },
        },
      });

      toast.success(`A oferta "${newOfferName}" foi criada com sucesso.`);

      resetNewOfferForm();
      setIsSheetOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar oferta');
    }
  };

  const handleCreateNicho = async (nome: string) => {
    await createNichoMutation.mutateAsync(nome);
    setNewOfferNiche(nome);
  };

  const handleCreatePais = async (nome: string) => {
    await createPaisMutation.mutateAsync({ nome });
    setNewOfferCountry(nome);
  };

  const handleCreateNichoEdit = async (nome: string) => {
    await createNichoMutation.mutateAsync(nome);
    setEditNiche(nome);
  };

  const handleCreatePaisEdit = async (nome: string) => {
    await createPaisMutation.mutateAsync({ nome });
    setEditCountry(nome);
  };

  const openEditSheet = (offer: Oferta) => {
    setEditingOffer(offer);
    setEditName(offer.nome);
    setEditNiche(offer.nicho);
    setEditCountry(offer.pais);
    setEditStatus(offer.status || 'ativo');
    setEditFieldsEnabled({
      name: false,
      niche: false,
      country: false,
      status: false,
    });
    setIsEditSheetOpen(true);
  };

  const openThresholdsDialog = (metrica: MetricaDiaComOferta) => {
    if (metrica.oferta) {
      setViewingOffer(metrica.oferta);
      setViewingMetrica(metrica);
    }
    setIsThresholdsDialogOpen(true);
  };

  const handleSaveEdit = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!editingOffer) return;

    try {
      const updates: Record<string, any> = {};
      
      if (editFieldsEnabled.name) updates.nome = editName;
      if (editFieldsEnabled.niche) updates.nicho = editNiche;
      if (editFieldsEnabled.country) updates.pais = editCountry;
      if (editFieldsEnabled.status) updates.status = editStatus;

      await updateOfertaMutation.mutateAsync({
        id: editingOffer.id,
        updates,
      });

      toast.success('As alterações foram salvas com sucesso.');

      setIsConfirmDialogOpen(false);
      setIsEditSheetOpen(false);
      setEditingOffer(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar oferta');
    }
  };

  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 transition-colors", className)}
      onClick={() => handleSort(field)}
    >
      <div className={cn("flex items-center gap-1", className?.includes('text-right') && "justify-end")}>
        {children}
        <ArrowUpDown className={cn(
          "h-3 w-3",
          sortField === field ? "text-foreground" : "text-muted-foreground"
        )} />
      </div>
    </TableHead>
  );

  const getOfferThresholds = (offer: Oferta | null) => {
    const t = parseThresholds(offer?.thresholds);
    return {
      roas: { green: t.roas.verde, yellow: t.roas.amarelo },
      ic: { green: t.ic.verde, yellow: t.ic.amarelo },
      cpc: { green: t.cpc.verde, yellow: t.cpc.amarelo },
    };
  };

  const mapStatusToDisplay = (status: string): 'active' | 'paused' | 'archived' => {
    switch (status) {
      case 'ativo': return 'active';
      case 'pausado': return 'paused';
      case 'arquivado': return 'archived';
      default: return 'active';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Ofertas</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre e gerencie suas ofertas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={handleRefresh}
            disabled={isLoadingMetricas}
          >
            {isLoadingMetricas ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Oferta
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[500px] sm:max-w-lg">
              <SheetHeader>
                <SheetTitle>Nova Oferta</SheetTitle>
                <SheetDescription>
                  Cadastre uma nova oferta no sistema
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-180px)] pr-4">
                <div className="grid gap-4 py-6">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nome da Oferta</Label>
                    <Input 
                      id="name" 
                      placeholder="Ex: Nutra Max Pro"
                      value={newOfferName}
                      onChange={(e) => setNewOfferName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="niche">Nicho</Label>
                      <CreatableCombobox
                        options={nichosOptions}
                        value={newOfferNiche}
                        onChange={setNewOfferNiche}
                        onCreateNew={handleCreateNicho}
                        placeholder="Selecione"
                        searchPlaceholder="Buscar nicho..."
                        emptyText="Nenhum nicho encontrado"
                        createText="Criar"
                        isLoading={isLoadingNichos}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="country">País</Label>
                      <CreatableCombobox
                        options={paisesOptions}
                        value={newOfferCountry}
                        onChange={setNewOfferCountry}
                        onCreateNew={handleCreatePais}
                        placeholder="Selecione"
                        searchPlaceholder="Buscar país..."
                        emptyText="Nenhum país encontrado"
                        createText="Criar"
                        isLoading={isLoadingPaises}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newOfferStatus} onValueChange={setNewOfferStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="pausado">Pausado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* ROAS Threshold Section */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium">Thresholds – ROAS</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Defina quando o ROAS é considerado excelente, atenção ou crítico
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-success" />
                          Verde (ROAS &gt;)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={roasGreen}
                          onChange={(e) => setRoasGreen(e.target.value)}
                          placeholder="1.30"
                          className="placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-warning" />
                          Amarelo (ROAS &gt;)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={roasYellow}
                          onChange={(e) => setRoasYellow(e.target.value)}
                          placeholder="1.10"
                          className="placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ✓ Verde: ROAS &gt; {roasGreen} (ótimo) | ⚠ Amarelo: {roasYellow}–{roasGreen} (atenção) | ✗ Vermelho: &lt; {roasYellow} (crítico)
                    </p>
                  </div>

                  {/* IC Threshold Section */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium">Thresholds – IC (Custo por Inicialização)</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Defina quando o IC é considerado excelente, atenção ou crítico
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-success" />
                          Verde (IC &lt;)
                        </Label>
                        <Input
                          type="number"
                          value={icGreen}
                          onChange={(e) => setIcGreen(e.target.value)}
                          placeholder="50.00"
                          className="placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-warning" />
                          Amarelo (IC &lt;)
                        </Label>
                        <Input
                          type="number"
                          value={icYellow}
                          onChange={(e) => setIcYellow(e.target.value)}
                          placeholder="60.00"
                          className="placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ✓ Verde: IC &lt; R${icGreen} (ótimo) | ⚠ Amarelo: R${icGreen}–R${icYellow} (atenção) | ✗ Vermelho: &gt; R${icYellow} (crítico)
                    </p>
                  </div>

                  {/* CPC Threshold Section */}
                  <div className="pt-4 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium">Thresholds – CPC (Custo por Clique)</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Defina quando o CPC é considerado excelente, atenção ou crítico
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-success" />
                          Verde (CPC &lt;)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cpcGreen}
                          onChange={(e) => setCpcGreen(e.target.value)}
                          placeholder="1.50"
                          className="placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-warning" />
                          Amarelo (CPC &lt;)
                        </Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={cpcYellow}
                          onChange={(e) => setCpcYellow(e.target.value)}
                          placeholder="2.00"
                          className="placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ✓ Verde: CPC &lt; R${cpcGreen} (ótimo) | ⚠ Amarelo: R${cpcGreen}–R${cpcYellow} (atenção) | ✗ Vermelho: &gt; R${cpcYellow} (crítico)
                    </p>
                  </div>
                </div>
              </ScrollArea>
              <SheetFooter className="mt-4">
                <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateOffer}
                  disabled={createOfertaMutation.isPending}
                >
                  {createOfertaMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar Oferta
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar oferta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={nicheFilter} onValueChange={setNicheFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Nicho" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Nichos</SelectItem>
              {(nichos || []).map((niche) => (
                <SelectItem key={niche.id} value={niche.nome}>{niche.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Países</SelectItem>
              {(paises || []).map((pais) => (
                <SelectItem key={pais.id} value={pais.nome}>{pais.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={healthFilter} onValueChange={setHealthFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Saúde" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Saúdes</SelectItem>
              <SelectItem value="success">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Verde
                </div>
              </SelectItem>
              <SelectItem value="warning">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  Amarelo
                </div>
              </SelectItem>
              <SelectItem value="danger">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-danger" />
                  Vermelho
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <PeriodoFilter 
            value={periodo} 
            onChange={setPeriodo}
            showAllOption
          />
        </div>
      </Card>

      {/* Loading State */}
      {isLoadingMetricas ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Table */
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="date">Data</SortableHeader>
                <TableHead>Nome</TableHead>
                <TableHead>Nicho</TableHead>
                <TableHead>País</TableHead>
                <TableHead>Status</TableHead>
                <SortableHeader field="roas" className="text-right">ROAS</SortableHeader>
                <SortableHeader field="ic" className="text-right">IC</SortableHeader>
                <SortableHeader field="cpc" className="text-right">CPC</SortableHeader>
                <SortableHeader field="profit" className="text-right">Lucro</SortableHeader>
                <SortableHeader field="mc" className="text-right">MC</SortableHeader>
                <SortableHeader field="revenue" className="text-right">Faturamento</SortableHeader>
                <SortableHeader field="spend" className="text-right">Spend</SortableHeader>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMetricas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                    Nenhum resultado encontrado para o período selecionado
                  </TableCell>
                </TableRow>
              ) : (
                sortedMetricas.map((metrica) => {
                  if (!metrica.oferta) return null;
                  
                  const thresholds = getOfferThresholds(metrica.oferta);
                  const lucro = (metrica.faturado || 0) - (metrica.spend || 0);
                  const mc = metrica.faturado && metrica.faturado > 0 
                    ? (lucro / metrica.faturado) * 100 
                    : 0;

                  return (
                    <TableRow key={metrica.id}>
                      <TableCell>{new Date(metrica.data).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="font-medium">{metrica.oferta.nome}</TableCell>
                      <TableCell>{metrica.oferta.nicho}</TableCell>
                      <TableCell>{metrica.oferta.pais}</TableCell>
                      <TableCell><StatusBadge status={mapStatusToDisplay(metrica.oferta.status || 'ativo')} /></TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={metrica.roas || 0}
                          metricType="roas"
                          thresholds={thresholds}
                          format={formatRoas}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={metrica.ic || 0}
                          metricType="ic"
                          thresholds={thresholds}
                          format={(v) => formatCurrency(v)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={metrica.cpc || 0}
                          metricType="cpc"
                          thresholds={thresholds}
                          format={(v) => formatCurrency(v)}
                        />
                      </TableCell>
                      <TableCell className={`text-right font-medium ${lucro >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(lucro)}
                      </TableCell>
                      <TableCell className="text-right">{mc.toFixed(1)}%</TableCell>
                      <TableCell className="text-right">{formatCurrency(metrica.faturado || 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(metrica.spend || 0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openThresholdsDialog(metrica)}
                            title="Ver métricas"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => metrica.oferta && openEditSheet(metrica.oferta)}
                            title="Editar oferta"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Thresholds Dialog */}
      <ThresholdsDialog
        open={isThresholdsDialogOpen}
        onOpenChange={setIsThresholdsDialogOpen}
        oferta={viewingOffer}
        metricas={{
          roas: viewingMetrica?.roas || 0,
          ic: viewingMetrica?.ic || 0,
          cpc: viewingMetrica?.cpc || 0,
        }}
      />

      {/* Edit Sheet */}
      <Sheet open={isEditSheetOpen} onOpenChange={setIsEditSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Editar Oferta</SheetTitle>
            <SheetDescription>
              Selecione os campos que deseja editar
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-180px)] pr-4">
            <div className="grid gap-4 py-6">
              {/* Name field */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-name-check"
                    checked={editFieldsEnabled.name}
                    onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, name: !!checked }))}
                  />
                  <Label htmlFor="edit-name-check">Nome da Oferta</Label>
                </div>
                <Input 
                  id="edit-name" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={!editFieldsEnabled.name}
                  className={!editFieldsEnabled.name ? 'bg-muted' : ''}
                />
              </div>

              {/* Niche and Country */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-niche-check"
                      checked={editFieldsEnabled.niche}
                      onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, niche: !!checked }))}
                    />
                    <Label htmlFor="edit-niche-check">Nicho</Label>
                  </div>
                  <CreatableCombobox
                    options={nichosOptions}
                    value={editNiche}
                    onChange={setEditNiche}
                    onCreateNew={handleCreateNichoEdit}
                    placeholder="Selecione"
                    searchPlaceholder="Buscar nicho..."
                    emptyText="Nenhum nicho encontrado"
                    createText="Criar"
                    isLoading={isLoadingNichos}
                    disabled={!editFieldsEnabled.niche}
                    className={!editFieldsEnabled.niche ? 'bg-muted' : ''}
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-country-check"
                      checked={editFieldsEnabled.country}
                      onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, country: !!checked }))}
                    />
                    <Label htmlFor="edit-country-check">País</Label>
                  </div>
                  <CreatableCombobox
                    options={paisesOptions}
                    value={editCountry}
                    onChange={setEditCountry}
                    onCreateNew={handleCreatePaisEdit}
                    placeholder="Selecione"
                    searchPlaceholder="Buscar país..."
                    emptyText="Nenhum país encontrado"
                    createText="Criar"
                    isLoading={isLoadingPaises}
                    disabled={!editFieldsEnabled.country}
                    className={!editFieldsEnabled.country ? 'bg-muted' : ''}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-status-check"
                    checked={editFieldsEnabled.status}
                    onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, status: !!checked }))}
                  />
                  <Label htmlFor="edit-status-check">Status</Label>
                </div>
                <Select 
                  value={editStatus} 
                  onValueChange={setEditStatus}
                  disabled={!editFieldsEnabled.status}
                >
                  <SelectTrigger className={!editFieldsEnabled.status ? 'bg-muted' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Edit date (locked) */}
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Data de Edição</Label>
                <Input 
                  value={format(new Date(), "dd/MM/yyyy", { locale: ptBR })}
                  disabled 
                  className="bg-muted" 
                />
              </div>
            </div>
          </ScrollArea>
          <SheetFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsEditSheetOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEdit}
              disabled={updateOfertaMutation.isPending}
            >
              {updateOfertaMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Alterações
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alterações</DialogTitle>
            <DialogDescription>
              Revise as informações antes de confirmar
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Nome</Label>
              <Input value={editName} disabled className="bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Nicho</Label>
                <Input value={editNiche} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">País</Label>
                <Input value={editCountry} disabled className="bg-muted" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Status</Label>
              <div className="flex items-center">
                <StatusBadge status={mapStatusToDisplay(editStatus)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmEdit}
              disabled={updateOfertaMutation.isPending}
            >
              {updateOfertaMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
