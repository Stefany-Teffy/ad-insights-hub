import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Search, Image, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { formatCurrency, formatRoas } from '@/lib/metrics';

export default function ArchivedCreatives() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [offerFilter, setOfferFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [copywriterFilter, setCopywriterFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<typeof mockCreatives[0] | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState('');

  // For demo purposes, show all creatives as "archived"
  const archivedCreatives = mockCreatives.filter((creative) => {
    const matchesSearch = creative.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOffer = offerFilter === 'all' || creative.offerId === offerFilter;
    const matchesSource = sourceFilter === 'all' || creative.source === sourceFilter;
    const matchesCopywriter = copywriterFilter === 'all' || creative.copywriter === copywriterFilter;
    return matchesSearch && matchesOffer && matchesSource && matchesCopywriter;
  });

  const getOfferName = (offerId: string) => {
    const offer = mockOffers.find((o) => o.id === offerId);
    return offer?.name || 'N/A';
  };

  const getOfferThresholds = (offerId: string) => {
    const offer = mockOffers.find((o) => o.id === offerId);
    return offer?.thresholds || { roas: { green: 1.3, yellow: 1.1 }, ic: { green: 50, yellow: 60 }, cpc: { green: 1.5, yellow: 2 } };
  };

  const handleDeleteClick = (creative: typeof mockCreatives[0]) => {
    setSelectedCreative(creative);
    setDeleteConfirmId('');
    setIsDeleteDialogOpen(true);
  };

  const handleRestoreClick = (creative: typeof mockCreatives[0]) => {
    setSelectedCreative(creative);
    setIsRestoreDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCreative && deleteConfirmId === selectedCreative.id) {
      // In a real app, this would delete the creative
      setIsDeleteDialogOpen(false);
      setSelectedCreative(null);
      setDeleteConfirmId('');
    }
  };

  const handleConfirmRestore = () => {
    // In a real app, this would restore the creative
    setIsRestoreDialogOpen(false);
    setSelectedCreative(null);
  };

  const isDeleteEnabled = selectedCreative && deleteConfirmId === selectedCreative.id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/criativos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Criativos Arquivados</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie criativos arquivados ou exclua permanentemente</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar criativo arquivado..."
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
              <TableHead>Data Criação</TableHead>
              <TableHead className="w-[60px]">Thumb</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Oferta</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Copywriter</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
              <TableHead className="text-right">IC</TableHead>
              <TableHead className="text-right">CPC</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archivedCreatives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                  Nenhum criativo arquivado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              archivedCreatives.map((creative) => {
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
                    <TableCell className="font-mono text-sm">{creative.id}</TableCell>
                    <TableCell>{getOfferName(creative.offerId)}</TableCell>
                    <TableCell>
                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        creative.source === 'FB' 
                          ? 'bg-info/10 text-info' 
                          : creative.source === 'YT'
                          ? 'bg-danger/10 text-danger'
                          : 'bg-purple-500/10 text-purple-500'
                      }`}>
                        {creative.source === 'FB' ? 'Facebook' : creative.source === 'YT' ? 'YouTube' : 'TikTok'}
                      </span>
                    </TableCell>
                    <TableCell>{creative.copywriter || '-'}</TableCell>
                    <TableCell><StatusBadge status="archived" /></TableCell>
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
                          onClick={() => handleRestoreClick(creative)}
                          title="Editar criativo"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-danger hover:text-danger"
                          onClick={() => handleDeleteClick(creative)}
                          title="Excluir permanentemente"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-danger">Excluir Criativo Permanentemente</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todos os dados do criativo serão perdidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger font-medium mb-2">
                Você está prestes a excluir: <strong>{selectedCreative?.id}</strong>
              </p>
              <p className="text-xs text-danger/80">
                Para confirmar, digite exatamente o ID do criativo abaixo:
              </p>
              <p className="text-sm font-mono font-bold text-danger mt-1">
                {selectedCreative?.id}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-id">Digite o ID do criativo para confirmar</Label>
              <Input
                id="confirm-id"
                value={deleteConfirmId}
                onChange={(e) => setDeleteConfirmId(e.target.value)}
                placeholder="Digite o ID do criativo"
                className="font-mono"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={!isDeleteEnabled}
            >
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restaurar Criativo</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja restaurar o criativo <strong>{selectedCreative?.id}</strong>? 
              Ele voltará para a lista de criativos ativos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore}>
              Restaurar Criativo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
