import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { StatusBadge, MetricBadge } from '@/components/MetricBadge';
import { mockOffers, niches, countries } from '@/lib/mockData';
import { formatCurrency, formatRoas } from '@/lib/metrics';

export default function OffersManagement() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOffers = mockOffers.filter((offer) =>
    offer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Ofertas</h1>
          <p className="text-sm text-muted-foreground mt-1">Cadastre e gerencie suas ofertas</p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Oferta
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[500px] sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Nova Oferta</SheetTitle>
              <SheetDescription>
                Cadastre uma nova oferta no sistema
              </SheetDescription>
            </SheetHeader>
            <div className="grid gap-4 py-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome da Oferta *</Label>
                <Input id="name" placeholder="Ex: Nutra Max Pro" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="niche">Nicho *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {niches.map((niche) => (
                        <SelectItem key={niche} value={niche}>{niche}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="country">País *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue="active">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="paused">Pausado</SelectItem>
                      <SelectItem value="archived">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Data de Início</Label>
                  <Input id="date" type="date" />
                </div>
              </div>

              {/* Thresholds Section */}
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Thresholds da Oferta</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Esses valores definem as cores de status automáticas para esta oferta.
                </p>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>ROAS Alvo (Verde acima de)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.30"
                      className="placeholder:text-muted-foreground/40"
                    />
                    <p className="text-xs text-muted-foreground">
                      Verde: &gt; valor | Amarelo: valor - 0.20 | Vermelho: abaixo
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>IC Máximo (Verde abaixo de)</Label>
                    <Input
                      type="number"
                      placeholder="50.00"
                      className="placeholder:text-muted-foreground/40"
                    />
                    <p className="text-xs text-muted-foreground">
                      Verde: &lt; valor | Amarelo: até valor + R$10 | Vermelho: acima
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label>CPC Máximo (Verde abaixo de)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.50"
                      className="placeholder:text-muted-foreground/40"
                    />
                    <p className="text-xs text-muted-foreground">
                      Verde: &lt; valor | Amarelo: até valor + R$0.50 | Vermelho: acima
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline" onClick={() => setIsSheetOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setIsSheetOpen(false)}>Criar Oferta</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar oferta..."
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
              <TableHead>Nome</TableHead>
              <TableHead>Nicho</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
              <TableHead className="text-right">IC</TableHead>
              <TableHead className="text-right">CPC</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
              <TableHead className="text-right">MC</TableHead>
              <TableHead className="text-right">Faturamento</TableHead>
              <TableHead className="text-right">Spend Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.map((offer) => {
              const avgIc = offer.dailyMetrics.reduce((sum, m) => sum + m.ic, 0) / offer.dailyMetrics.length;
              const avgCpc = offer.dailyMetrics.reduce((sum, m) => sum + m.cpc, 0) / offer.dailyMetrics.length;
              const avgMc = offer.dailyMetrics.reduce((sum, m) => sum + m.mc, 0) / offer.dailyMetrics.length;

              return (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.name}</TableCell>
                  <TableCell>{offer.niche}</TableCell>
                  <TableCell>{offer.country}</TableCell>
                  <TableCell><StatusBadge status={offer.status} /></TableCell>
                  <TableCell className="text-right">
                    <MetricBadge
                      value={offer.metrics.roasTotal}
                      metricType="roas"
                      thresholds={offer.thresholds}
                      format={formatRoas}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricBadge
                      value={avgIc}
                      metricType="ic"
                      thresholds={offer.thresholds}
                      format={(v) => formatCurrency(v)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <MetricBadge
                      value={avgCpc}
                      metricType="cpc"
                      thresholds={offer.thresholds}
                      format={(v) => formatCurrency(v)}
                    />
                  </TableCell>
                  <TableCell className={`text-right font-medium ${offer.metrics.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatCurrency(offer.metrics.profit)}
                  </TableCell>
                  <TableCell className="text-right">{avgMc.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{formatCurrency(offer.metrics.revenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(offer.metrics.spendTotal)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-danger hover:text-danger">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
