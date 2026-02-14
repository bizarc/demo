type UxEventPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackUxEvent(eventName: string, payload: UxEventPayload = {}) {
  if (typeof window === 'undefined') return;

  const eventData = {
    event: 'ux_event',
    eventName,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(eventData);
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[UX Metric]', eventData);
  }
}
