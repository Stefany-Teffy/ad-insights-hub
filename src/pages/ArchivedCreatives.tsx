import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, RotateCcw, Search, Image } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/MetricBadge';
import { mockCreatives, mockOffers } from '@/lib/mockData';

export default function ArchivedCreatives() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<typeof mockCreatives[0] | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState('');

  // For demo purposes, show all creatives as "archived"
  const archivedCreatives = mockCreatives.filter((creative) =>
    creative.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOfferName = (offerId: string) => {
    const offer = mockOffers.find((o) => o.id === offerId);
    return offer?.name || 'N/A';
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

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar criativo arquivado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

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
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {archivedCreatives.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  Nenhum criativo arquivado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              archivedCreatives.map((creative) => (
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
                  <TableCell><StatusBadge status="archived" /></TableCell>
                  <TableCell>{new Date(creative.createdAt).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-success hover:text-success"
                        onClick={() => handleRestoreClick(creative)}
                        title="Restaurar criativo"
                      >
                        <RotateCcw className="h-4 w-4" />
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
              ))
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
                Para confirmar, digite exatamente o ID do criativo abaixo.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-id">Digite o ID do criativo para confirmar</Label>
              <Input
                id="confirm-id"
                value={deleteConfirmId}
                onChange={(e) => setDeleteConfirmId(e.target.value)}
                placeholder={selectedCreative?.id}
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
