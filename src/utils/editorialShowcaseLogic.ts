/**
 * Pure state helpers for the Client Reviews showcase carousel and FAQ accordion.
 */

export function getNextReviewIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex + 1) % total;
}

export function getPrevReviewIndex(currentIndex: number, total: number): number {
  if (total <= 0) return 0;
  return (currentIndex - 1 + total) % total;
}

export function clampReviewIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  if (index < 0) return 0;
  if (index >= total) return total - 1;
  return Math.floor(index);
}

export function toggleFaqItem(
  openFaqId: string | null,
  targetId: string,
): string | null {
  return openFaqId === targetId ? null : targetId;
}
