import { inject, InjectionToken } from '@angular/core';
import {
  ApiDirectoryV28_0_0,
  ApplianceProtocol,
  consoleLogger,
  createTrueNasClient,
  noopLogger,
  QueryEntity,
  QueryMethod,
  TrueNasApiClient,
  v28_0_0,
} from '@truenas/api-client';
import { environment } from 'environments/environment';
import {
  from, Observable, shareReplay, tap,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { AddNfsPrincipal } from 'app/interfaces/nfs-config.interface';
import { limitConcurrentCalls } from 'app/modules/websocket/typed-api/limit-concurrent-calls';
import { MockResponseService } from 'app/modules/websocket-debug-panel/services/mock-response.service';
import { WebSocketDebugService } from 'app/modules/websocket-debug-panel/services/websocket-debug.service';
import { interceptConnection } from 'app/modules/websocket-debug-panel/utils/intercept-connection';

/**
 * Calls middleware serves but leaves out of `--dump-api`, most likely because it marks them
 * private (gap 14 in docs/devs/typed-api-client.md). Declared here by hand, and reached only
 * through `ApiService.callUndeclared`, so the generated directory stays exactly what the
 * client is typed against. Remove an entry once the generated directory has it.
 */
export interface UndeclaredCallDirectory {
  'interface.lag_supported_protocols': { params: []; response: string[] };
  'kerberos.keytab.kerberos_principal_choices': { params: []; response: string[] };
  'nfs.add_principal': { params: [AddNfsPrincipal]; response: boolean };
}

/** A method of {@link UndeclaredCallDirectory}. */
export type UndeclaredCallMethod = keyof UndeclaredCallDirectory;

/**
 * The API surface the UI is written against.
 *
 * Every typed call, job and event in the UI resolves its method names, params
 * and responses from this directory. It moves together with the `version`
 * literal below, `E2eApiDirectory` in the e2e suite and the
 * `@truenas/api-client` release that adds the new directory — who bumps it,
 * when, and the steps are under "Version policy" in docs/devs/typed-api-client.md.
 */
export type WebUiApiDirectory = ApiDirectoryV28_0_0;

/** A client typed against {@link WebUiApiDirectory}. */
export type WebUiApiClient = TrueNasApiClient<WebUiApiDirectory>;

/** A `.query` method of {@link WebUiApiDirectory}, as the query verbs take it. */
export type WebUiQueryMethod = QueryMethod<WebUiApiDirectory['call']>;

/** The entity a query method returns rows of, e.g. `WebUiQueryEntity<'user.query'>`. */
export type WebUiQueryEntity<M extends WebUiQueryMethod> = QueryEntity<WebUiApiDirectory['call'], M>;

/**
 * One filter for a query verb, for filters built up before the call rather than
 * written inline. The client's own `QueryFilter`, from the version namespace the
 * UI is pinned to, so a list of these is exactly what the query verbs take.
 */
export type TypedQueryFilter<E> = v28_0_0.QueryFilter<E>;

/**
 * The `@truenas/api-client` instance behind {@link ApiService}.
 *
 * It owns the tab's only API socket (the shell's terminal socket is separate),
 * and its session is the app's session.
 *
 * Injected as an observable because the factory is asynchronous. It resolves
 * once and replays. The socket opens as soon as the client exists
 * (`enabled: true`), and an app initializer in `main.ts` creates it at
 * startup rather than on first use.
 *
 * The version is stated as a literal *at this call site* on purpose. That is
 * how the client derives its typed surface (`ApiDirectoryV28_0_0`) from the
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
      const debugPanel = environment.debugPanel?.enabled
        ? { debug: inject(WebSocketDebugService), mocks: inject(MockResponseService) }
        : null;

      // The appliance serves the page in production, so the page's scheme is
      // the appliance's. `location.protocol` is a plain string that can be
      // `file:` or `chrome-extension:`, hence the narrowing rather than a cast.
      const protocol: ApplianceProtocol = window.location.protocol === 'http:' ? 'http:' : 'https:';

      return from(createTrueNasClient({
        uuid: 'webui',
        hostnames: [environment.remote],
        enabled: true,
        version: 'v28.0.0',
        protocol,
        logger: environment.production ? noopLogger : consoleLogger,
      })).pipe(
        // Before anything else holds the client, so every call it sends is counted.
        tap((client) => limitConcurrentCalls(client.connection)),
        // After the gate, so a mocked call is answered without taking a place in it.
        tap((client) => {
          if (debugPanel) {
            interceptConnection(client.connection, debugPanel.debug, debugPanel.mocks);
          }
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    },
  },
);
