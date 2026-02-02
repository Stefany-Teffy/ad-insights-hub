import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Pencil, Search, Image, CalendarIcon } from 'lucide-react';
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
import { formatCurrency, formatRoas } from '@/lib/metrics';
import { cn } from '@/lib/utils';

export default function ArchivedCreatives() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [offerFilter, setOfferFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [copywriterFilter, setCopywriterFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [customDateRange, setCustomDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCreative, setSelectedCreative] = useState<typeof mockCreatives[0] | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState('');

  // Edit Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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

  const openEditDialog = (creative: typeof mockCreatives[0]) => {
    setEditingCreative(creative);
    setEditOffer(creative.offerId);
    setEditId(creative.id);
    setEditSource(creative.source);
    setEditCopywriter(creative.copywriter || '');
    setEditStatus('archived');
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

  const handleConfirmDelete = () => {
    if (selectedCreative && deleteConfirmId === selectedCreative.id) {
      // In a real app, this would delete the creative
      setIsDeleteDialogOpen(false);
      setSelectedCreative(null);
      setDeleteConfirmId('');
    }
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
                          onClick={() => openEditDialog(creative)}
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
                      <SelectItem value="TT">TikTok</SelectItem>
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
                      <SelectItem value="active">Liberado</SelectItem>
                      <SelectItem value="testing">Em Teste</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="not_validated">Não Validado</SelectItem>
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
