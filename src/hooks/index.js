/**
 * Central export file for all custom hooks
 * Provides a single import point for consistency
 * 
 * Usage:
 * import { useAlertManager, useDebounce, useFetchWithLoading } from '@/hooks';
 */

export { useAlertManager } from './useAlertManager';
export { useConfirm } from './useConfirm';
export { useDebounce } from './useDebounce';
export { useFetchWithLoading } from './useFetchWithLoading';
export { useFetchOnMount } from './useFetchOnMount';
export { useModal } from './useModal';
export { usePolling } from './usePolling';
export { default as useMediaQuery } from './useMediaQuery';
export { default as useResponsive } from './useResponsive';
