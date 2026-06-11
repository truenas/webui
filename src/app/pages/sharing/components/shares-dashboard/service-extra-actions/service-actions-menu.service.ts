import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import type { TnCardControl, TnCardHeaderStatus, TnMenuItem } from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { AuditService } from 'app/enums/audit.enum';
import { ServiceName, serviceNames, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Service } from 'app/interfaces/service.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceWebshareComponent } from 'app/pages/services/components/service-webshare/service-webshare.component';
import {
  GlobalTargetConfigurationComponent,
} from 'app/pages/sharing/iscsi/global-target-configuration/global-target-configuration.component';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AuditUrlOptions, UrlOptionsService } from 'app/services/url-options.service';

@Injectable({ providedIn: 'root' })
export class ServiceActionsMenuService {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private router = inject(Router);
  private slideIn = inject(SlideIn);
  private urlOptions = inject(UrlOptionsService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  /**
   * Convenience: build the full default menu (toggle, config, sessions, logs).
   * Cards that need to substitute one of the items (e.g. open the config in
   * a host-controlled tn-side-panel rather than the legacy slide-in) should
   * compose from the granular builders below instead.
   */
  buildMenuItems(service: Service, hasControlRole: boolean): TnMenuItem[] {
    return [
      this.buildToggleItem(service, hasControlRole),
      this.buildConfigItem(service),
      this.buildSessionsItem(service),
      this.buildLogsItem(service),
    ].filter((item): item is TnMenuItem => item !== null);
  }

  buildToggleItem(service: Service, hasControlRole: boolean): TnMenuItem | null {
    if (!hasControlRole) {
      return null;
    }
    const stateLabel = service.state === ServiceStatus.Running
      ? this.translate.instant('Turn Off Service')
      : this.translate.instant('Turn On Service');
    return {
      id: 'service-state-toggle',
      label: stateLabel,
      testId: this.menuItemTestId(service, stateLabel),
      action: () => this.changeServiceState(service),
    };
  }

  buildConfigItem(service: Service): TnMenuItem {
    return {
      id: 'service-config',
      label: this.translate.instant('Config Service'),
      testId: this.menuItemTestId(service, 'Config Service'),
      action: () => this.configureService(service),
    };
  }

  buildSessionsItem(service: Service): TnMenuItem | null {
    if (![ServiceName.Nfs, ServiceName.Cifs].includes(service.service)) {
      return null;
    }
    return {
      id: 'service-sessions',
      label: this.translate.instant('{name} Sessions', { name: serviceNames.get(service.service) }),
      testId: this.menuItemTestId(service, 'sessions'),
      action: () => this.viewSessions(service.service),
    };
  }

  buildLogsItem(service: Service): TnMenuItem | null {
    if (service.service !== ServiceName.Cifs) {
      return null;
    }
    return {
      id: 'service-logs',
      label: this.translate.instant('Audit Logs'),
      testId: this.menuItemTestId(service, 'logs'),
      action: () => this.viewLogs(),
    };
  }

  /**
   * Card-header status mapper shared by every service card. Maps `ServiceStatus`
   * to the `TnCardHeaderStatus` shape consumed by `tn-card`'s `[headerStatus]`
   * input. Kept here so all five service cards stay in sync on the `default`
   * branch — divergence there is the easy, silent inconsistency the playbook
   * warns about.
   */
  buildCardHeaderStatus(service: Service | undefined): TnCardHeaderStatus | undefined {
    if (!service) {
      return undefined;
    }
    const label = this.translate.instant(this.titleCase(service.state));
    const testId = `button-service-status-${kebabCase(service.service)}`;
    switch (service.state) {
      case ServiceStatus.Running:
        return { label, type: 'success', testId };
      case ServiceStatus.Stopped:
        return { label, type: 'neutral', testId };
      default:
        return { label, type: 'warning', testId };
    }
  }

  /**
   * Stable test ID for the card-header menu trigger. Matches the legacy
   * `[ixTest]="[service.id, 'actions-menu']"` value the old icon-button used.
   */
  cardHeaderMenuTriggerTestId(service: Service | undefined): string | undefined {
    return service ? `button-${service.id}-actions-menu` : undefined;
  }

  /**
   * Compose the card-header menu with the `Config Service` item replaced by a
   * card-local action (so the card can open the config form inside its own
   * `tn-side-panel` viewChild rather than the global slide-in). The service
   * on/off toggle is intentionally NOT included here — cards expose it as a
   * `tn-card` header control via {@link buildServiceControl}. The remaining
   * items (sessions, logs) are sourced from the shared builders so test IDs and
   * labels stay identical across cards.
   */
  buildServiceCardMenu(
    service: Service | undefined,
    hasControlRole: boolean,
    openLocalConfig: () => void,
  ): TnMenuItem[] | undefined {
    if (!service) {
      return undefined;
    }
    const localConfigItem: TnMenuItem = {
      id: 'service-config',
      label: this.translate.instant('Config Service'),
      testId: this.menuItemTestId(service, 'Config Service'),
      action: openLocalConfig,
    };
    return [
      localConfigItem,
      this.buildSessionsItem(service),
      this.buildLogsItem(service),
    ].filter((item): item is TnMenuItem => item !== null);
  }

  /**
   * Service on/off control for a card header (`tn-card` `[headerControl]`),
   * exposing start/stop without opening the card menu. Returns `undefined` when
   * there's no service or the user lacks the control role (so the toggle is
   * hidden, matching the old menu item's role gating). The label is empty — the
   * adjacent colored status badge is the visual indicator — and `tn-slide-toggle`
   * still announces an accessible name. Toggling flips the current state via the
   * same `changeServiceState` path the menu item used.
   */
  buildServiceControl(service: Service | undefined, hasControlRole: boolean): TnCardControl | undefined {
    if (!service || !hasControlRole) {
      return undefined;
    }
    return {
      label: '',
      checked: service.state === ServiceStatus.Running,
      testId: `service-${kebabCase(service.service)}`,
      handler: () => this.changeServiceState(service),
    };
  }

  /**
   * Build a `tn-side-panel` `[closeGuard]` that reproduces the legacy slide-in host's
   * unsaved-changes confirmation. When `isDirty()` is true it prompts before allowing
   * the panel to close (× button, backdrop, or Escape); otherwise it closes immediately.
   * Cards hosting a config form in a side panel pass this so dismissing with unsaved
   * edits no longer silently discards them — parity with the old `requireConfirmationWhen`.
   */
  buildUnsavedChangesGuard(isDirty: () => boolean): () => Observable<boolean> {
    return () => (isDirty() ? this.unsavedChanges.showConfirmDialog() : of(true));
  }

  private titleCase(value: string): string {
    return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : '';
  }

  /**
   * Mirrors the value the legacy `[ixTest]="[service.service, 'actions-menu', label]"`
   * directive used to produce on the old `<button mat-menu-item>` element, including the
   * `button-` element-type prefix that `[ixTest]` would auto-add. Each part is kebab-cased
   * to match the directive's normalization, so e.g. service `iscsi.target` with label
   * `Config Service` yields `button-iscsi-target-actions-menu-config-service`.
   */
  menuItemTestId(service: Service, actionLabel: string): string {
    return [
      'button',
      kebabCase(service.service),
      'actions-menu',
      kebabCase(actionLabel),
    ].join('-');
  }

  private changeServiceState(service: Service): void {
    if (service.state === ServiceStatus.Running) {
      this.stopService(service);
    } else {
      this.startService(service);
    }
  }

  private configureService(service: Service): void {
    switch (service.service) {
      case ServiceName.NvmeOf:
        this.slideIn.open(NvmeOfConfigurationComponent);
        break;
      case ServiceName.Iscsi:
        this.slideIn.open(GlobalTargetConfigurationComponent);
        break;
      case ServiceName.Nfs:
        this.slideIn.open(ServiceNfsComponent, { wide: true });
        break;
      case ServiceName.Cifs:
        this.slideIn.open(ServiceSmbComponent);
        break;
      case ServiceName.WebShare:
        this.slideIn.open(ServiceWebshareComponent);
        break;
      default:
        break;
    }
  }

  private viewSessions(serviceName: ServiceName): void {
    if (serviceName === ServiceName.Cifs) {
      this.router.navigate(['/sharing', 'smb', 'status', 'sessions']);
    } else if (serviceName === ServiceName.Nfs) {
      this.router.navigate(['/sharing', 'nfs', 'sessions']);
    }
  }

  private viewLogs(): void {
    const url = this.urlOptions.buildUrl('/system/audit', {
      service: AuditService.Smb,
    } as AuditUrlOptions);
    this.router.navigateByUrl(url);
  }

  private startService(service: Service): void {
    this.api.job('service.control', [ServiceOperation.Start, service.service, { silent: false }])
      .pipe(
        observeJob(),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        complete: () => this.snackbar.success(this.translate.instant('Service started')),
      });
  }

  private stopService(service: Service): void {
    this.api.job('service.control', [ServiceOperation.Stop, service.service, { silent: false }])
      .pipe(
        observeJob(),
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        complete: () => this.snackbar.success(this.translate.instant('Service stopped')),
      });
  }
}
