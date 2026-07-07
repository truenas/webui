import {
  Injectable, computed, inject, signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, of, forkJoin,
} from 'rxjs';
import {
  defaultIfEmpty, switchMap, take, map, catchError, shareReplay, tap,
} from 'rxjs/operators';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSharingWebshare } from 'app/helptext/sharing/webshare/webshare';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebShareTableRow } from 'app/pages/sharing/components/webshare-name-cell/webshare-name-cell.component';
import { LicenseService } from 'app/services/license.service';
import { WebShareSharesFormComponent, WebShareFormData } from './webshare-shares-form/webshare-shares-form.component';

@Injectable({
  providedIn: 'root',
})
export class WebShareService {
  private window = inject(WINDOW);
  private api = inject(ApiService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private licenseService = inject(LicenseService);
  private formPanel = inject(FormSidePanelService);
  private truenasConnectService = inject(TruenasConnectService);

  /**
   * Port 755 is the standard WebShare service port defined by the backend.
   * This must match the port configured in the WebShare service and cannot be changed from the UI.
   */
  private readonly webSharePort = 755;

  /**
   * Check if current domain is *.truenas.direct (static check, hostname doesn't change at runtime).
   * WebShare service is only accessible on *.truenas.direct domains for security reasons.
   */
  readonly isTruenasDirectDomain = this.window.location.hostname.includes('.truenas.direct');

  /**
   * Whether TrueNAS Connect is currently configured (fully operational).
   * Backed by `tn_connect.config` events, so disabling TrueNAS Connect immediately
   * flips this to `false` without requiring a page refresh.
   */
  private isTruenasConnectConfigured = computed(
    () => this.truenasConnectService.config()?.status === TruenasConnectStatus.Configured,
  );

  /**
   * Hostname resolved from TrueNAS Connect IP mappings.
   * When not on a truenas.direct domain, we check if the local IP has a matching hostname.
   */
  private resolvedHostname = signal<string | null>(null);

  /**
   * Hostname to use when opening WebShare. Only available while TrueNAS Connect is
   * configured. When TrueNAS Connect is disabled this resolves to `null` so we never
   * generate a stale `.truenas.direct` URL that would produce SSL errors.
   */
  private truenasConnectHostname = computed<string | null>(
    () => (this.isTruenasConnectConfigured() ? this.resolvedHostname() : null),
  );

  readonly truenasConnectHostname$ = toObservable(this.truenasConnectHostname);

  /**
   * Whether WebShare can be opened. Requires both an accessible hostname
   * (either the current `.truenas.direct` domain or a resolved hostname) AND that
   * TrueNAS Connect is currently configured. This reacts to TrueNAS Connect being
   * disabled so the UI immediately blocks WebShare access without a page refresh.
   */
  readonly canOpenWebShare = computed<boolean>(() => !this.webShareUnavailableReason());

  readonly canOpenWebShare$ = toObservable(this.canOpenWebShare);

  /**
   * Human-readable explanation of why WebShare cannot be opened, or `null` when it
   * can. Used both for the disabled-button tooltip and the `openWebShare()` snackbar
   * so the user always sees the actual reason (TrueNAS Connect disabled vs. wrong
   * domain) rather than a tooltip that only ever blames the domain.
   */
  readonly webShareUnavailableReason = computed<TranslatedString | null>(() => {
    if (!this.isTruenasConnectConfigured()) {
      return this.translate.instant('WebShare is unavailable because TrueNAS Connect is disabled.');
    }

    if (!this.isTruenasDirectDomain && !this.resolvedHostname()) {
      return this.translate.instant('WebShare can only be opened when accessed via a .truenas.direct domain');
    }

    return null;
  });

  readonly webShareUnavailableReason$ = toObservable(this.webShareUnavailableReason);

  /**
   * Observable that fetches and caches the IP to hostname mapping.
   * Combines tn_connect.ips_with_hostnames and interface.websocket_local_ip to determine
   * if there's a truenas.direct hostname available for the current connection.
   */
  readonly hostnameMapping$ = forkJoin([
    this.api.call('tn_connect.ips_with_hostnames'),
    this.api.call('interface.websocket_local_ip'),
  ]).pipe(
    map(([ipsWithHostnames, localIp]) => {
      const hostname = ipsWithHostnames[localIp];
      return { ipsWithHostnames, localIp, hostname };
    }),
    tap(({ hostname }) => {
      this.resolvedHostname.set(hostname ?? null);
    }),
    catchError((error: unknown) => {
      console.error('Failed to fetch hostname mapping for WebShare:', error);
      return of({ ipsWithHostnames: {} as Record<string, string>, localIp: '', hostname: undefined });
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * Observable that checks if there are any local users configured with WebShare access.
   * Returns true if at least one local user has webshare=true, false otherwise.
   */
  readonly hasWebshareUsers$ = this.api.call('user.query', [[['webshare', '=', true], ['local', '=', true]]]).pipe(
    map((users) => users.length > 0),
    catchError(() => of(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /**
   * Opens a WebShare in a new browser window/tab.
   * Uses the truenas.direct hostname if available (either from current domain or resolved from IP mapping).
   * @param shareName - Optional name of the specific share to open. If omitted, opens the root WebShare listing.
   */
  openWebShare(shareName?: string): void {
    const unavailableReason = this.webShareUnavailableReason();
    if (unavailableReason) {
      this.snackbar.error(unavailableReason);
      return;
    }

    const hostname = this.isTruenasDirectDomain
      ? this.window.location.hostname
      : this.truenasConnectHostname();
    const path = shareName ? `/webshare/${shareName}` : '/webshare/';
    const webShareUrl = `https://${hostname}:${this.webSharePort}${path}`;
    const newWindow = this.window.open(webShareUrl, '_blank');

    if (!newWindow) {
      this.snackbar.error(
        this.translate.instant('Unable to open WebShare. Please check your browser\'s popup blocker settings.'),
      );
    }
  }

  /**
   * Opens the WebShare form to add or edit a share.
   * Checks for TrueNAS Connect availability before opening the form.
   * If TrueNAS Connect is not configured, opens the TrueNAS Connect status dialog instead.
   *
   * @param data - Form data for creating or editing a WebShare
   * @returns Observable that emits true if the form was submitted successfully, false otherwise
   */
  openWebShareForm(data: WebShareFormData): Observable<boolean> {
    // The TrueNAS Connect config is already resolved app-wide — `TruenasConnectService` keeps a
    // live subscription through its `config` signal, and the WebShare pages subscribe to `config$`.
    // Read that cached value synchronously so the panel opens instantly: re-subscribing to
    // `hasTruenasConnect$` re-runs `tn_connect.config`, and that websocket round-trip is the lag
    // before the form appears. Only wait on the observable if the config hasn't loaded yet (cold
    // navigation straight to a WebShare action).
    const config = this.truenasConnectService.config();
    if (config !== undefined) {
      return this.openFormForAccess(config.status === TruenasConnectStatus.Configured, data);
    }

    return this.licenseService.hasTruenasConnect$.pipe(
      take(1),
      switchMap((hasAccess) => this.openFormForAccess(hasAccess, data)),
    );
  }

  private openFormForAccess(hasAccess: boolean, data: WebShareFormData): Observable<boolean> {
    if (!hasAccess) {
      this.truenasConnectService.openStatusModal();
      return of(false);
    }

    return this.formPanel.open(
      WebShareSharesFormComponent,
      {
        title: data.isNew
          ? this.translate.instant(helptextSharingWebshare.webshare_form_title_add)
          : this.translate.instant(helptextSharingWebshare.webshare_form_title_edit),
        inputs: { webShareData: data },
      },
    ).success$.pipe(
      map(() => true),
      defaultIfEmpty(false),
    );
  }

  /**
   * Fetches WebShare configurations and transforms them into table row format.
   * This method provides a consistent way to retrieve and format WebShare data for display in tables.
   *
   * @returns Observable that emits an array of WebShare table rows
   */
  getWebShareTableRows(): Observable<WebShareTableRow[]> {
    return this.api.call('sharing.webshare.query', [[]]).pipe(
      map((shares) => this.transformToTableRows(shares)),
    );
  }

  /**
   * Transforms WebShare objects into table row format.
   * This provides a consistent transformation across all components that display WebShares in tables.
   *
   * @param shares - Array of WebShare objects
   * @returns Array of WebShare table rows
   */
  transformToTableRows(
    shares: { id: number; name: string; path: string; is_home_base?: boolean }[],
  ): WebShareTableRow[] {
    return shares.map((share) => ({
      id: share.id,
      name: share.name,
      path: share.path,
      isHomeBase: share.is_home_base ?? false,
    }));
  }
}
