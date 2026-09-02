/**
 * Third-party analytics: Meta Pixel + Google Analytics 4.
 *
 * Faqat production build'da ishlaydi (VITE_* env orqali).
 * DEV'da hech narsa yuklanmaydi.
 */

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let metaInitialized = false;
let gaInitialized = false;

// ---------- Meta Pixel ----------

function initMetaPixel(): void {
  if (metaInitialized || !META_PIXEL_ID || typeof window === 'undefined') return;
  metaInitialized = true;

  /* eslint-disable */
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode!.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  (window as any).fbq('init', META_PIXEL_ID);
  (window as any).fbq('track', 'PageView');
}

export function metaTrack(event: string, params?: Record<string, unknown>): void {
  if (!metaInitialized || typeof window === 'undefined') return;
  try {
    (window as any).fbq('track', event, params);
  } catch {
    // noop
  }
}

// ---------- Google Analytics 4 ----------

function initGA(): void {
  if (gaInitialized || !GA_MEASUREMENT_ID || typeof window === 'undefined') return;
  gaInitialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: unknown[]) {
    (window as any).dataLayer.push(args);
  }
  (window as any).gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // manual page_view tracking
  });
}

export function gaTrack(event: string, params?: Record<string, unknown>): void {
  if (!gaInitialized || typeof window === 'undefined') return;
  try {
    (window as any).gtag('event', event, params);
  } catch {
    // noop
  }
}

// ---------- Public API ----------

export function initThirdPartyAnalytics(): void {
  if (import.meta.env.DEV) return; // dev'da yuklamaymiz
  initMetaPixel();
  initGA();
}

export function trackPageView(pagePath: string, pageTitle?: string): void {
  metaTrack('PageView');
  gaTrack('page_view', {
    page_path: pagePath,
    page_title: pageTitle,
  });
}

export function trackLead(type: 'STAND' | 'GUEST', language: string): void {
  metaTrack('Lead', { content_name: type, content_category: language });
  gaTrack('generate_lead', { type, language });
}

export function trackViewContent(contentName: string): void {
  metaTrack('ViewContent', { content_name: contentName });
  gaTrack('select_content', { content_type: contentName });
}
