import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, RotateCcw, Search, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
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
import { OfferCard } from '@/components/OfferCard';
import { PeriodoFilter, usePeriodo } from '@/components/PeriodoFilter';
import { toast } from 'sonner';
import {
  useOfertasArquivadas,
  useUpdateOferta,
  useDeleteOferta,
  useRestoreOferta,
  useNichos,
  usePaises,
  useAllOffersAggregatedMetrics,
  useCreativesCountByOffer,
} from '@/hooks/useSupabase';
import { countCriativosArquivadosComOferta } from '@/services/api';
import type { Oferta } from '@/services/api';

export default function ArchivedOffers() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const { periodo, setPeriodo } = usePeriodo('all');

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Oferta | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Restore dialog state
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [offerToRestore, setOfferToRestore] = useState<Oferta | null>(null);
  const [criativosCount, setCriativosCount] = useState<number>(0);
  const [restoreCreatives, setRestoreCreatives] = useState<boolean>(true);

  // Hooks
  const { data: ofertas, isLoading, refetch } = useOfertasArquivadas();
  const { data: nichos } = useNichos();
  const { data: paises } = usePaises();
  const { data: aggregatedMetrics } = useAllOffersAggregatedMetrics();
  const { data: creativesCountByOffer } = useCreativesCountByOffer();
  const updateOferta = useUpdateOferta();
  const deleteOferta = useDeleteOferta();
  const restoreOfertaMutation = useRestoreOferta();

  // Filter offers
  const filteredOffers = (ofertas || []).filter((offer) => {
    const matchesSearch = offer.nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = nicheFilter === 'all' || offer.nicho === nicheFilter;
    const matchesCountry = countryFilter === 'all' || offer.pais === countryFilter;

    // Period filter using periodo state - filtra pela data de arquivamento
    if (periodo.tipo !== 'all') {
      // Usa archived_at se disponível, senão usa updated_at como fallback
      const archivedAt = new Date(offer.archived_at || offer.updated_at || '');
      const startDate = new Date(periodo.dataInicio);
      const endDate = new Date(periodo.dataFim);
      endDate.setHours(23, 59, 59, 999);

      if (archivedAt < startDate || archivedAt > endDate) return false;
    }

    return matchesSearch && matchesNiche && matchesCountry;
  });

  const handleDeleteClick = (offer: Oferta) => {
    setSelectedOffer(offer);
    setDeleteConfirmName('');
    setIsDeleteDialogOpen(true);
  };

  const handleRestoreClick = async (offer: Oferta) => {
    setOfferToRestore(offer);
    setRestoreCreatives(true);  // Default to restoring creatives
    // Count how many creatives were archived with this offer
    const count = await countCriativosArquivadosComOferta(offer.id);
    setCriativosCount(count);
    setIsRestoreDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!offerToRestore) return;

    try {
      await restoreOfertaMutation.mutateAsync({
        id: offerToRestore.id,
        restoreCreatives: restoreCreatives && criativosCount > 0
      });

      if (restoreCreatives && criativosCount > 0) {
        toast.success(`"${offerToRestore.nome}" foi restaurada com ${criativosCount} criativo(s).`);
      } else {
        toast.success(`"${offerToRestore.nome}" foi restaurada com status pausado.`);
      }
      setIsRestoreDialogOpen(false);
      setOfferToRestore(null);
      setCriativosCount(0);
    } catch (error) {
      toast.error('Nao foi possivel restaurar a oferta.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedOffer || deleteConfirmName !== selectedOffer.nome) return;

    try {
      await deleteOferta.mutateAsync(selectedOffer.id);
      toast.success(`"${selectedOffer.nome}" foi excluida permanentemente.`);
      setIsDeleteDialogOpen(false);
      setSelectedOffer(null);
      setDeleteConfirmName('');
    } catch (error) {
      toast.error('Nao foi possivel excluir a oferta. Verifique se nao ha criativos vinculados.');
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Lista de ofertas arquivadas foi atualizada.');
  };

  const isDeleteEnabled = selectedOffer && deleteConfirmName === selectedOffer.nome;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ofertas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Ofertas Arquivadas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredOffers.length} oferta(s) arquivada(s)
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
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
              {(nichos || []).map((nicho) => (
                <SelectItem key={nicho.id} value={nicho.nome}>{nicho.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Pais" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Paises</SelectItem>
              {(paises || []).map((pais) => (
                <SelectItem key={pais.id} value={pais.nome}>{pais.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PeriodoFilter
            value={periodo}
            onChange={setPeriodo}
            showAllOption
          />
        </div>
      </Card>

      {/* Cards Grid */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma oferta arquivada encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((offer) => (
            <div key={offer.id} className="relative">
              <OfferCard
                oferta={offer}
                metrics={aggregatedMetrics?.get(offer.id)}
                creativesCount={creativesCountByOffer?.get(offer.id)}
              />
              {/* Action icons overlay */}
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/80 hover:bg-background"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestoreClick(offer);
                  }}
                  title="Restaurar oferta"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-background/80 hover:bg-background text-destructive hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteClick(offer);
                  }}
                  title="Excluir permanentemente"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar Oferta</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja restaurar "{offerToRestore?.nome}"?
              A oferta sera restaurada com status "Pausado".
            </DialogDescription>
          </DialogHeader>

          {/* Option to restore creatives - only show if there are creatives to restore */}
          {criativosCount > 0 && (
            <div className="py-4">
              <div className="p-4 rounded-lg bg-muted/50 border">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="restore-creatives"
                    checked={restoreCreatives}
                    onChange={(e) => setRestoreCreatives(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                  />
                  <div>
                    <label htmlFor="restore-creatives" className="text-sm font-medium cursor-pointer">
                      Restaurar {criativosCount} criativo(s) arquivado(s) junto
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Apenas criativos que foram arquivados automaticamente com esta oferta serao restaurados.
                      Criativos arquivados manualmente antes permanecerao arquivados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmRestore}
              disabled={restoreOfertaMutation.isPending}
            >
              {restoreOfertaMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                'Restaurar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Oferta Permanentemente</DialogTitle>
            <DialogDescription>
              Esta acao nao pode ser desfeita. Todos os dados da oferta serao perdidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-2">
                Voce esta prestes a excluir: <strong>{selectedOffer?.nome}</strong>
              </p>
              <p className="text-xs text-destructive/80">
                Para confirmar, digite exatamente o nome da oferta abaixo:
              </p>
              <p className="text-sm font-mono font-bold text-destructive mt-1">
                {selectedOffer?.nome}
              </p>
            </div>
            <div className="grid gap-2">
              <label htmlFor="confirm-name" className="text-sm font-medium">
                Digite o nome da oferta para confirmar
              </label>
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
              disabled={!isDeleteEnabled || deleteOferta.isPending}
            >
              {deleteOferta.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Permanentemente'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
