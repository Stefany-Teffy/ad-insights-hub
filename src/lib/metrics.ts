// Metric utility functions for TrackFlow

import type { OfferThresholds, HealthStatus } from './mockData';

export type MetricType = 'roas' | 'ic' | 'cpc';
export type MetricStatus = 'success' | 'warning' | 'danger' | 'neutral';

/**
 * Get the color status for a metric value based on thresholds
 * @param value - The metric value to evaluate
 * @param metricType - The type of metric (roas, ic, cpc)
 * @param thresholds - The offer-specific thresholds
 * @returns The status color
 */
export const getMetricStatus = (
  value: number,
  metricType: MetricType,
  thresholds: OfferThresholds
): MetricStatus => {
  const threshold = thresholds[metricType];
  
  if (metricType === 'roas') {
    // Higher is better for ROAS
    if (value >= threshold.green) return 'success';
    if (value >= threshold.yellow) return 'warning';
    return 'danger';
  } else {
    // Lower is better for IC and CPC
    if (value <= threshold.green) return 'success';
    if (value <= threshold.yellow) return 'warning';
    return 'danger';
  }
};

/**
 * Get the overall health status based on ROAS
 */
export const getOfferHealth = (roas: number, thresholds: OfferThresholds): HealthStatus => {
  return getMetricStatus(roas, 'roas', thresholds) as HealthStatus;
};

/**
 * Format currency value in BRL
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/**
 * Format a number with fixed decimals
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toFixed(decimals);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Format ROAS value
 */
export const formatRoas = (value: number): string => {
  return value.toFixed(2);
};

/**
 * Calculate ROAS from spend and revenue
 */
export const calculateRoas = (revenue: number, spend: number): number => {
  if (spend === 0) return 0;
  return revenue / spend;
};

/**
 * Calculate profit from revenue and spend
 */
export const calculateProfit = (revenue: number, spend: number): number => {
  return revenue - spend;
};

/**
 * Calculate margin of contribution
 */
export const calculateMC = (profit: number, revenue: number): number => {
  if (revenue === 0) return 0;
  return (profit / revenue) * 100;
};

/**
 * Get CSS class for metric status
 */
export const getMetricClass = (status: MetricStatus): string => {
  switch (status) {
    case 'success':
      return 'text-success';
    case 'warning':
      return 'text-warning';
    case 'danger':
      return 'text-danger';
    default:
      return 'text-muted-foreground';
  }
};

/**
 * Get background CSS class for metric status
 */
export const getMetricBgClass = (status: MetricStatus): string => {
  switch (status) {
    case 'success':
      return 'bg-success/10 text-success';
    case 'warning':
      return 'bg-warning/10 text-warning';
    case 'danger':
      return 'bg-danger/10 text-danger';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

/**
 * Get the health indicator color
 */
export const getHealthColor = (status: HealthStatus): string => {
  switch (status) {
    case 'success':
      return 'bg-success';
    case 'warning':
      return 'bg-warning';
    case 'danger':
      return 'bg-danger';
    default:
      return 'bg-muted';
  }
};
