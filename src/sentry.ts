import * as Sentry from '@sentry/angular';
import { environment } from 'environments/environment';
import product from 'environments/release';
import { filter, firstValueFrom } from 'rxjs';
import { waitForConsent$ } from 'app/services/errors/wait-for-sentry-consent';

export function enableSentry(): void {
  Sentry.init({
    dsn: environment.sentryPublicDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
      Sentry.captureConsoleIntegration({ levels: ['error'] }),
    ],
    release: product.release || '',
    environment: environment.production ? 'production' : 'development',
    replaysOnErrorSampleRate: 1.0,
    // Clear up some potential PII from events.
    beforeSend(event) {
      // Remove hostnames from URL.
      if (event.request?.url) {
        try {
          const url = new URL(event.request.url);
          event.request.url = url.pathname + url.search;
        } catch (error: unknown) {
          // In case of invalid URL, delete it
          delete event.request.url;
        }
      }

      // Process URLs in breadcrumbs
      if (event.breadcrumbs?.length) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data?.url) {
            try {
              const url = new URL(breadcrumb.data.url as string);
              breadcrumb.data.url = url.pathname + url.search;
            } catch (error: unknown) {
              delete breadcrumb.data.url;
            }
          }
          return breadcrumb;
        });
      }

      return event;
    },
    // Collect errors, but don't send them until we know that error reporting is allowed.
    transport: (options) => {
      const defaultTransport = Sentry.makeFetchTransport(options);
      return {
        flush: (timeout) => defaultTransport.flush(timeout),
        send: async (request) => {
          const hasConsent = await firstValueFrom(waitForConsent$.pipe(filter((value) => value !== null)));
          if (hasConsent) {
            return defaultTransport.send(request);
          }

          return undefined;
        },
      };
    },
  });
}
