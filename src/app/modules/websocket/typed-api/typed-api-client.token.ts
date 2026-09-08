import { inject, InjectionToken } from '@angular/core';
import {
  ApiDirectoryV27_0_0,
  ApplianceProtocol,
  consoleLogger,
  createTrueNasClient,
  noopLogger,
  TrueNasApiClient,
} from '@truenas/api-client';
import { environment } from 'environments/environment';
import { from, Observable, shareReplay } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

/**
 * The API surface the UI is written against.
 *
 * Every typed call, job and event in the UI resolves its method names, params
 * and responses from this directory. Bumping it is a one-line change here and
 * a compile pass everywhere else.
 */
export type WebUiApiDirectory = ApiDirectoryV27_0_0;

/** A client typed against {@link WebUiApiDirectory}. */
export type WebUiApiClient = TrueNasApiClient<WebUiApiDirectory>;

/**
 * The `@truenas/api-client` instance behind {@link TypedApiService}.
 *
 * It owns its own WebSocket, opened in parallel to the legacy
 * `WebSocketHandlerService` connection. That is deliberate for the migration
 * period: the two clients coexist until every call site has moved, and the
 * legacy socket goes away last.
 *
 * Injected as an observable because the factory is asynchronous. It resolves
 * once and replays. The socket opens as soon as the client exists
 * (`enabled: true`), and an app initializer in `main.ts` creates it at
 * startup rather than on first use.
 *
 * The version is stated as a literal *at this call site* on purpose. That is
 * how the client derives its typed surface (`ApiDirectoryV27_0_0`) from the
 * string instead of asserting it — forward it through a variable or a wrapper
 * and the surface silently widens to the oldest supported version.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const TYPED_API_CLIENT = new InjectionToken<Observable<WebUiApiClient>>(
  'TypedApiClient',
  {
    providedIn: 'root',
    factory: () => {
      const window = inject<Window>(WINDOW);

      // The appliance serves the page in production, so the page's scheme is
      // the appliance's. `location.protocol` is a plain string that can be
      // `file:` or `chrome-extension:`, hence the narrowing rather than a cast.
      const protocol: ApplianceProtocol = window.location.protocol === 'http:' ? 'http:' : 'https:';

      return from(createTrueNasClient({
        uuid: 'webui',
        hostnames: [environment.remote],
        enabled: true,
        version: 'v27.0.0',
        protocol,
        logger: environment.production ? noopLogger : consoleLogger,
      })).pipe(
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    },
  },
);
