import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, RotateCcw, Search, RefreshCw, Loader2 } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatusBadge } from '@/components/MetricBadge';
import { PeriodoFilter, usePeriodo } from '@/components/PeriodoFilter';
import { toast } from '@/hooks/use-toast';
import {
  useOfertasArquivadas,
  useUpdateOferta,
  useDeleteOferta,
  useNichos,
  usePaises,
} from '@/hooks/useSupabase';
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

  // Hooks
  const { data: ofertas, isLoading, refetch } = useOfertasArquivadas();
  const { data: nichos } = useNichos();
  const { data: paises } = usePaises();
  const updateOferta = useUpdateOferta();
  const deleteOferta = useDeleteOferta();

  // Filter offers
  const filteredOffers = (ofertas || []).filter((offer) => {
    const matchesSearch = offer.nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = nicheFilter === 'all' || offer.nicho === nicheFilter;
    const matchesCountry = countryFilter === 'all' || offer.pais === countryFilter;
    
    // Period filter using periodo state
    if (periodo.tipo !== 'all') {
      const createdAt = new Date(offer.created_at || '');
      const startDate = new Date(periodo.dataInicio);
      const endDate = new Date(periodo.dataFim);
      endDate.setHours(23, 59, 59, 999);
      
      if (createdAt < startDate || createdAt > endDate) return false;
    }
    
    
    return matchesSearch && matchesNiche && matchesCountry;
  });

  const handleDeleteClick = (offer: Oferta) => {
    setSelectedOffer(offer);
    setDeleteConfirmName('');
    setIsDeleteDialogOpen(true);
  };

  const handleRestore = async (offer: Oferta) => {
    try {
      await updateOferta.mutateAsync({
        id: offer.id,
        updates: { status: 'pausado' }
      });
      toast({
        title: 'Oferta restaurada',
        description: `"${offer.nome}" foi restaurada com status pausado.`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao restaurar',
        description: 'Não foi possível restaurar a oferta.',
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedOffer || deleteConfirmName !== selectedOffer.nome) return;
    
    try {
      await deleteOferta.mutateAsync(selectedOffer.id);
      toast({
        title: 'Oferta excluída',
        description: `"${selectedOffer.nome}" foi excluída permanentemente.`,
      });
      setIsDeleteDialogOpen(false);
      setSelectedOffer(null);
      setDeleteConfirmName('');
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a oferta. Verifique se não há criativos vinculados.',
        variant: 'destructive',
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: 'Dados atualizados',
      description: 'Lista de ofertas arquivadas foi atualizada.',
    });
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
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Países</SelectItem>
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
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhuma oferta arquivada encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredOffers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell>
                    {offer.created_at 
                      ? new Date(offer.created_at).toLocaleDateString('pt-BR')
                      : '-'}
                  </TableCell>
                  <TableCell className="font-medium">{offer.nome}</TableCell>
                  <TableCell>{offer.nicho}</TableCell>
                  <TableCell>{offer.pais}</TableCell>
                  <TableCell><StatusBadge status="archived" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleRestore(offer)}
                        disabled={updateOferta.isPending}
                        title="Restaurar oferta"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(offer)}
                        title="Excluir permanentemente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir Oferta Permanentemente</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. Todos os dados da oferta serão perdidos permanentemente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-2">
                Você está prestes a excluir: <strong>{selectedOffer?.nome}</strong>
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
