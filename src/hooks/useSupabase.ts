import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  // Ofertas
  fetchOfertas,
  fetchOfertaById,
  createOferta,
  updateOferta,
  archiveOferta,
  restoreOferta,
  deleteOferta,
  // Criativos
  fetchCriativos,
  fetchCriativosComMedias,
  fetchCriativoById,
  createCriativo,
  updateCriativo,
  archiveCriativo,
  restoreCriativo,
  deleteCriativo,
  // Métricas
  fetchMetricasDiarias,
  fetchMetricasDiariasOferta,
  createMetricaDiaria,
  upsertMetricaDiaria,
  getDateRange,
  // Dados dinâmicos
  fetchNichos,
  fetchCopywriters,
  fetchPaises,
  createNicho,
  createCopywriter,
  createPais,
  // Types
  type OfertaInsert,
  type OfertaUpdate,
  type CriativoInsert,
  type CriativoUpdate,
  type MetricaDiariaInsert,
} from '@/services/api';

// ==================== QUERY KEYS ====================

export const queryKeys = {
  ofertas: {
    all: ['ofertas'] as const,
    list: (status?: string) => ['ofertas', 'list', status] as const,
    detail: (id: string) => ['ofertas', 'detail', id] as const,
    ativas: () => ['ofertas', 'list', 'ativo'] as const,
    arquivadas: () => ['ofertas', 'list', 'arquivado'] as const,
  },
  criativos: {
    all: ['criativos'] as const,
    list: (filters?: Record<string, string>) => ['criativos', 'list', filters] as const,
    byOferta: (ofertaId: string, fonte?: string) => ['criativos', 'byOferta', ofertaId, fonte] as const,
    comMedias: (filters?: Record<string, string>) => ['criativos', 'comMedias', filters] as const,
    arquivados: () => ['criativos', 'list', { status: 'arquivado' }] as const,
    detail: (id: string) => ['criativos', 'detail', id] as const,
  },
  metricas: {
    byCriativo: (criativoId: string, periodo?: string) => ['metricas', 'criativo', criativoId, periodo] as const,
    byOferta: (ofertaId: string, periodo?: string) => ['metricas', 'oferta', ofertaId, periodo] as const,
    totais: () => ['metricas', 'totais'] as const,
    contadorCriativos: () => ['metricas', 'contadorCriativos'] as const,
  },
  nichos: ['nichos'] as const,
  copywriters: ['copywriters'] as const,
  paises: ['paises'] as const,
};

// ==================== OFERTAS ====================

export function useOfertas(status?: string) {
  return useQuery({
    queryKey: queryKeys.ofertas.list(status),
    queryFn: () => fetchOfertas(status),
  });
}

export function useOfertasAtivas() {
  return useQuery({
    queryKey: queryKeys.ofertas.ativas(),
    queryFn: () => fetchOfertas('ativo'),
  });
}

export function useOfertasArquivadas() {
  return useQuery({
    queryKey: queryKeys.ofertas.arquivadas(),
    queryFn: () => fetchOfertas('arquivado'),
  });
}

export function useOferta(id: string) {
  return useQuery({
    queryKey: queryKeys.ofertas.detail(id),
    queryFn: () => fetchOfertaById(id),
    enabled: !!id,
  });
}

export function useCreateOferta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (oferta: OfertaInsert) => createOferta(oferta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ofertas.all });
    },
  });
}

export function useUpdateOferta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: OfertaUpdate }) => 
      updateOferta(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ofertas.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.ofertas.detail(id) });
    },
  });
}

export function useArchiveOferta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => archiveOferta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ofertas.all });
    },
  });
}

export function useRestoreOferta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => restoreOferta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ofertas.all });
    },
  });
}

export function useDeleteOferta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteOferta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ofertas.all });
    },
  });
}

// ==================== CRIATIVOS ====================

export function useCriativos(filters?: {
  ofertaId?: string;
  status?: string;
  fonte?: string;
  copyResponsavel?: string;
}) {
  return useQuery({
    queryKey: queryKeys.criativos.list(filters as Record<string, string>),
    queryFn: () => fetchCriativos(filters),
  });
}

export function useCriativosPorOferta(ofertaId: string, fonte?: string) {
  return useQuery({
    queryKey: queryKeys.criativos.byOferta(ofertaId, fonte),
    queryFn: () => fetchCriativos({ 
      ofertaId, 
      fonte: fonte && fonte !== 'all' ? fonte : undefined 
    }),
    enabled: !!ofertaId,
  });
}

export function useCriativosComMedias(filters?: {
  ofertaId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: queryKeys.criativos.comMedias(filters as Record<string, string>),
    queryFn: () => fetchCriativosComMedias(filters),
  });
}

export function useCriativosArquivados() {
  return useQuery({
    queryKey: queryKeys.criativos.arquivados(),
    queryFn: () => fetchCriativos({ status: 'arquivado' }),
  });
}

export function useCriativo(id: string) {
  return useQuery({
    queryKey: queryKeys.criativos.detail(id),
    queryFn: () => fetchCriativoById(id),
    enabled: !!id,
  });
}

export function useCreateCriativo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (criativo: CriativoInsert) => createCriativo(criativo),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.criativos.all });
      if (data.oferta_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.criativos.byOferta(data.oferta_id) 
        });
      }
    },
  });
}

export function useUpdateCriativo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CriativoUpdate }) => 
      updateCriativo(id, updates),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.criativos.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.criativos.detail(id) });
      if (data.oferta_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.criativos.byOferta(data.oferta_id) 
        });
      }
    },
  });
}

export function useArchiveCriativo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => archiveCriativo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.criativos.all });
    },
  });
}

export function useRestoreCriativo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => restoreCriativo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.criativos.all });
    },
  });
}

export function useDeleteCriativo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => deleteCriativo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.criativos.all });
    },
  });
}

// ==================== MÉTRICAS ====================

export function useMetricasCriativo(criativoId: string, periodo?: string) {
  const dateRange = periodo ? getDateRange(periodo) : undefined;
  
  return useQuery({
    queryKey: queryKeys.metricas.byCriativo(criativoId, periodo),
    queryFn: () => fetchMetricasDiarias({
      criativoId,
      dataInicio: dateRange?.dataInicio,
      dataFim: dateRange?.dataFim,
    }),
    enabled: !!criativoId,
  });
}

export function useMetricasOferta(ofertaId: string, periodo?: string) {
  const dateRange = periodo ? getDateRange(periodo) : undefined;
  
  return useQuery({
    queryKey: queryKeys.metricas.byOferta(ofertaId, periodo),
    queryFn: () => fetchMetricasDiariasOferta({
      ofertaId,
      dataInicio: dateRange?.dataInicio,
      dataFim: dateRange?.dataFim,
    }),
    enabled: !!ofertaId,
  });
}

export function useCreateMetricaDiaria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (metrica: MetricaDiariaInsert) => createMetricaDiaria(metrica),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
      if (data.criativo_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.metricas.byCriativo(data.criativo_id) 
        });
      }
    },
  });
}

export function useUpsertMetricaDiaria() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (metrica: MetricaDiariaInsert) => upsertMetricaDiaria(metrica),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['metricas'] });
      if (data.criativo_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.metricas.byCriativo(data.criativo_id) 
        });
      }
    },
  });
}

export function useTotaisOfertas() {
  return useQuery({
    queryKey: queryKeys.metricas.totais(),
    queryFn: async () => {
      const hoje = new Date().toISOString().split('T')[0];
      const seteDias = new Date();
      seteDias.setDate(seteDias.getDate() - 6);
      const seteDiasStr = seteDias.toISOString().split('T')[0];
      
      // Fetch all metrics for calculation
      const [metricasHoje, metricas7d, metricasTotal] = await Promise.all([
        fetchMetricasDiariasOferta({ dataInicio: hoje, dataFim: hoje }),
        fetchMetricasDiariasOferta({ dataInicio: seteDiasStr, dataFim: hoje }),
        fetchMetricasDiariasOferta({}),
      ]);
      
      const sumMetrics = (metricas: typeof metricasTotal) => {
        const spend = metricas.reduce((acc, m) => acc + (m.spend || 0), 0);
        const faturado = metricas.reduce((acc, m) => acc + (m.faturado || 0), 0);
        const roas = spend > 0 ? faturado / spend : 0;
        return { spend, faturado, roas };
      };
      
      return {
        hoje: sumMetrics(metricasHoje),
        seteDias: sumMetrics(metricas7d),
        total: sumMetrics(metricasTotal),
      };
    },
  });
}

export function useContadorCriativos() {
  return useQuery({
    queryKey: queryKeys.metricas.contadorCriativos(),
    queryFn: async () => {
      const criativos = await fetchCriativos();
      
      const contador = {
        total: criativos.length,
        liberado: 0,
        em_teste: 0,
        nao_validado: 0,
        pausado: 0,
        arquivado: 0,
      };
      
      criativos.forEach((c) => {
        const status = c.status as keyof typeof contador;
        if (status in contador) {
          contador[status]++;
        }
      });
      
      // For backwards compatibility
      const active = contador.liberado;
      const testing = contador.em_teste;
      
      return {
        ...contador,
        active,
        testing,
      };
    },
  });
}

// ==================== NICHOS ====================

export function useNichos() {
  return useQuery({
    queryKey: queryKeys.nichos,
    queryFn: fetchNichos,
  });
}

export function useCreateNicho() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (nome: string) => createNicho(nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.nichos });
    },
  });
}

// ==================== COPYWRITERS ====================

export function useCopywriters() {
  return useQuery({
    queryKey: queryKeys.copywriters,
    queryFn: fetchCopywriters,
  });
}

export function useCreateCopywriter() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (nome: string) => createCopywriter(nome),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.copywriters });
    },
  });
}

// ==================== PAÍSES ====================

export function usePaises() {
  return useQuery({
    queryKey: queryKeys.paises,
    queryFn: fetchPaises,
  });
}

export function useCreatePais() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ nome, codigo }: { nome: string; codigo?: string }) => 
      createPais(nome, codigo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paises });
    },
  });
}
