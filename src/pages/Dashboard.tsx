import { useState } from 'react';
import { RefreshCw, Search, Filter, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { KPIDualCard } from '@/components/KPICard';
import { OfferCard } from '@/components/OfferCard';
import { mockOffers, niches, countries, calculateTotals } from '@/lib/mockData';
import { formatCurrency, formatRoas, getMetricStatus } from '@/lib/metrics';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

const statusOptions = [
  { value: 'all', label: 'Todos Status' },
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'archived', label: 'Arquivado' },
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const totals = calculateTotals();

  // Filter offers
  const filteredOffers = mockOffers.filter((offer) => {
    const matchesSearch = offer.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = nicheFilter === 'all' || offer.niche === nicheFilter;
    const matchesCountry = countryFilter === 'all' || offer.country === countryFilter;
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;
    const health = getMetricStatus(offer.metrics.roasTotal, 'roas', offer.thresholds);
    const matchesHealth = healthFilter === 'all' || health === healthFilter;
    
    return matchesSearch && matchesNiche && matchesCountry && matchesStatus && matchesHealth;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel de Ofertas Ativas</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral de performance</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIDualCard
          leftLabel="Spend Total"
          leftValue={formatCurrency(totals.spendTotal)}
          rightLabel="ROAS Total"
          rightValue={formatRoas(totals.roasTotal)}
          rightVariant={totals.roasTotal >= 1.3 ? 'success' : totals.roasTotal >= 1.1 ? 'warning' : 'danger'}
        />
        <KPIDualCard
          leftLabel="Spend Hoje"
          leftValue={formatCurrency(totals.spendToday)}
          rightLabel="ROAS Hoje"
          rightValue="1.65"
          rightVariant="success"
        />
        <KPIDualCard
          leftLabel="Spend 7d"
          leftValue={formatCurrency(totals.spend7d)}
          rightLabel="ROAS 7d"
          rightValue="1.52"
          rightVariant="success"
        />
        <KPIDualCard
          leftLabel="Total Criativos"
          leftValue={totals.creativeTotals.total.toString()}
          rightLabel="Liberados / Teste"
          rightValue={`${totals.creativeTotals.active} / ${totals.creativeTotals.testing}`}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-lg border border-border shadow-card">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar oferta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={nicheFilter} onValueChange={setNicheFilter}>
          <SelectTrigger className="w-[150px]">
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
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Países</SelectItem>
            {countries.map((country) => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={healthFilter} onValueChange={setHealthFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Saúde" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Saúdes</SelectItem>
            <SelectItem value="success">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success" />
                Verde
              </div>
            </SelectItem>
            <SelectItem value="warning">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning" />
                Amarelo
              </div>
            </SelectItem>
            <SelectItem value="danger">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-danger" />
                Vermelho
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM", { locale: ptBR })} -{" "}
                    {format(dateRange.to, "dd/MM", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                <span>Período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Offer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOffers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>

      {filteredOffers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma oferta encontrada com os filtros selecionados.</p>
        </div>
      )}
    </div>
  );
}
