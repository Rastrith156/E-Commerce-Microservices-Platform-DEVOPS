const STORAGE_KEY = 'ecommerce_correlation_id';

export function generateCorrelationId(): string {
  return `${crypto.randomUUID()}-${Date.now()}`;
}

export function getStoredCorrelationId(): string {
  if (typeof sessionStorage === 'undefined') {
    return generateCorrelationId();
  }
  let id = sessionStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = generateCorrelationId();
    sessionStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function setCorrelationId(id: string): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, id);
}
