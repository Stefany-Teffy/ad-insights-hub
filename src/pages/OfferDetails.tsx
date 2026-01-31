import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Label } from '@/components/ui/label';
import { KPICard } from '@/components/KPICard';
import { MetricBadge, StatusBadge } from '@/components/MetricBadge';
import { getOfferById, getCreativesBySource, type DailyMetric, type Creative } from '@/lib/mockData';
import { formatCurrency, formatRoas, getMetricStatus, getMetricClass } from '@/lib/metrics';
import { cn } from '@/lib/utils';

export default function OfferDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isMetricDialogOpen, setIsMetricDialogOpen] = useState(false);
  const [isCreativeDialogOpen, setIsCreativeDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const offer = getOfferById(id || '');

  if (!offer) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Oferta não encontrada.</p>
      </div>
    );
  }

  const fbCreatives = getCreativesBySource(offer.id, 'FB');
  const ytCreatives = getCreativesBySource(offer.id, 'YT');

  const filterCreatives = (creatives: Creative[]) => {
    return creatives.filter((creative) => {
      const matchesStatus = statusFilter === 'all' || creative.status === statusFilter;
      const matchesSearch = creative.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creative.copy.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  };

  const renderCreativesTable = (creatives: Creative[]) => {
    const filtered = filterCreatives(creatives);
    
    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID ou Copy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="testing">Em Teste</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Copy</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">ROAS</TableHead>
                <TableHead className="text-right">IC</TableHead>
                <TableHead className="text-right">CPC</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhum criativo encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((creative) => {
                  const totalSpend = creative.metrics.reduce((sum, m) => sum + m.spend, 0);
                  const totalRevenue = creative.metrics.reduce((sum, m) => sum + m.revenue, 0);
                  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
                  const ic = 45 + Math.random() * 20;
                  const cpc = 1.2 + Math.random() * 1;

                  return (
                    <TableRow key={creative.id}>
                      <TableCell className="font-mono text-sm">{creative.id}</TableCell>
                      <TableCell><StatusBadge status={creative.status} /></TableCell>
                      <TableCell>{creative.copy}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalSpend)}</TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={roas}
                          metricType="roas"
                          thresholds={offer.thresholds}
                          format={formatRoas}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={ic}
                          metricType="ic"
                          thresholds={offer.thresholds}
                          format={(v) => formatCurrency(v)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <MetricBadge
                          value={cpc}
                          metricType="cpc"
                          thresholds={offer.thresholds}
                          format={(v) => formatCurrency(v)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isCreativeDialogOpen} onOpenChange={setIsCreativeDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">Editar</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Lançar Métrica do Criativo</DialogTitle>
                              <DialogDescription>
                                Atualize as métricas para {creative.id}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label>Data</Label>
                                <Input type="date" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label>Spend</Label>
                                  <Input type="number" placeholder="0.00" />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Faturado</Label>
                                  <Input type="number" placeholder="0.00" />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                  <Label>Impressões</Label>
                                  <Input type="number" placeholder="0" />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Cliques</Label>
                                  <Input type="number" placeholder="0" />
                                </div>
                                <div className="grid gap-2">
                                  <Label>Conversões</Label>
                                  <Input type="number" placeholder="0" />
                                </div>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsCreativeDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={() => setIsCreativeDialogOpen(false)}>Salvar</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{offer.name}</h1>
          <p className="text-sm text-muted-foreground">{offer.niche} • {offer.country}</p>
        </div>
        <Dialog open={isMetricDialogOpen} onOpenChange={setIsMetricDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Lançar Nova Métrica
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Atualização de Métricas da Oferta</DialogTitle>
              <DialogDescription>
                Adicione novas métricas diárias para {offer.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Locked fields */}
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Oferta</Label>
                  <Input value={offer.name} disabled className="bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">Nicho</Label>
                  <Input value={offer.niche} disabled className="bg-muted" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-muted-foreground">País</Label>
                  <Input value={offer.country} disabled className="bg-muted" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Data *</Label>
                <Input type="date" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Faturamento</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
                <div className="grid gap-2">
                  <Label>Gastos</Label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>

              {/* Threshold configuration */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3">Thresholds da Oferta</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Defina os valores de referência para classificar a performance desta oferta.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>ROAS Ótimo</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.30"
                      className="placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>IC Máximo (R$)</Label>
                    <Input
                      type="number"
                      placeholder="50.00"
                      className="placeholder:text-muted-foreground/40"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>CPC Máximo (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.50"
                      className="placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMetricDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsMetricDialogOpen(false)}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Spend Total"
          value={formatCurrency(offer.metrics.spendTotal)}
        />
        <KPICard
          label="ROAS Total"
          value={formatRoas(offer.metrics.roasTotal)}
          variant={getMetricStatus(offer.metrics.roasTotal, 'roas', offer.thresholds) as 'success' | 'warning' | 'danger' | 'default'}
        />
        <KPICard
          label="Faturamento"
          value={formatCurrency(offer.metrics.revenue)}
          variant="success"
        />
        <KPICard
          label="Lucro Líquido"
          value={formatCurrency(offer.metrics.profit)}
          variant={offer.metrics.profit >= 0 ? 'success' : 'danger'}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="daily">Resultado Diário</TabsTrigger>
          <TabsTrigger value="fb">Criativos FB</TabsTrigger>
          <TabsTrigger value="yt">Criativos YT</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="mt-6">
          <Card className="p-0 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dia</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                  <TableHead className="text-right">Gastos</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">IC</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">Lucro</TableHead>
                  <TableHead className="text-right">MC</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offer.dailyMetrics.slice(-14).reverse().map((metric) => {
                  const roasStatus = getMetricStatus(metric.roas, 'roas', offer.thresholds);
                  const icStatus = getMetricStatus(metric.ic, 'ic', offer.thresholds);
                  const cpcStatus = getMetricStatus(metric.cpc, 'cpc', offer.thresholds);

                  return (
                    <TableRow key={metric.date}>
                      <TableCell className="font-medium">
                        {new Date(metric.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(metric.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(metric.spend)}</TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-medium', getMetricClass(roasStatus))}>
                          {formatRoas(metric.roas)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-medium', getMetricClass(icStatus))}>
                          {formatCurrency(metric.ic)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn('font-medium', getMetricClass(cpcStatus))}>
                          {formatCurrency(metric.cpc)}
                        </span>
                      </TableCell>
                      <TableCell className={cn(
                        'text-right font-medium',
                        metric.profit >= 0 ? 'text-success' : 'text-danger'
                      )}>
                        {formatCurrency(metric.profit)}
                      </TableCell>
                      <TableCell className="text-right">{metric.mc.toFixed(1)}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="fb" className="mt-6">
          {renderCreativesTable(fbCreatives)}
        </TabsContent>

        <TabsContent value="yt" className="mt-6">
          {renderCreativesTable(ytCreatives)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
