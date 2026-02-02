import { useState } from 'react';
import { Plus, Pencil, Search, ArrowUpDown, CalendarIcon, Eye } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge, MetricBadge } from '@/components/MetricBadge';
import { mockOffers, niches, countries } from '@/lib/mockData';
import { formatCurrency, formatRoas, getMetricStatus, getMetricClass } from '@/lib/metrics';
import { cn } from '@/lib/utils';

type SortField = 'roas' | 'ic' | 'cpc' | 'profit' | 'mc' | 'revenue' | 'spend' | 'date' | null;
type SortDirection = 'asc' | 'desc';

export default function OffersManagement() {
  const navigate = useNavigate();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isViewMetricsDialogOpen, setIsViewMetricsDialogOpen] = useState(false);
  const [viewingOffer, setViewingOffer] = useState<typeof mockOffers[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  
  // New offer form state
  const [newOfferDate, setNewOfferDate] = useState<Date>(new Date());
  const [roasGreen, setRoasGreen] = useState('1.30');
  const [roasYellow, setRoasYellow] = useState('1.10');
  const [icGreen, setIcGreen] = useState('50.00');
  const [icYellow, setIcYellow] = useState('60.00');
  const [cpcGreen, setCpcGreen] = useState('1.50');
  const [cpcYellow, setCpcYellow] = useState('2.00');
  
  // Edit form state
  const [editingOffer, setEditingOffer] = useState<typeof mockOffers[0] | null>(null);
  const [editName, setEditName] = useState('');
  const [editNiche, setEditNiche] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editFieldsEnabled, setEditFieldsEnabled] = useState({
    name: false,
    niche: false,
    country: false,
    status: false,
    startDate: false,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredOffers = mockOffers.filter((offer) => {
    const matchesSearch = offer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = nicheFilter === 'all' || offer.niche === nicheFilter;
    const matchesCountry = countryFilter === 'all' || offer.country === countryFilter;
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    const health = getMetricStatus(offer.metrics.roasTotal, 'roas', offer.thresholds);
    const matchesHealth = healthFilter === 'all' || health === healthFilter;
    
    return matchesSearch && matchesNiche && matchesCountry && matchesStatus && matchesHealth;
  });

  const sortedOffers = [...filteredOffers].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: number, bValue: number;
    const aIc = a.dailyMetrics.reduce((sum, m) => sum + m.ic, 0) / a.dailyMetrics.length;
    const bIc = b.dailyMetrics.reduce((sum, m) => sum + m.ic, 0) / b.dailyMetrics.length;
    const aCpc = a.dailyMetrics.reduce((sum, m) => sum + m.cpc, 0) / a.dailyMetrics.length;
    const bCpc = b.dailyMetrics.reduce((sum, m) => sum + m.cpc, 0) / b.dailyMetrics.length;
    const aMc = a.dailyMetrics.reduce((sum, m) => sum + m.mc, 0) / a.dailyMetrics.length;
    const bMc = b.dailyMetrics.reduce((sum, m) => sum + m.mc, 0) / b.dailyMetrics.length;
    
    switch (sortField) {
      case 'roas':
        aValue = a.metrics.roasTotal;
        bValue = b.metrics.roasTotal;
        break;
      case 'ic':
        aValue = aIc;
        bValue = bIc;
        break;
      case 'cpc':
        aValue = aCpc;
        bValue = bCpc;
        break;
      case 'profit':
        aValue = a.metrics.profit;
        bValue = b.metrics.profit;
        break;
      case 'mc':
        aValue = aMc;
        bValue = bMc;
        break;
      case 'revenue':
        aValue = a.metrics.revenue;
        bValue = b.metrics.revenue;
        break;
      case 'spend':
        aValue = a.metrics.spendTotal;
        bValue = b.metrics.spendTotal;
        break;
      case 'date':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      default:
        return 0;
    }
    
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const openEditSheet = (offer: typeof mockOffers[0]) => {
    setEditingOffer(offer);
    setEditName(offer.name);
    setEditNiche(offer.niche);
    setEditCountry(offer.country);
    setEditStatus(offer.status);
    setEditStartDate(new Date(offer.createdAt));
    setEditFieldsEnabled({
      name: false,
      niche: false,
      country: false,
      status: false,
      startDate: false,
    });
    setIsEditSheetOpen(true);
  };

  const openViewMetrics = (offer: typeof mockOffers[0]) => {
    setViewingOffer(offer);
    setIsViewMetricsDialogOpen(true);
  };

  const handleSaveEdit = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmEdit = () => {
    setIsConfirmDialogOpen(false);
    setIsEditSheetOpen(false);
    setEditingOffer(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Ofertas</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre e gerencie suas ofertas</p>
        </div>
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
                  <Input id="name" placeholder="Ex: Nutra Max Pro" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="niche">Nicho</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {niches.map((niche) => (
                          <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">País</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue="active">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Data de Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(newOfferDate, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newOfferDate}
                          onSelect={(date) => date && setNewOfferDate(date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
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
              <Button onClick={() => setIsSheetOpen(false)}>Criar Oferta</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
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
              {niches.map((niche) => (
                <SelectItem key={niche} value={niche}>{niche}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Países</SelectItem>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>{country}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
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
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="date">Data Criação</SortableHeader>
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
            {sortedOffers.map((offer) => {
              const avgIc = offer.dailyMetrics.reduce((sum, m) => sum + m.ic, 0) / offer.dailyMetrics.length;
              const avgCpc = offer.dailyMetrics.reduce((sum, m) => sum + m.cpc, 0) / offer.dailyMetrics.length;
              const avgMc = offer.dailyMetrics.reduce((sum, m) => sum + m.mc, 0) / offer.dailyMetrics.length;

              return (
                <TableRow key={offer.id}>
                  <TableCell>{new Date(offer.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="font-medium">{offer.name}</TableCell>
                  <TableCell>{offer.niche}</TableCell>
                  <TableCell>{offer.country}</TableCell>
                  <TableCell><StatusBadge status={offer.status} /></TableCell>
                  <TableCell className="text-right">
                    <MetricBadge
                      value={offer.metrics.roasTotal}
                      metricType="roas"
                      thresholds={offer.thresholds}
                      format={formatRoas}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricBadge
                      value={avgIc}
                      metricType="ic"
                      thresholds={offer.thresholds}
                      format={(v) => formatCurrency(v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricBadge
                      value={avgCpc}
                      metricType="cpc"
                      thresholds={offer.thresholds}
                      format={(v) => formatCurrency(v)}
                    />
                  </TableCell>
                  <TableCell className={`text-right font-medium ${offer.metrics.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(offer.metrics.profit)}
                  </TableCell>
                  <TableCell className="text-right">{avgMc.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(offer.metrics.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(offer.metrics.spendTotal)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openViewMetrics(offer)}
                        title="Ver métricas"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => openEditSheet(offer)}
                        title="Editar oferta"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {/* View Metrics Dialog */}
      <Dialog open={isViewMetricsDialogOpen} onOpenChange={setIsViewMetricsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Métricas Atuais - {viewingOffer?.name}</DialogTitle>
            <DialogDescription>
              Valores atuais e thresholds definidos para ROAS, IC e CPC
            </DialogDescription>
          </DialogHeader>
          {viewingOffer && (
            <div className="grid gap-4 py-4">
              {/* ROAS */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">ROAS</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xl font-bold",
                      getMetricClass(getMetricStatus(viewingOffer.metrics.roasTotal, 'roas', viewingOffer.thresholds))
                    )}>
                      {formatRoas(viewingOffer.metrics.roasTotal)}
                    </span>
                    <span className={cn(
                      "h-3 w-3 rounded-full",
                      getMetricStatus(viewingOffer.metrics.roasTotal, 'roas', viewingOffer.thresholds) === 'success' ? 'bg-success' :
                      getMetricStatus(viewingOffer.metrics.roasTotal, 'roas', viewingOffer.thresholds) === 'warning' ? 'bg-warning' : 'bg-danger'
                    )} />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Verde: &gt; {viewingOffer.thresholds.roas.green}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    Amarelo: {viewingOffer.thresholds.roas.yellow}–{viewingOffer.thresholds.roas.green}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-danger" />
                    Vermelho: &lt; {viewingOffer.thresholds.roas.yellow}
                  </span>
                </div>
              </div>

              {/* IC */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">IC</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const avgIc = viewingOffer.dailyMetrics.reduce((sum, m) => sum + m.ic, 0) / viewingOffer.dailyMetrics.length;
                      return (
                        <>
                          <span className={cn(
                            "text-xl font-bold",
                            getMetricClass(getMetricStatus(avgIc, 'ic', viewingOffer.thresholds))
                          )}>
                            {formatCurrency(avgIc)}
                          </span>
                          <span className={cn(
                            "h-3 w-3 rounded-full",
                            getMetricStatus(avgIc, 'ic', viewingOffer.thresholds) === 'success' ? 'bg-success' :
                            getMetricStatus(avgIc, 'ic', viewingOffer.thresholds) === 'warning' ? 'bg-warning' : 'bg-danger'
                          )} />
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Verde: &lt; R${viewingOffer.thresholds.ic.green}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    Amarelo: R${viewingOffer.thresholds.ic.green}–R${viewingOffer.thresholds.ic.yellow}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-danger" />
                    Vermelho: &gt; R${viewingOffer.thresholds.ic.yellow}
                  </span>
                </div>
              </div>

              {/* CPC */}
              <div className="p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">CPC</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const avgCpc = viewingOffer.dailyMetrics.reduce((sum, m) => sum + m.cpc, 0) / viewingOffer.dailyMetrics.length;
                      return (
                        <>
                          <span className={cn(
                            "text-xl font-bold",
                            getMetricClass(getMetricStatus(avgCpc, 'cpc', viewingOffer.thresholds))
                          )}>
                            {formatCurrency(avgCpc)}
                          </span>
                          <span className={cn(
                            "h-3 w-3 rounded-full",
                            getMetricStatus(avgCpc, 'cpc', viewingOffer.thresholds) === 'success' ? 'bg-success' :
                            getMetricStatus(avgCpc, 'cpc', viewingOffer.thresholds) === 'warning' ? 'bg-warning' : 'bg-danger'
                          )} />
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    Verde: &lt; R${viewingOffer.thresholds.cpc.green}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-warning" />
                    Amarelo: R${viewingOffer.thresholds.cpc.green}–R${viewingOffer.thresholds.cpc.yellow}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-danger" />
                    Vermelho: &gt; R${viewingOffer.thresholds.cpc.yellow}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsViewMetricsDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <Select 
                    value={editNiche} 
                    onValueChange={setEditNiche}
                    disabled={!editFieldsEnabled.niche}
                  >
                    <SelectTrigger className={!editFieldsEnabled.niche ? 'bg-muted' : ''}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {niches.map((niche) => (
                        <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select 
                    value={editCountry} 
                    onValueChange={setEditCountry}
                    disabled={!editFieldsEnabled.country}
                  >
                    <SelectTrigger className={!editFieldsEnabled.country ? 'bg-muted' : ''}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Status and Start Date */}
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-start-date-check"
                      checked={editFieldsEnabled.startDate}
                      onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, startDate: !!checked }))}
                    />
                    <Label htmlFor="edit-start-date-check">Data de Início</Label>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editFieldsEnabled.startDate && 'bg-muted'
                        )}
                        disabled={!editFieldsEnabled.startDate}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editStartDate ? format(editStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editStartDate}
                        onSelect={setEditStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
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
            <Button onClick={handleSaveEdit}>Salvar Alterações</Button>
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
                <StatusBadge status={editStatus as 'active' | 'paused' | 'archived'} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmEdit}>Confirmar Alteração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
