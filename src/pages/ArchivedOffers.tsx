import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Search, CalendarIcon } from 'lucide-react';
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
import { mockOffers, niches, countries } from '@/lib/mockData';
import { formatCurrency, formatRoas } from '@/lib/metrics';

export default function ArchivedOffers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<typeof mockOffers[0] | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // For demo purposes, show all offers as "archived"
  const archivedOffers = mockOffers.filter((offer) => {
    const matchesSearch = offer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = nicheFilter === 'all' || offer.niche === nicheFilter;
    const matchesCountry = countryFilter === 'all' || offer.country === countryFilter;
    return matchesSearch && matchesNiche && matchesCountry;
  });

  const handleDeleteClick = (offer: typeof mockOffers[0]) => {
    setSelectedOffer(offer);
    setDeleteConfirmName('');
    setIsDeleteDialogOpen(true);
  };

  const handleRestoreClick = (offer: typeof mockOffers[0]) => {
    setSelectedOffer(offer);
    setIsRestoreDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedOffer && deleteConfirmName === selectedOffer.name) {
      // In a real app, this would delete the offer
      setIsDeleteDialogOpen(false);
      setSelectedOffer(null);
      setDeleteConfirmName('');
    }
  };

  const handleConfirmRestore = () => {
    // In a real app, this would restore the offer
    setIsRestoreDialogOpen(false);
    setSelectedOffer(null);
  };

  const isDeleteEnabled = selectedOffer && deleteConfirmName === selectedOffer.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ofertas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Ofertas Arquivadas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie ofertas arquivadas ou exclua permanentemente</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar oferta arquivada..."
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
              <TableHead>Nome</TableHead>
              <TableHead>Nicho</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
              <TableHead className="text-right">IC</TableHead>
              <TableHead className="text-right">CPC</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead className="text-right">MC</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Faturamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archivedOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center text-muted-foreground py-8">
                  Nenhuma oferta arquivada encontrada.
                </TableCell>
              </TableRow>
            ) : (
              archivedOffers.map((offer) => {
                const avgIc = offer.dailyMetrics.reduce((sum, m) => sum + m.ic, 0) / offer.dailyMetrics.length;
                const avgCpc = offer.dailyMetrics.reduce((sum, m) => sum + m.cpc, 0) / offer.dailyMetrics.length;
                const avgMc = offer.dailyMetrics.reduce((sum, m) => sum + m.mc, 0) / offer.dailyMetrics.length;

                return (
                  <TableRow key={offer.id}>
                    <TableCell>{new Date(offer.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="font-medium">{offer.name}</TableCell>
                    <TableCell>{offer.niche}</TableCell>
                    <TableCell>{offer.country}</TableCell>
                    <TableCell><StatusBadge status="archived" /></TableCell>
                    <TableCell className="text-right">{formatRoas(offer.metrics.roasTotal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(avgIc)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(avgCpc)}</TableCell>
                    <TableCell className={`text-right font-medium ${offer.metrics.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatCurrency(offer.metrics.profit)}
                    </TableCell>
                    <TableCell className="text-right">{avgMc.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{formatCurrency(offer.metrics.spendTotal)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(offer.metrics.revenue)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleRestoreClick(offer)}
                          title="Editar oferta"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-danger hover:text-danger"
                          onClick={() => handleDeleteClick(offer)}
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
            <DialogTitle className="text-danger">Excluir Oferta Permanentemente</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todos os dados da oferta serão perdidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 rounded-lg bg-danger/10 border border-danger/20">
              <p className="text-sm text-danger font-medium mb-2">
                Você está prestes a excluir: <strong>{selectedOffer?.name}</strong>
              </p>
              <p className="text-xs text-danger/80">
                Para confirmar, digite exatamente o nome da oferta abaixo:
              </p>
              <p className="text-sm font-mono font-bold text-danger mt-1">
                {selectedOffer?.name}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-name">Digite o nome da oferta para confirmar</Label>
              <Input
                id="confirm-name"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Digite o nome da oferta"
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
            <AlertDialogTitle>Restaurar Oferta</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja restaurar a oferta <strong>{selectedOffer?.name}</strong>? 
              Ela voltará para a lista de ofertas ativas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRestore}>
              Restaurar Oferta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
