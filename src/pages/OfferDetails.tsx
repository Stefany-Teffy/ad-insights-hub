import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, ArrowUpDown, CalendarIcon, Copy, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KPICard } from '@/components/KPICard';
import { MetricBadge, StatusBadge } from '@/components/MetricBadge';
import { getOfferById, getCreativesBySource, copywriters, type Creative, type CreativeSource } from '@/lib/mockData';
import { formatCurrency, formatRoas, getMetricStatus, getMetricClass } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type SortField = 'roas' | 'ic' | 'cpc' | 'spend' | null;
type SortDirection = 'asc' | 'desc';

export default function OfferDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isMetricDialogOpen, setIsMetricDialogOpen] = useState(false);
  const [isCreativeDialogOpen, setIsCreativeDialogOpen] = useState(false);
  const [isViewMetricsDialogOpen, setIsViewMetricsDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [dailyPeriodFilter, setDailyPeriodFilter] = useState<string>('all');
  const [copyFilter, setCopyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dailyCustomDateRange, setDailyCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  
  // Metric dialog state
  const [metricDate, setMetricDate] = useState<Date>(new Date());
  const [roasGreen, setRoasGreen] = useState('1.30');
  const [roasYellow, setRoasYellow] = useState('1.10');
  const [icGreen, setIcGreen] = useState('50.00');
  const [icYellow, setIcYellow] = useState('60.00');
  const [cpcGreen, setCpcGreen] = useState('1.50');
  const [cpcYellow, setCpcYellow] = useState('2.00');
  
  // Creative metric dialog state
  const [selectedCreativeId, setSelectedCreativeId] = useState<string>('');
  const [creativeSearchMode, setCreativeSearchMode] = useState<'select' | 'search'>('select');
  const [creativeSearchInput, setCreativeSearchInput] = useState('');
  const [creativeMetricDate, setCreativeMetricDate] = useState<Date>(new Date());

  const offer = getOfferById(id || '');

  if (!offer) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Oferta não encontrada.</p>
      </div>
    );
  }

  const fbCreatives = getCreativesBySource(offer.id, 'FB');
  const ytCreatives = getCreativesBySource(offer.id, 'YT');
  const ttCreatives = getCreativesBySource(offer.id, 'TT');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('ID copiado para a área de transferência');
  };

  const filterAndSortCreatives = (creatives: Creative[]) => {
    let filtered = creatives.filter((creative) => {
      const matchesStatus = statusFilter === 'all' || creative.status === statusFilter;
      const matchesSearch = creative.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creative.copy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCopy = copyFilter === 'all' || creative.copywriter === copyFilter;
      return matchesStatus && matchesSearch && matchesCopy;
    });

    // Sort if a field is selected
    if (sortField) {
      filtered = [...filtered].sort((a, b) => {
        const aSpend = a.metrics.reduce((sum, m) => sum + m.spend, 0);
        const aRevenue = a.metrics.reduce((sum, m) => sum + m.revenue, 0);
        const bSpend = b.metrics.reduce((sum, m) => sum + m.spend, 0);
        const bRevenue = b.metrics.reduce((sum, m) => sum + m.revenue, 0);
        
        let aValue: number, bValue: number;
        
        switch (sortField) {
          case 'roas':
            aValue = aSpend > 0 ? aRevenue / aSpend : 0;
            bValue = bSpend > 0 ? bRevenue / bSpend : 0;
            break;
          case 'spend':
            aValue = aSpend;
            bValue = bSpend;
            break;
          case 'ic':
            aValue = 45 + Math.random() * 20;
            bValue = 45 + Math.random() * 20;
            break;
          case 'cpc':
            aValue = 1.2 + Math.random() * 1;
            bValue = 1.2 + Math.random() * 1;
            break;
          default:
            return 0;
        }
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered;
  };

  const getSelectedCreative = () => {
    const allCreatives = [...fbCreatives, ...ytCreatives];
    return allCreatives.find(c => c.id === selectedCreativeId);
  };

  const getSourceLabel = (source: CreativeSource) => {
    switch (source) {
      case 'FB': return 'Facebook';
      case 'YT': return 'YouTube';
      case 'TT': return 'TikTok';
    }
  };

  const renderCreativesTable = (creatives: Creative[], source: CreativeSource) => {
    const filtered = filterAndSortCreatives(creatives);
    
    const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
      <TableHead 
        className="text-right cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center justify-end gap-1">
          {children}
          <ArrowUpDown className={cn(
            "h-3 w-3",
            sortField === field ? "text-foreground" : "text-muted-foreground"
          )} />
        </div>
      </TableHead>
    );
    
    return (
      <div className="space-y-4">
        {/* Header with button */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">
            Criativos {getSourceLabel(source)}
          </h3>
          <Dialog open={isCreativeDialogOpen} onOpenChange={setIsCreativeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Lançar Métrica Diária do Criativo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Lançar Métrica Diária do Criativo</DialogTitle>
                <DialogDescription>
                  Adicione métricas diárias para um criativo de {getSourceLabel(source)}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="grid gap-4 py-4">
                  {/* Creative selection */}
                  <div className="grid gap-2">
                    <Label>Modo de Seleção</Label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={creativeSearchMode === 'select' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCreativeSearchMode('select')}
                      >
                        Selecionar
                      </Button>
                      <Button
                        type="button"
                        variant={creativeSearchMode === 'search' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCreativeSearchMode('search')}
                      >
                        Digitar ID
                      </Button>
                    </div>
                  </div>
                  
                  {creativeSearchMode === 'select' ? (
                    <div className="grid gap-2">
                      <Label>Selecionar Criativo</Label>
                      <Select value={selectedCreativeId} onValueChange={setSelectedCreativeId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um criativo" />
                        </SelectTrigger>
                        <SelectContent>
                          {creatives.map((creative) => (
                            <SelectItem key={creative.id} value={creative.id}>
                              {creative.id} - {creative.copy}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label>ID do Criativo</Label>
                      <Input
                        placeholder="Digite o ID do criativo"
                        value={creativeSearchInput}
                        onChange={(e) => setCreativeSearchInput(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  )}

                  {/* Display selected creative info */}
                  {(selectedCreativeId || creativeSearchInput) && (
                    <div className="p-3 rounded-lg bg-muted space-y-2">
                      <div className="grid gap-2">
                        <Label className="text-muted-foreground text-xs">ID do Criativo</Label>
                        <Input 
                          value={selectedCreativeId || creativeSearchInput} 
                          disabled 
                          className="bg-background font-mono text-sm" 
                        />
                      </div>
                      {getSelectedCreative() && (
                        <>
                          <div className="grid gap-2">
                            <Label className="text-muted-foreground text-xs">Copy</Label>
                            <Input 
                              value={getSelectedCreative()?.copy || ''} 
                              disabled 
                              className="bg-background text-sm" 
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label className="text-muted-foreground text-xs">Status</Label>
                            <div className="flex">
                              <StatusBadge status={getSelectedCreative()?.status || 'active'} />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label>Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(creativeMetricDate, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={creativeMetricDate}
                          onSelect={(date) => date && setCreativeMetricDate(date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Faturamento</Label>
                      <Input type="number" placeholder="0.00" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Impressões</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Cliques</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                    <div className="grid gap-2">
                      <Label>Conversões</Label>
                      <Input type="number" placeholder="0" />
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreativeDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsCreativeDialogOpen(false)}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou Copy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Períodos</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7d</SelectItem>
              <SelectItem value="30d">Últimos 30d</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          {periodFilter === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {customDateRange.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, "dd/MM", { locale: ptBR })} - {format(customDateRange.to, "dd/MM", { locale: ptBR })}
                      </>
                    ) : (
                      format(customDateRange.from, "dd/MM/yyyy", { locale: ptBR })
                    )
                  ) : (
                    "Selecionar"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{ from: customDateRange.from, to: customDateRange.to }}
                  onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="testing">Em Teste</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={copyFilter} onValueChange={setCopyFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Copy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Copies</SelectItem>
              {copywriters.map((copy) => (
                <SelectItem key={copy} value={copy}>{copy}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Copy</TableHead>
                <SortableHeader field="spend">Spend</SortableHeader>
                <SortableHeader field="roas">ROAS</SortableHeader>
                <SortableHeader field="ic">IC</SortableHeader>
                <SortableHeader field="cpc">CPC</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum criativo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((creative) => {
                  const totalSpend = creative.metrics.reduce((sum, m) => sum + m.spend, 0);
                  const totalRevenue = creative.metrics.reduce((sum, m) => sum + m.revenue, 0);
                  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
                  const ic = 45 + Math.random() * 20;
                  const cpc = 1.2 + Math.random() * 1;

                  return (
                    <TableRow key={creative.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{creative.id}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(creative.id)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={creative.status} /></TableCell>
                      <TableCell>{creative.copy}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalSpend)}</TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={roas}
                          metricType="roas"
                          thresholds={offer.thresholds}
                          format={formatRoas}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={ic}
                          metricType="ic"
                          thresholds={offer.thresholds}
                          format={(v) => formatCurrency(v)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={cpc}
                          metricType="cpc"
                          thresholds={offer.thresholds}
                          format={(v) => formatCurrency(v)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Calculate average metrics for view metrics dialog
  const avgIc = offer.dailyMetrics.reduce((sum, m) => sum + m.ic, 0) / offer.dailyMetrics.length;
  const avgCpc = offer.dailyMetrics.reduce((sum, m) => sum + m.cpc, 0) / offer.dailyMetrics.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{offer.name}</h1>
          <p className="text-sm text-muted-foreground">{offer.niche} • {offer.country}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Metrics Dialog */}
          <Dialog open={isViewMetricsDialogOpen} onOpenChange={setIsViewMetricsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Eye className="h-4 w-4" />
                Ver Métricas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Métricas Atuais da Oferta</DialogTitle>
                <DialogDescription>
                  Valores atuais e thresholds definidos para ROAS, IC e CPC
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* ROAS */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">ROAS</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xl font-bold",
                        getMetricClass(getMetricStatus(offer.metrics.roasTotal, 'roas', offer.thresholds))
                      )}>
                        {formatRoas(offer.metrics.roasTotal)}
                      </span>
                      <span className={cn(
                        "h-3 w-3 rounded-full",
                        getMetricStatus(offer.metrics.roasTotal, 'roas', offer.thresholds) === 'success' ? 'bg-success' :
                        getMetricStatus(offer.metrics.roasTotal, 'roas', offer.thresholds) === 'warning' ? 'bg-warning' : 'bg-danger'
                      )} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      Verde: &gt; {offer.thresholds.roas.green}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      Amarelo: {offer.thresholds.roas.yellow}–{offer.thresholds.roas.green}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-danger" />
                      Vermelho: &lt; {offer.thresholds.roas.yellow}
                    </span>
                  </div>
                </div>

                {/* IC */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">IC</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xl font-bold",
                        getMetricClass(getMetricStatus(avgIc, 'ic', offer.thresholds))
                      )}>
                        {formatCurrency(avgIc)}
                      </span>
                      <span className={cn(
                        "h-3 w-3 rounded-full",
                        getMetricStatus(avgIc, 'ic', offer.thresholds) === 'success' ? 'bg-success' :
                        getMetricStatus(avgIc, 'ic', offer.thresholds) === 'warning' ? 'bg-warning' : 'bg-danger'
                      )} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      Verde: &lt; R${offer.thresholds.ic.green}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      Amarelo: R${offer.thresholds.ic.green}–R${offer.thresholds.ic.yellow}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-danger" />
                      Vermelho: &gt; R${offer.thresholds.ic.yellow}
                    </span>
                  </div>
                </div>

                {/* CPC */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">CPC</p>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xl font-bold",
                        getMetricClass(getMetricStatus(avgCpc, 'cpc', offer.thresholds))
                      )}>
                        {formatCurrency(avgCpc)}
                      </span>
                      <span className={cn(
                        "h-3 w-3 rounded-full",
                        getMetricStatus(avgCpc, 'cpc', offer.thresholds) === 'success' ? 'bg-success' :
                        getMetricStatus(avgCpc, 'cpc', offer.thresholds) === 'warning' ? 'bg-warning' : 'bg-danger'
                      )} />
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      Verde: &lt; R${offer.thresholds.cpc.green}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-warning" />
                      Amarelo: R${offer.thresholds.cpc.green}–R${offer.thresholds.cpc.yellow}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-danger" />
                      Vermelho: &gt; R${offer.thresholds.cpc.yellow}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsViewMetricsDialogOpen(false)}>Fechar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Update Metrics Dialog */}
          <Dialog open={isMetricDialogOpen} onOpenChange={setIsMetricDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Atualizar Métrica da Oferta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Atualização de Métricas da Oferta</DialogTitle>
                <DialogDescription>
                  Configure os thresholds para {offer.name}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[60vh] pr-4">
                <div className="grid gap-4 py-4">
                  {/* Locked fields */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground">Oferta</Label>
                      <Input value={offer.name} disabled className="bg-muted" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground">Nicho</Label>
                      <Input value={offer.niche} disabled className="bg-muted" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-muted-foreground">País</Label>
                      <Input value={offer.country} disabled className="bg-muted" />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Data *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(metricDate, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={metricDate}
                          onSelect={(date) => date && setMetricDate(date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* ROAS Threshold */}
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

                  {/* IC Threshold */}
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

                  {/* CPC Threshold */}
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsMetricDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsMetricDialogOpen(false)}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Spend Total"
          value={formatCurrency(offer.metrics.spendTotal)}
        />
        <KPICard
          label="ROAS Total"
          value={formatRoas(offer.metrics.roasTotal)}
          variant={getMetricStatus(offer.metrics.roasTotal, 'roas', offer.thresholds) as 'success' | 'warning' | 'danger' | 'default'}
        />
        <KPICard
          label="Faturamento"
          value={formatCurrency(offer.metrics.revenue)}
          variant="success"
        />
        <KPICard
          label="Lucro Líquido"
          value={formatCurrency(offer.metrics.profit)}
          variant={offer.metrics.profit >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="daily">Resultado Diário</TabsTrigger>
          <TabsTrigger value="fb">Criativos FB</TabsTrigger>
          <TabsTrigger value="yt">Criativos YT</TabsTrigger>
          <TabsTrigger value="tt">Criativos TT</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <div className="space-y-4">
            {/* Period filter for daily results */}
            <div className="flex items-center gap-3">
              <Select value={dailyPeriodFilter} onValueChange={setDailyPeriodFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="7d">Últimos 7d</SelectItem>
                  <SelectItem value="30d">Últimos 30d</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {dailyPeriodFilter === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {dailyCustomDateRange.from ? (
                        dailyCustomDateRange.to ? (
                          <>
                            {format(dailyCustomDateRange.from, "dd/MM", { locale: ptBR })} - {format(dailyCustomDateRange.to, "dd/MM", { locale: ptBR })}
                          </>
                        ) : (
                          format(dailyCustomDateRange.from, "dd/MM/yyyy", { locale: ptBR })
                        )
                      ) : (
                        "Selecionar"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" side="bottom" sideOffset={4}>
                    <Calendar
                      mode="range"
                      selected={{ from: dailyCustomDateRange.from, to: dailyCustomDateRange.to }}
                      onSelect={(range) => setDailyCustomDateRange({ from: range?.from, to: range?.to })}
                      numberOfMonths={2}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <Card className="p-0 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dia</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                    <TableHead className="text-right">Gastos</TableHead>
                    <TableHead className="text-right">ROAS</TableHead>
                    <TableHead className="text-right">IC</TableHead>
                    <TableHead className="text-right">CPC</TableHead>
                    <TableHead className="text-right">Lucro</TableHead>
                    <TableHead className="text-right">MC</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offer.dailyMetrics.slice(-14).reverse().map((metric) => {
                    const roasStatus = getMetricStatus(metric.roas, 'roas', offer.thresholds);
                    const icStatus = getMetricStatus(metric.ic, 'ic', offer.thresholds);
                    const cpcStatus = getMetricStatus(metric.cpc, 'cpc', offer.thresholds);

                    return (
                      <TableRow key={metric.date}>
                        <TableCell className="font-medium">
                          {new Date(metric.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(metric.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(metric.spend)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn('font-medium', getMetricClass(roasStatus))}>
                            {formatRoas(metric.roas)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn('font-medium', getMetricClass(icStatus))}>
                            {formatCurrency(metric.ic)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn('font-medium', getMetricClass(cpcStatus))}>
                            {formatCurrency(metric.cpc)}
                          </span>
                        </TableCell>
                        <TableCell className={cn(
                          'text-right font-medium',
                          metric.profit >= 0 ? 'text-success' : 'text-danger'
                        )}>
                          {formatCurrency(metric.profit)}
                        </TableCell>
                        <TableCell className="text-right">{metric.mc.toFixed(1)}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fb" className="mt-6">
          {renderCreativesTable(fbCreatives, 'FB')}
        </TabsContent>

        <TabsContent value="yt" className="mt-6">
          {renderCreativesTable(ytCreatives, 'YT')}
        </TabsContent>

        <TabsContent value="tt" className="mt-6">
          {renderCreativesTable(ttCreatives, 'TT')}
        </TabsContent>
      </Tabs>
    </div>
  );
}
