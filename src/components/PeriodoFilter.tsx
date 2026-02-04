import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type PeriodoTipo = 'today' | '7d' | '30d' | 'custom' | 'all';

export interface PeriodoValue {
  tipo: PeriodoTipo;
  dataInicio: string;
  dataFim: string;
}

interface PeriodoFilterProps {
  value: PeriodoValue;
  onChange: (value: PeriodoValue) => void;
  showAllOption?: boolean;
  className?: string;
}

function getDateRange(tipo: PeriodoTipo): { dataInicio: string; dataFim: string } {
  const hoje = new Date();
  const dataFim = hoje.toISOString().split('T')[0];
  
  switch (tipo) {
    case 'today':
      return { dataInicio: dataFim, dataFim };
    case '7d': {
      const seteDias = new Date(hoje);
      seteDias.setDate(seteDias.getDate() - 6);
      return { dataInicio: seteDias.toISOString().split('T')[0], dataFim };
    }
    case '30d': {
      const trintaDias = new Date(hoje);
      trintaDias.setDate(trintaDias.getDate() - 29);
      return { dataInicio: trintaDias.toISOString().split('T')[0], dataFim };
    }
    case 'all':
      return { dataInicio: '2020-01-01', dataFim };
    default:
      return { dataInicio: dataFim, dataFim };
  }
}

export function usePeriodo(initialTipo: PeriodoTipo = '7d') {
  const [periodo, setPeriodo] = useState<PeriodoValue>(() => ({
    tipo: initialTipo,
    ...getDateRange(initialTipo),
  }));
  
  return { periodo, setPeriodo };
}

export function PeriodoFilter({ 
  value, 
  onChange, 
  showAllOption = false,
  className 
}: PeriodoFilterProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: value.tipo === 'custom' ? new Date(value.dataInicio) : undefined,
    to: value.tipo === 'custom' ? new Date(value.dataFim) : undefined,
  });

  const handleTipoChange = (novoTipo: PeriodoTipo) => {
    if (novoTipo === 'custom') {
      // Keep current dates for custom, user will select via calendar
      onChange({
        tipo: 'custom',
        dataInicio: value.dataInicio,
        dataFim: value.dataFim,
      });
    } else {
      const range = getDateRange(novoTipo);
      onChange({
        tipo: novoTipo,
        ...range,
      });
    }
  };

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setDateRange(range);
    
    if (range.from && range.to) {
      onChange({
        tipo: 'custom',
        dataInicio: range.from.toISOString().split('T')[0],
        dataFim: range.to.toISOString().split('T')[0],
      });
    } else if (range.from) {
      onChange({
        tipo: 'custom',
        dataInicio: range.from.toISOString().split('T')[0],
        dataFim: range.from.toISOString().split('T')[0],
      });
    }
  };

  // Sync dateRange when value changes externally
  useEffect(() => {
    if (value.tipo === 'custom') {
      setDateRange({
        from: new Date(value.dataInicio),
        to: new Date(value.dataFim),
      });
    }
  }, [value.tipo, value.dataInicio, value.dataFim]);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={value.tipo} onValueChange={(v) => handleTipoChange(v as PeriodoTipo)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {showAllOption && <SelectItem value="all">Todos Períodos</SelectItem>}
          <SelectItem value="today">Hoje</SelectItem>
          <SelectItem value="7d">Últimos 7 dias</SelectItem>
          <SelectItem value="30d">Últimos 30 dias</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      {value.tipo === 'custom' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM", { locale: ptBR })} - {format(dateRange.to, "dd/MM", { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy", { locale: ptBR })
                )
              ) : (
                "Selecionar"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => handleDateRangeChange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default PeriodoFilter;
