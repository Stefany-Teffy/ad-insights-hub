import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Re-export types for convenience
export type Oferta = Tables<'ofertas'>;
export type Criativo = Tables<'criativos'>;
export type MetricaDiaria = Tables<'metricas_diarias'>;
export type MetricaDiariaOferta = Tables<'metricas_diarias_oferta'>;
export type CriativoComMedias = Tables<'criativos_com_medias'>;
export type Nicho = Tables<'nichos'>;
export type Copywriter = Tables<'copywriters'>;
export type Pais = Tables<'paises'>;

export type OfertaInsert = TablesInsert<'ofertas'>;
export type OfertaUpdate = TablesUpdate<'ofertas'>;
export type CriativoInsert = TablesInsert<'criativos'>;
export type CriativoUpdate = TablesUpdate<'criativos'>;
export type MetricaDiariaInsert = TablesInsert<'metricas_diarias'>;
export type MetricaDiariaUpdate = TablesUpdate<'metricas_diarias'>;

// Thresholds type
export interface Thresholds {
  roas: { verde: number; amarelo: number };
  ic: { verde: number; amarelo: number };
  cpc: { verde: number; amarelo: number };
}

// ==================== OFERTAS ====================

export async function fetchOfertas(status?: string) {
  let query = supabase.from('ofertas').select('*').order('created_at', { ascending: false });
  
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchOfertaById(id: string) {
  const { data, error } = await supabase
    .from('ofertas')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createOferta(oferta: OfertaInsert) {
  const { data, error } = await supabase
    .from('ofertas')
    .insert(oferta)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateOferta(id: string, updates: OfertaUpdate) {
  const { data, error } = await supabase
    .from('ofertas')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteOferta(id: string) {
  const { error } = await supabase
    .from('ofertas')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function archiveOferta(id: string) {
  const archivedTimestamp = new Date().toISOString();

  // 1. Arquivar todos os criativos vinculados a esta oferta (que não estão já arquivados)
  const { error: criativosError } = await supabase
    .from('criativos')
    .update({
      status: 'arquivado',
      archived_at: archivedTimestamp  // Mesma timestamp da oferta para identificar arquivamento conjunto
    })
    .eq('oferta_id', id)
    .neq('status', 'arquivado');  // Não sobrescreve criativos já arquivados manualmente

  if (criativosError) {
    console.error('Erro ao arquivar criativos:', criativosError);
    throw criativosError;
  }

  // 2. Arquivar a oferta e registrar a data de arquivamento
  return updateOferta(id, {
    status: 'arquivado',
    archived_at: archivedTimestamp
  });
}

export async function restoreOferta(id: string, restoreCreatives: boolean = false) {
  // Se solicitado, restaurar criativos que foram arquivados junto com a oferta
  if (restoreCreatives) {
    // Primeiro, buscar a oferta para pegar o archived_at
    const oferta = await fetchOfertaById(id);

    if (oferta?.archived_at) {
      // Restaurar apenas criativos que têm o mesmo archived_at da oferta
      // (ou seja, foram arquivados automaticamente junto com ela)
      const { error: criativosError } = await supabase
        .from('criativos')
        .update({
          status: 'em_teste',
          archived_at: null
        })
        .eq('oferta_id', id)
        .eq('archived_at', oferta.archived_at);

      if (criativosError) {
        console.error('Erro ao restaurar criativos:', criativosError);
        throw criativosError;
      }
    }
  }

  // Restaurar a oferta
  return updateOferta(id, {
    status: 'pausado',
    archived_at: null
  });
}

// Conta quantos criativos foram arquivados junto com a oferta
export async function countCriativosArquivadosComOferta(ofertaId: string): Promise<number> {
  const oferta = await fetchOfertaById(ofertaId);

  if (!oferta?.archived_at) return 0;

  const { count, error } = await supabase
    .from('criativos')
    .select('*', { count: 'exact', head: true })
    .eq('oferta_id', ofertaId)
    .eq('archived_at', oferta.archived_at);

  if (error) {
    console.error('Erro ao contar criativos:', error);
    return 0;
  }

  return count || 0;
}

// ==================== CRIATIVOS ====================

export async function fetchCriativos(filters?: {
  ofertaId?: string;
  status?: string;
  fonte?: string;
  copyResponsavel?: string;
}) {
  let query = supabase.from('criativos').select('*').order('created_at', { ascending: false });
  
  if (filters?.ofertaId) {
    query = query.eq('oferta_id', filters.ofertaId);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.fonte && filters.fonte !== 'all') {
    query = query.eq('fonte', filters.fonte);
  }
  if (filters?.copyResponsavel && filters.copyResponsavel !== 'all') {
    query = query.eq('copy_responsavel', filters.copyResponsavel);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchCriativosComMedias(filters?: {
  ofertaId?: string;
  status?: string;
}) {
  let query = supabase.from('criativos_com_medias').select('*');
  
  if (filters?.ofertaId) {
    query = query.eq('oferta_id', filters.ofertaId);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchCriativoById(id: string) {
  const { data, error } = await supabase
    .from('criativos')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createCriativo(criativo: CriativoInsert) {
  const { data, error } = await supabase
    .from('criativos')
    .insert(criativo)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateCriativo(id: string, updates: CriativoUpdate) {
  const { data, error } = await supabase
    .from('criativos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCriativo(id: string) {
  const { error } = await supabase
    .from('criativos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function archiveCriativo(id: string) {
  return updateCriativo(id, {
    status: 'arquivado',
    archived_at: new Date().toISOString()
  });
}

export async function restoreCriativo(id: string) {
  return updateCriativo(id, {
    status: 'em_teste',
    archived_at: null
  });
}

// ==================== MÉTRICAS DIÁRIAS ====================

export async function fetchMetricasDiarias(filters?: {
  criativoId?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  let query = supabase.from('metricas_diarias').select('*').order('data', { ascending: false });
  
  if (filters?.criativoId) {
    query = query.eq('criativo_id', filters.criativoId);
  }
  if (filters?.dataInicio) {
    query = query.gte('data', filters.dataInicio);
  }
  if (filters?.dataFim) {
    query = query.lte('data', filters.dataFim);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createMetricaDiaria(metrica: MetricaDiariaInsert) {
  const { data, error } = await supabase
    .from('metricas_diarias')
    .insert(metrica)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateMetricaDiaria(id: string, updates: MetricaDiariaUpdate) {
  const { data, error } = await supabase
    .from('metricas_diarias')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function upsertMetricaDiaria(metrica: MetricaDiariaInsert) {
  const { data, error } = await supabase
    .from('metricas_diarias')
    .upsert(metrica, { onConflict: 'criativo_id,data' })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// ==================== MÉTRICAS DIÁRIAS OFERTA ====================

export async function fetchMetricasDiariasOferta(filters?: {
  ofertaId?: string;
  dataInicio?: string;
  dataFim?: string;
}) {
  let query = supabase.from('metricas_diarias_oferta').select('*').order('data', { ascending: false });
  
  if (filters?.ofertaId) {
    query = query.eq('oferta_id', filters.ofertaId);
  }
  if (filters?.dataInicio) {
    query = query.gte('data', filters.dataInicio);
  }
  if (filters?.dataFim) {
    query = query.lte('data', filters.dataFim);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Type for metrics with joined offer data
export interface MetricaDiariaOfertaComJoin extends MetricaDiariaOferta {
  oferta: Oferta | null;
}

export async function fetchMetricasDiariasOfertaComJoin(filters?: {
  dataInicio?: string;
  dataFim?: string;
  statusOferta?: string;
}): Promise<MetricaDiariaOfertaComJoin[]> {
  let query = supabase
    .from('metricas_diarias_oferta')
    .select(`
      *,
      oferta:ofertas(id, nome, nicho, pais, status, thresholds)
    `)
    .order('data', { ascending: false });
  
  if (filters?.dataInicio) {
    query = query.gte('data', filters.dataInicio);
  }
  if (filters?.dataFim) {
    query = query.lte('data', filters.dataFim);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Filter by offer status if specified (can't do this in the query directly with join)
  let result = (data || []) as MetricaDiariaOfertaComJoin[];
  
  if (filters?.statusOferta && filters.statusOferta !== 'all') {
    result = result.filter(m => m.oferta?.status === filters.statusOferta);
  } else {
    // By default, exclude archived offers
    result = result.filter(m => m.oferta?.status !== 'arquivado');
  }
  
  return result;
}

// ==================== NICHOS ====================

export async function fetchNichos() {
  const { data, error } = await supabase
    .from('nichos')
    .select('*')
    .order('nome', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createNicho(nome: string) {
  const { data, error } = await supabase
    .from('nichos')
    .insert({ nome })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteNicho(id: string) {
  const { error } = await supabase
    .from('nichos')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ==================== COPYWRITERS ====================

export async function fetchCopywriters() {
  const { data, error } = await supabase
    .from('copywriters')
    .select('*')
    .order('nome', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createCopywriter(nome: string) {
  const { data, error } = await supabase
    .from('copywriters')
    .insert({ nome })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteCopywriter(id: string) {
  const { error } = await supabase
    .from('copywriters')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ==================== PAÍSES ====================

export async function fetchPaises() {
  const { data, error } = await supabase
    .from('paises')
    .select('*')
    .order('nome', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function createPais(nome: string, codigo?: string) {
  const { data, error } = await supabase
    .from('paises')
    .insert({ nome, codigo })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePais(id: string) {
  const { error } = await supabase
    .from('paises')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ==================== HELPERS ====================

export function getDateRange(period: string): { dataInicio: string; dataFim: string } {
  const hoje = new Date();
  const dataFim = hoje.toISOString().split('T')[0];
  
  let dataInicio: string;
  
  switch (period) {
    case 'today':
      dataInicio = dataFim;
      break;
    case '7d':
      const seteDias = new Date(hoje);
      seteDias.setDate(seteDias.getDate() - 6);
      dataInicio = seteDias.toISOString().split('T')[0];
      break;
    case '30d':
      const trintaDias = new Date(hoje);
      trintaDias.setDate(trintaDias.getDate() - 29);
      dataInicio = trintaDias.toISOString().split('T')[0];
      break;
    case 'all':
    default:
      dataInicio = '2020-01-01';
      break;
  }
  
  return { dataInicio, dataFim };
}

export function parseThresholds(thresholds: unknown): Thresholds {
  const defaultThresholds: Thresholds = {
    roas: { verde: 1.3, amarelo: 1.1 },
    ic: { verde: 50, amarelo: 60 },
    cpc: { verde: 1.5, amarelo: 2.0 },
  };
  
  if (!thresholds || typeof thresholds !== 'object') {
    return defaultThresholds;
  }
  
  return {
    roas: (thresholds as any).roas || defaultThresholds.roas,
    ic: (thresholds as any).ic || defaultThresholds.ic,
    cpc: (thresholds as any).cpc || defaultThresholds.cpc,
  };
}
