import { useState } from 'react';
import { Plus, Pencil, Search, ArrowUpDown, Copy, RefreshCw, Loader2, CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
import { MetricBadge } from '@/components/MetricBadge';
import { VideoThumbnail } from '@/components/VideoPlayerDialog';
import { CreatableCombobox } from '@/components/ui/creatable-combobox';
import { PeriodoFilter, usePeriodo, type PeriodoValue } from '@/components/PeriodoFilter';
import { formatCurrency, formatRoas, copyToClipboard } from '@/lib/metrics';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  useCriativos,
  useOfertasAtivas,
  useCopywriters,
  useCreateCriativo,
  useUpdateCriativo,
  useArchiveCriativo,
  useCreateCopywriter,
  useCriativosComMedias,
} from '@/hooks/useSupabase';
import { parseThresholds, type Criativo } from '@/services/api';

type SortField = 'roas' | 'ic' | 'cpc' | 'date' | null;
type SortDirection = 'asc' | 'desc';

// Status mapping
const statusLabels: Record<string, string> = {
  nao_validado: 'Não Validado',
  em_teste: 'Em Teste',
  liberado: 'Liberado',
  pausado: 'Pausado',
  arquivado: 'Arquivado',
};

const statusColors: Record<string, string> = {
  liberado: 'bg-success/10 text-success border-success/20',
  em_teste: 'bg-info/10 text-info border-info/20',
  nao_validado: 'bg-muted text-muted-foreground border-border',
  pausado: 'bg-warning/10 text-warning border-warning/20',
  arquivado: 'bg-danger/10 text-danger border-danger/20',
};

const fonteLabels: Record<string, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  outro: 'Outro',
};

const fonteColors: Record<string, string> = {
  facebook: 'bg-info/10 text-info',
  youtube: 'bg-danger/10 text-danger',
  tiktok: 'bg-purple-500/10 text-purple-500',
  outro: 'bg-muted text-muted-foreground',
};

// Creative Status Badge Component
function CreativeStatusBadge({ status }: { status: string }) {
  return (
    <Badge 
      variant="outline" 
      className={cn("font-medium", statusColors[status] || statusColors.nao_validado)}
    >
      {statusLabels[status] || status}
    </Badge>
  );
}

// Fonte Badge Component
function FonteBadge({ fonte }: { fonte: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
      fonteColors[fonte] || fonteColors.outro
    )}>
      {fonteLabels[fonte] || fonte}
    </span>
  );
}

export default function CreativesManagement() {
  const navigate = useNavigate();
  // Supabase hooks
  const { data: criativos, isLoading: isLoadingCriativos, refetch } = useCriativos();
  const { data: criativosComMedias } = useCriativosComMedias();
  const { data: ofertas, isLoading: isLoadingOfertas } = useOfertasAtivas();
  const { data: copywriters, isLoading: isLoadingCopywriters } = useCopywriters();
  
  const createCriativoMutation = useCreateCriativo();
  const updateCriativoMutation = useUpdateCriativo();
  const archiveCriativoMutation = useArchiveCriativo();
  const createCopywriterMutation = useCreateCopywriter();
  
  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [offerFilter, setOfferFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copywriterFilter, setCopywriterFilter] = useState<string>('all');
  const { periodo, setPeriodo } = usePeriodo('7d');
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // New creative form state
  const [newOferta, setNewOferta] = useState('');
  const [newIdUnico, setNewIdUnico] = useState('');
  const [newFonte, setNewFonte] = useState('');
  const [newCopywriter, setNewCopywriter] = useState('');
  const [newStatus, setNewStatus] = useState('em_teste');
  const [newUrl, setNewUrl] = useState('');
  const [newObservacoes, setNewObservacoes] = useState('');

  // Edit state
  const [editingCreative, setEditingCreative] = useState<Criativo | null>(null);
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

  // Convert copywriters to combobox options
  const copywritersOptions = (copywriters || []).map(c => ({ value: c.nome, label: c.nome }));

  // Filter criativos - exclude archived
  const activeCriativos = (criativos || []).filter(c => c.status !== 'arquivado');

  // Get metrics for a creative from the view based on period
  const getCreativeMetrics = (criativoId: string) => {
    const metrics = criativosComMedias?.find(m => m.id === criativoId);
    if (!metrics) return { spend: 0, roas: 0, ic: 0, cpc: 0 };
    
    // Select metrics based on period
    if (periodo.tipo === 'today') {
      return {
        spend: metrics.spend_hoje || 0,
        roas: metrics.roas_hoje || 0,
        ic: metrics.ic_hoje || 0,
        cpc: metrics.cpc_hoje || 0,
      };
    } else if (periodo.tipo === '7d') {
      return {
        spend: metrics.spend_7d || 0,
        roas: metrics.roas_7d || 0,
        ic: metrics.ic_7d || 0,
        cpc: 0,
      };
    } else {
      // Default to 7d metrics for other periods
      return {
        spend: metrics.spend_7d || 0,
        roas: metrics.roas_7d || 0,
        ic: metrics.ic_7d || 0,
        cpc: 0,
      };
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredCreatives = activeCriativos.filter((creative) => {
    const matchesSearch = creative.id_unico.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOffer = offerFilter === 'all' || creative.oferta_id === offerFilter;
    const matchesSource = sourceFilter === 'all' || creative.fonte === sourceFilter;
    const matchesStatus = statusFilter === 'all' || creative.status === statusFilter;
    const matchesCopywriter = copywriterFilter === 'all' || creative.copy_responsavel === copywriterFilter;
    
    return matchesSearch && matchesOffer && matchesSource && matchesStatus && matchesCopywriter;
  });

  const sortedCreatives = [...filteredCreatives].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue: number, bValue: number;
    const aMetrics = getCreativeMetrics(a.id);
    const bMetrics = getCreativeMetrics(b.id);
    
    switch (sortField) {
      case 'roas':
        aValue = aMetrics.roas;
        bValue = bMetrics.roas;
        break;
      case 'ic':
        aValue = aMetrics.ic;
        bValue = bMetrics.ic;
        break;
      case 'cpc':
        aValue = aMetrics.cpc;
        bValue = bMetrics.cpc;
        break;
      case 'date':
        aValue = new Date(a.created_at || '').getTime();
        bValue = new Date(b.created_at || '').getTime();
        break;
      default:
        return 0;
    }
    
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const getOfferName = (ofertaId: string | null) => {
    if (!ofertaId) return 'N/A';
    const offer = ofertas?.find((o) => o.id === ofertaId);
    return offer?.nome || 'N/A';
  };

  const getOfferThresholds = (ofertaId: string | null) => {
    if (!ofertaId) {
      return { roas: { green: 1.3, yellow: 1.1 }, ic: { green: 50, yellow: 60 }, cpc: { green: 1.5, yellow: 2 } };
    }
    const offer = ofertas?.find((o) => o.id === ofertaId);
    if (!offer) {
      return { roas: { green: 1.3, yellow: 1.1 }, ic: { green: 50, yellow: 60 }, cpc: { green: 1.5, yellow: 2 } };
    }
    const t = parseThresholds(offer.thresholds);
    return {
      roas: { green: t.roas.verde, yellow: t.roas.amarelo },
      ic: { green: t.ic.verde, yellow: t.ic.amarelo },
      cpc: { green: t.cpc.verde, yellow: t.cpc.amarelo },
    };
  };

  const resetNewForm = () => {
    setNewOferta('');
    setNewIdUnico('');
    setNewFonte('');
    setNewCopywriter('');
    setNewStatus('em_teste');
    setNewUrl('');
    setNewObservacoes('');
  };

  const handleCreateCriativo = async () => {
    if (!newOferta || !newIdUnico || !newFonte || !newCopywriter || !newStatus || !newUrl) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Validate URL format
    try {
      new URL(newUrl);
    } catch {
      toast.error('URL inválida. Insira uma URL válida (ex: https://...)');
      return;
    }

    try {
      await createCriativoMutation.mutateAsync({
        oferta_id: newOferta,
        id_unico: newIdUnico,
        fonte: newFonte,
        copy_responsavel: newCopywriter,
        status: newStatus,
        url: newUrl || null,
        observacoes: newObservacoes || null,
      });

      toast.success(`O criativo "${newIdUnico}" foi criado com sucesso.`);

      resetNewForm();
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar criativo');
    }
  };

  const handleCreateCopywriter = async (nome: string) => {
    await createCopywriterMutation.mutateAsync(nome);
    setNewCopywriter(nome);
  };

  const handleCreateCopywriterEdit = async (nome: string) => {
    await createCopywriterMutation.mutateAsync(nome);
    setEditCopywriter(nome);
  };

  const openEditDialog = (creative: Criativo) => {
    setEditingCreative(creative);
    setEditOffer(creative.oferta_id || '');
    setEditId(creative.id_unico);
    setEditSource(creative.fonte);
    setEditCopywriter(creative.copy_responsavel || '');
    setEditStatus(creative.status || 'em_teste');
    setEditStartDate(creative.created_at ? new Date(creative.created_at) : undefined);
    setEditUrl(creative.url || '');
    setEditObservations(creative.observacoes || '');
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

  const handleSaveEdit = () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!editingCreative) return;

    try {
      const updates: Record<string, any> = {};
      
      if (editFieldsEnabled.offer) updates.oferta_id = editOffer;
      if (editFieldsEnabled.id) updates.id_unico = editId;
      if (editFieldsEnabled.source) updates.fonte = editSource;
      if (editFieldsEnabled.copywriter) updates.copy_responsavel = editCopywriter;
      if (editFieldsEnabled.status) updates.status = editStatus;
      if (editFieldsEnabled.url) updates.url = editUrl || null;
      if (editFieldsEnabled.observations) updates.observacoes = editObservations || null;

      await updateCriativoMutation.mutateAsync({
        id: editingCreative.id,
        updates,
      });

      toast.success('As alterações foram salvas com sucesso.');

      setIsConfirmDialogOpen(false);
      setIsEditDialogOpen(false);
      setEditingCreative(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar criativo');
    }
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
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => refetch()}
            disabled={isLoadingCriativos}
          >
            {isLoadingCriativos ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
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
                    <Label htmlFor="offer">Oferta *</Label>
                    <Select value={newOferta} onValueChange={setNewOferta}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma oferta" />
                      </SelectTrigger>
                      <SelectContent>
                        {(ofertas || []).map((offer) => (
                          <SelectItem key={offer.id} value={offer.id}>{offer.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="id">ID Único *</Label>
                    <Input 
                      id="id" 
                      placeholder="Ex: ID01_OFERTA_WL1" 
                      className="font-mono"
                      value={newIdUnico}
                      onChange={(e) => setNewIdUnico(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="source">Fonte *</Label>
                      <Select value={newFonte} onValueChange={setNewFonte}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="copywriter">Copywriter *</Label>
                      <CreatableCombobox
                        options={copywritersOptions}
                        value={newCopywriter}
                        onChange={setNewCopywriter}
                        onCreateNew={handleCreateCopywriter}
                        placeholder="Selecione"
                        searchPlaceholder="Buscar copywriter..."
                        emptyText="Nenhum copywriter encontrado"
                        createText="Criar"
                        isLoading={isLoadingCopywriters}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status <span className="text-destructive">*</span></Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nao_validado">Não Validado</SelectItem>
                        <SelectItem value="em_teste">Em Teste</SelectItem>
                        <SelectItem value="liberado">Liberado</SelectItem>
                        <SelectItem value="pausado">Pausado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">URL do Vídeo/Imagem <span className="text-destructive">*</span></Label>
                    <Input 
                      id="url" 
                      placeholder="https://..."
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      placeholder="Anotações sobre o criativo..."
                      rows={3}
                      value={newObservacoes}
                      onChange={(e) => setNewObservacoes(e.target.value)}
                    />
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateCriativo}
                  disabled={createCriativoMutation.isPending}
                >
                  {createCriativoMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Criar Criativo
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
              {(ofertas || []).map((offer) => (
                <SelectItem key={offer.id} value={offer.id}>{offer.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Fonte" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Fontes</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="liberado">Liberado</SelectItem>
              <SelectItem value="em_teste">Em Teste</SelectItem>
              <SelectItem value="nao_validado">Não Validado</SelectItem>
              <SelectItem value="pausado">Pausado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={copywriterFilter} onValueChange={setCopywriterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Copywriter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Copywriters</SelectItem>
              {(copywriters || []).map((copy) => (
                <SelectItem key={copy.id} value={copy.nome}>{copy.nome}</SelectItem>
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

      {/* Loading State */}
      {isLoadingCriativos ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        /* Table */
        <Card className="p-0 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableHeader field="date">Data</SortableHeader>
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
                  const metrics = getCreativeMetrics(creative.id);
                  const thresholds = getOfferThresholds(creative.oferta_id);

                  return (
                    <TableRow key={creative.id}>
                      <TableCell>
                        {creative.created_at 
                          ? new Date(creative.created_at).toLocaleDateString('pt-BR')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <VideoThumbnail url={creative.url} creativeId={creative.id_unico} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{creative.id_unico}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(creative.id_unico)}
                            title="Copiar ID"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{getOfferName(creative.oferta_id)}</TableCell>
                      <TableCell>
                        <FonteBadge fonte={creative.fonte} />
                      </TableCell>
                      <TableCell>{creative.copy_responsavel || '-'}</TableCell>
                      <TableCell>
                        <CreativeStatusBadge status={creative.status || 'nao_validado'} />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={metrics.roas}
                          metricType="roas"
                          thresholds={thresholds}
                          format={formatRoas}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={metrics.ic}
                          metricType="ic"
                          thresholds={thresholds}
                          format={(v) => formatCurrency(v)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={metrics.cpc}
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
      )}

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
                    {(ofertas || []).map((offer) => (
                      <SelectItem key={offer.id} value={offer.id}>{offer.nome}</SelectItem>
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
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
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
                  <CreatableCombobox
                    options={copywritersOptions}
                    value={editCopywriter}
                    onChange={setEditCopywriter}
                    onCreateNew={handleCreateCopywriterEdit}
                    placeholder="Selecione"
                    searchPlaceholder="Buscar copywriter..."
                    emptyText="Nenhum copywriter encontrado"
                    createText="Criar"
                    isLoading={isLoadingCopywriters}
                    disabled={!editFieldsEnabled.copywriter}
                    className={!editFieldsEnabled.copywriter ? 'bg-muted' : ''}
                  />
                </div>
              </div>

              {/* Status */}
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
                    <SelectItem value="nao_validado">Não Validado</SelectItem>
                    <SelectItem value="em_teste">Em Teste</SelectItem>
                    <SelectItem value="liberado">Liberado</SelectItem>
                    <SelectItem value="pausado">Pausado</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button 
              onClick={handleSaveEdit}
              disabled={updateCriativoMutation.isPending}
            >
              {updateCriativoMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <Label className="text-muted-foreground">ID do Criativo</Label>
              <Input value={editId} disabled className="bg-muted font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Oferta</Label>
                <Input value={getOfferName(editOffer)} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Fonte</Label>
                <Input value={fonteLabels[editSource] || editSource} disabled className="bg-muted" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Copywriter</Label>
                <Input value={editCopywriter || '-'} disabled className="bg-muted" />
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Status</Label>
                <div className="flex items-center h-10">
                  <CreativeStatusBadge status={editStatus} />
                </div>
              </div>
            </div>
            {editUrl && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">URL</Label>
                <Input value={editUrl} disabled className="bg-muted text-xs" />
              </div>
            )}
            {editObservations && (
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Observações</Label>
                <Textarea value={editObservations} disabled className="bg-muted" rows={2} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmEdit}
              disabled={updateCriativoMutation.isPending}
            >
              {updateCriativoMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
