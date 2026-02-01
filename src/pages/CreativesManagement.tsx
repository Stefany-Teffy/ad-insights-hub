import { useState } from 'react';
import { Plus, Pencil, Search, Image, ArrowUpDown, CalendarIcon, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
import { StatusBadge, MetricBadge } from '@/components/MetricBadge';
import { mockCreatives, mockOffers, copywriters } from '@/lib/mockData';
import { formatCurrency, formatRoas, getMetricStatus } from '@/lib/metrics';
import { cn } from '@/lib/utils';

type SortField = 'roas' | 'ic' | 'cpc' | 'date' | null;
type SortDirection = 'asc' | 'desc';

export default function CreativesManagement() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [offerFilter, setOfferFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copywriterFilter, setCopywriterFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [newCreativeDate, setNewCreativeDate] = useState<Date>(new Date());
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  // Edit state
  const [editingCreative, setEditingCreative] = useState<typeof mockCreatives[0] | null>(null);
  const [editOffer, setEditOffer] = useState('');
  const [editId, setEditId] = useState('');
  const [editSource, setEditSource] = useState('');
  const [editCopywriter, setEditCopywriter] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editUrl, setEditUrl] = useState('');
  const [editObservations, setEditObservations] = useState('');
  const [editFieldsEnabled, setEditFieldsEnabled] = useState({
    offer: false,
    id: false,
    source: false,
    copywriter: false,
    status: false,
    startDate: false,
    url: false,
    observations: false,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredCreatives = mockCreatives.filter((creative) => {
    const matchesSearch = creative.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOffer = offerFilter === 'all' || creative.offerId === offerFilter;
    const matchesSource = sourceFilter === 'all' || creative.source === sourceFilter;
    const matchesStatus = statusFilter === 'all' || creative.status === statusFilter;
    const matchesCopywriter = copywriterFilter === 'all' || creative.copywriter === copywriterFilter;
    
    return matchesSearch && matchesOffer && matchesSource && matchesStatus && matchesCopywriter;
  });

  const sortedCreatives = [...filteredCreatives].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: number, bValue: number;
    
    const aSpend = a.metrics.reduce((sum, m) => sum + m.spend, 0);
    const aRevenue = a.metrics.reduce((sum, m) => sum + m.revenue, 0);
    const bSpend = b.metrics.reduce((sum, m) => sum + m.spend, 0);
    const bRevenue = b.metrics.reduce((sum, m) => sum + m.revenue, 0);
    
    switch (sortField) {
      case 'roas':
        aValue = aSpend > 0 ? aRevenue / aSpend : 0;
        bValue = bSpend > 0 ? bRevenue / bSpend : 0;
        break;
      case 'ic':
        aValue = 45 + (a.id.length % 20);
        bValue = 45 + (b.id.length % 20);
        break;
      case 'cpc':
        aValue = 1.2 + (a.id.length % 10) / 10;
        bValue = 1.2 + (b.id.length % 10) / 10;
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

  const getOfferName = (offerId: string) => {
    const offer = mockOffers.find((o) => o.id === offerId);
    return offer?.name || 'N/A';
  };

  const getOfferThresholds = (offerId: string) => {
    const offer = mockOffers.find((o) => o.id === offerId);
    return offer?.thresholds || { roas: { green: 1.3, yellow: 1.1 }, ic: { green: 50, yellow: 60 }, cpc: { green: 1.5, yellow: 2 } };
  };

  const openEditDialog = (creative: typeof mockCreatives[0]) => {
    setEditingCreative(creative);
    setEditOffer(creative.offerId);
    setEditId(creative.id);
    setEditSource(creative.source);
    setEditCopywriter(creative.copywriter || '');
    setEditStatus(creative.status);
    setEditStartDate(new Date(creative.createdAt));
    setEditUrl('');
    setEditObservations('');
    setEditFieldsEnabled({
      offer: false,
      id: false,
      source: false,
      copywriter: false,
      status: false,
      startDate: false,
      url: false,
      observations: false,
    });
    setIsEditDialogOpen(true);
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
          <h1 className="text-2xl font-bold text-foreground">Gestão de Criativos</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre e gerencie seus criativos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Criativo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Cadastro de Criativo</DialogTitle>
              <DialogDescription>
                Adicione um novo criativo ao banco de dados
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="offer">Oferta</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma oferta" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockOffers.map((offer) => (
                        <SelectItem key={offer.id} value={offer.id}>{offer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="id">ID Único</Label>
                  <Input id="id" placeholder="Ex: ID01_OFERTA_WL1" className="font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="source">Fonte</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FB">Facebook</SelectItem>
                        <SelectItem value="YT">YouTube</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="copywriter">Copywriter</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {copywriters.map((copywriter) => (
                          <SelectItem key={copywriter} value={copywriter}>{copywriter}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select defaultValue="testing">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="testing">Em Teste</SelectItem>
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
                          {format(newCreativeDate, "dd/MM/yyyy", { locale: ptBR })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={newCreativeDate}
                          onSelect={(date) => date && setNewCreativeDate(date)}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">URL do Vídeo/Imagem</Label>
                  <Input id="url" placeholder="https://..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea
                    id="observations"
                    placeholder="Anotações sobre o criativo..."
                    rows={3}
                  />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>Criar Criativo</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={offerFilter} onValueChange={setOfferFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Oferta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Ofertas</SelectItem>
              {mockOffers.map((offer) => (
                <SelectItem key={offer.id} value={offer.id}>{offer.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Fontes</SelectItem>
              <SelectItem value="FB">Facebook</SelectItem>
              <SelectItem value="YT">YouTube</SelectItem>
              <SelectItem value="TT">TikTok</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="testing">Em Teste</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={copywriterFilter} onValueChange={setCopywriterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Copywriter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Copywriters</SelectItem>
              {copywriters.map((copy) => (
                <SelectItem key={copy} value={copy}>{copy}</SelectItem>
              ))}
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
              <TableHead className="w-[60px]">Thumb</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Oferta</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Copywriter</TableHead>
              <TableHead>Status</TableHead>
              <SortableHeader field="roas" className="text-right">ROAS</SortableHeader>
              <SortableHeader field="ic" className="text-right">IC</SortableHeader>
              <SortableHeader field="cpc" className="text-right">CPC</SortableHeader>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCreatives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  Nenhum criativo encontrado.
                </TableCell>
              </TableRow>
            ) : (
              sortedCreatives.map((creative) => {
                const totalSpend = creative.metrics.reduce((sum, m) => sum + m.spend, 0);
                const totalRevenue = creative.metrics.reduce((sum, m) => sum + m.revenue, 0);
                const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
                const ic = 45 + (creative.id.length % 20);
                const cpc = 1.2 + (creative.id.length % 10) / 10;
                const thresholds = getOfferThresholds(creative.offerId);

                return (
                  <TableRow key={creative.id}>
                    <TableCell>{new Date(creative.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Image className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{creative.id}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            navigator.clipboard.writeText(creative.id);
                            import('sonner').then(({ toast }) => toast.success('ID copiado!'));
                          }}
                          title="Copiar ID"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{getOfferName(creative.offerId)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        creative.source === 'FB' 
                          ? 'bg-info/10 text-info' 
                          : 'bg-danger/10 text-danger'
                      }`}>
                        {creative.source === 'FB' ? 'Facebook' : 'YouTube'}
                      </span>
                    </TableCell>
                    <TableCell>{creative.copywriter || '-'}</TableCell>
                    <TableCell><StatusBadge status={creative.status} /></TableCell>
                    <TableCell className="text-right">
                      <MetricBadge
                        value={roas}
                        metricType="roas"
                        thresholds={thresholds}
                        format={formatRoas}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <MetricBadge
                        value={ic}
                        metricType="ic"
                        thresholds={thresholds}
                        format={(v) => formatCurrency(v)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <MetricBadge
                        value={cpc}
                        metricType="cpc"
                        thresholds={thresholds}
                        format={(v) => formatCurrency(v)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => openEditDialog(creative)}
                          title="Editar criativo"
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Editar Criativo</DialogTitle>
            <DialogDescription>
              Selecione os campos que deseja editar
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="grid gap-4 py-4">
              {/* Offer field */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-offer-check"
                    checked={editFieldsEnabled.offer}
                    onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, offer: !!checked }))}
                  />
                  <Label htmlFor="edit-offer-check">Oferta</Label>
                </div>
                <Select 
                  value={editOffer} 
                  onValueChange={setEditOffer}
                  disabled={!editFieldsEnabled.offer}
                >
                  <SelectTrigger className={!editFieldsEnabled.offer ? 'bg-muted' : ''}>
                    <SelectValue placeholder="Selecione uma oferta" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockOffers.map((offer) => (
                      <SelectItem key={offer.id} value={offer.id}>{offer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ID field */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-id-check"
                    checked={editFieldsEnabled.id}
                    onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, id: !!checked }))}
                  />
                  <Label htmlFor="edit-id-check">ID Único</Label>
                </div>
                <Input 
                  value={editId}
                  onChange={(e) => setEditId(e.target.value)}
                  className={cn("font-mono", !editFieldsEnabled.id && 'bg-muted')}
                  disabled={!editFieldsEnabled.id}
                />
              </div>

              {/* Source and Copywriter */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-source-check"
                      checked={editFieldsEnabled.source}
                      onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, source: !!checked }))}
                    />
                    <Label htmlFor="edit-source-check">Fonte</Label>
                  </div>
                  <Select 
                    value={editSource} 
                    onValueChange={setEditSource}
                    disabled={!editFieldsEnabled.source}
                  >
                    <SelectTrigger className={!editFieldsEnabled.source ? 'bg-muted' : ''}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FB">Facebook</SelectItem>
                      <SelectItem value="YT">YouTube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit-copywriter-check"
                      checked={editFieldsEnabled.copywriter}
                      onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, copywriter: !!checked }))}
                    />
                    <Label htmlFor="edit-copywriter-check">Copywriter</Label>
                  </div>
                  <Select 
                    value={editCopywriter} 
                    onValueChange={setEditCopywriter}
                    disabled={!editFieldsEnabled.copywriter}
                  >
                    <SelectTrigger className={!editFieldsEnabled.copywriter ? 'bg-muted' : ''}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {copywriters.map((copywriter) => (
                        <SelectItem key={copywriter} value={copywriter}>{copywriter}</SelectItem>
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
                      <SelectItem value="testing">Em Teste</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
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

              {/* URL field */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-url-check"
                    checked={editFieldsEnabled.url}
                    onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, url: !!checked }))}
                  />
                  <Label htmlFor="edit-url-check">URL do Vídeo/Imagem</Label>
                </div>
                <Input 
                  value={editUrl}
                  onChange={(e) => setEditUrl(e.target.value)}
                  placeholder="https://..."
                  className={!editFieldsEnabled.url ? 'bg-muted' : ''}
                  disabled={!editFieldsEnabled.url}
                />
              </div>

              {/* Observations field */}
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-observations-check"
                    checked={editFieldsEnabled.observations}
                    onCheckedChange={(checked) => setEditFieldsEnabled(prev => ({ ...prev, observations: !!checked }))}
                  />
                  <Label htmlFor="edit-observations-check">Observações</Label>
                </div>
                <Textarea
                  value={editObservations}
                  onChange={(e) => setEditObservations(e.target.value)}
                  placeholder="Anotações sobre o criativo..."
                  rows={3}
                  className={!editFieldsEnabled.observations ? 'bg-muted' : ''}
                  disabled={!editFieldsEnabled.observations}
                />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
