import { useState } from 'react';
import { Plus, Pencil, Archive, Search, Image, ArrowUpDown, CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
import { StatusBadge, MetricBadge } from '@/components/MetricBadge';
import { mockCreatives, mockOffers, copywriters } from '@/lib/mockData';
import { formatCurrency, formatRoas, getMetricStatus } from '@/lib/metrics';
import { cn } from '@/lib/utils';

type SortField = 'roas' | 'ic' | 'cpc' | 'date' | null;
type SortDirection = 'asc' | 'desc';

export default function CreativesManagement() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [offerFilter, setOfferFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copywriterFilter, setCopywriterFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [newCreativeDate, setNewCreativeDate] = useState<Date>(new Date());

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

  const handleArchive = (creativeId: string) => {
    navigate('/criativos-arquivados');
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Cadastro de Criativo</DialogTitle>
              <DialogDescription>
                Adicione um novo criativo ao banco de dados
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="offer">Oferta *</Label>
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
                <Label htmlFor="id">ID Único *</Label>
                <Input id="id" placeholder="Ex: ID01_OFERTA_WL1" className="font-mono" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="source">Fonte *</Label>
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
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Data</Label>
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
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={copywriterFilter} onValueChange={setCopywriterFilter}>
            <SelectTrigger className="w-[150px]">
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
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo Período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7d</SelectItem>
              <SelectItem value="30d">Últimos 30d</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Thumb</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Oferta</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Copywriter</TableHead>
              <TableHead>Status</TableHead>
              <SortableHeader field="date">Data</SortableHeader>
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
                    <TableCell>
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Image className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{creative.id}</TableCell>
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
                    <TableCell>{new Date(creative.createdAt).toLocaleDateString('pt-BR')}</TableCell>
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
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-warning hover:text-warning"
                          onClick={() => handleArchive(creative.id)}
                        >
                          <Archive className="h-4 w-4" />
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
    </div>
  );
}
