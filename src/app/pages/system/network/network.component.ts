import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, viewChild, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NgModel, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Navigation, Router } from '@angular/router';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnBannerComponent, TnBannerActionDirective } from '@truenas/ui-components';
import ipRegex from 'ip-regex';
import {
  combineLatest, firstValueFrom, lastValueFrom, Observable, switchMap,
} from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { InterfaceFormComponent } from 'app/pages/system/network/components/interface-form/interface-form.component';
import { InterfacesCardComponent } from 'app/pages/system/network/components/interfaces-card/interfaces-card.component';
import { IpmiCardComponent } from 'app/pages/system/network/components/ipmi-card/ipmi-card.component';
import { NetworkConfigurationCardComponent } from 'app/pages/system/network/components/network-configuration-card/network-configuration-card.component';
import { StaticRoutesCardComponent } from 'app/pages/system/network/components/static-routes-card/static-routes-card.component';
import { networkElements } from 'app/pages/system/network/network.elements';
import { InterfacesStore } from 'app/pages/system/network/stores/interfaces.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { NetworkService } from 'app/services/network.service';
import { AppState } from 'app/store';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UiSearchDirective,
    MatFormField,
    MatInput,
    ReactiveFormsModule,
    TestDirective,
    FormsModule,
    MatError,
    MatButton,
    InterfacesCardComponent,
    NetworkConfigurationCardComponent,
    StaticRoutesCardComponent,
    IpmiCardComponent,
    TranslateModule,
    TnBannerComponent,
    TnBannerActionDirective,
  ],
  providers: [
    InterfacesStore,
  ],
})
export class NetworkComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private dialogService = inject(DialogService);
  private loader = inject(LoaderService);
  private translate = inject(TranslateService);
  private slideIn = inject(SlideIn);
  private snackbar = inject(SnackbarService);
  private store$ = inject<Store<AppState>>(Store);
  private errorHandler = inject(ErrorHandlerService);
  private interfacesStore = inject(InterfacesStore);
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private networkService = inject(NetworkService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = networkElements;

  readonly checkinTimeoutField = viewChild<NgModel>('checkinTimeoutField');

  protected readonly isHaEnabled = toSignal(this.networkService.getIsHaEnabled());
  hasPendingChanges = false;
  checkinWaiting = false;
  checkinTimeout = 60;
  checkinTimeoutMinValue = 10;
  checkinTimeoutPattern = '^[0-9]+$';
  checkinRemaining: number | null = null;
  private uniqueIps: string[] = [];
  private affectedServices: string[] = [];
  checkinInterval: Interval;
  newSystemUrls: string[] = [];
  willLoseUiAccess = false;

  private navigation: Navigation | null;
  helptext = helptextInterfaces;

  protected get isCheckinTimeoutFieldInvalid(): boolean {
    return this.checkinTimeoutField()?.invalid || false;
  }

  constructor() {
    this.navigation = this.router.currentNavigation();
  }

  ngOnInit(): void {
    this.loadCheckinStatus();

    this.actions$.pipe(ofType(networkInterfacesChanged), takeUntilDestroyed(this.destroyRef))
      .subscribe(({ checkIn }) => {
        if (!checkIn) {
          return;
        }

        this.checkinRemaining = null;
        this.checkinWaiting = false;
        if (this.checkinInterval) {
          clearInterval(this.checkinInterval);
        }
        this.hasPendingChanges = false;
        this.cdr.markForCheck();
      });

    this.openInterfaceForEditFromRoute();
  }

  protected handleSlideInClosed(slideInRef$: Observable<SlideInResponse<boolean>>): void {
    slideInRef$.pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.interfacesStore.loadInterfaces();
      this.loadCheckinStatusAfterChange();
    });
  }

  private async loadCheckinStatus(): Promise<void> {
    if (!await firstValueFrom(this.authService.hasRole(Role.NetworkInterfaceWrite))) {
      return;
    }

    this.hasPendingChanges = await this.getPendingChanges();
    this.handleWaitingCheckIn(await this.getCheckInWaitingSeconds());
    if (this.hasPendingChanges) {
      this.detectPendingIpChange();
    }
    this.cdr.markForCheck();
  }

  protected async loadCheckinStatusAfterChange(): Promise<void> {
    if (!await firstValueFrom(this.authService.hasRole(Role.NetworkInterfaceWrite))) {
      return;
    }

    let hasPendingChanges = await this.getPendingChanges();
    let checkinWaitingSeconds = await this.getCheckInWaitingSeconds();

    // This handles scenario where user made one change, clicked Test and then made another change.
    // TODO: Backend should be deciding to reset timer.
    if (hasPendingChanges && Number(checkinWaitingSeconds) > 0) {
      await this.cancelCommit();
      hasPendingChanges = await this.getPendingChanges();
      checkinWaitingSeconds = await this.getCheckInWaitingSeconds();
    }

    this.hasPendingChanges = hasPendingChanges;
    this.handleWaitingCheckIn(checkinWaitingSeconds);
    if (this.hasPendingChanges) {
      this.detectPendingIpChange();
    }
    this.cdr.markForCheck();
  }

  private getCheckInWaitingSeconds(): Promise<number | null> {
    return lastValueFrom(
      this.api.call('interface.checkin_waiting'),
    );
  }

  private getPendingChanges(): Promise<boolean> {
    return lastValueFrom(
      this.api.call('interface.has_pending_changes'),
    );
  }

  private async cancelCommit(): Promise<void> {
    await lastValueFrom(
      this.api.call('interface.cancel_rollback'),
    );
  }

  private handleWaitingCheckIn(seconds: number | null, isAfterInterfaceCommit = false): void {
    if (seconds !== null) {
      if (seconds > 0 && this.checkinRemaining === null) {
        this.checkinRemaining = Math.round(seconds);
        this.checkinInterval = setInterval(() => {
          if (Number(this.checkinRemaining) > 0) {
            this.checkinRemaining = Number(this.checkinRemaining) - 1;
          } else {
            this.checkinRemaining = null;
            this.checkinWaiting = false;
            this.newSystemUrls = [];
            this.willLoseUiAccess = false;
            clearInterval(this.checkinInterval);
            this.window.location.reload(); // should just refresh after the timer goes off
          }

          this.cdr.markForCheck();
        }, 1000);
      }
      this.checkinWaiting = true;
    } else {
      this.checkinWaiting = false;
      this.checkinRemaining = null;
      this.newSystemUrls = [];
      this.willLoseUiAccess = false;
      if (this.checkinInterval) {
        clearInterval(this.checkinInterval);
      }
      // Inform user that we have restored the previous network configuration to ensure continued connectivity.
      if (isAfterInterfaceCommit) {
        this.hasPendingChanges = false;
        this.dialogService.warn(
          this.translate.instant(this.helptext.networkReconnectionIssue),
          this.translate.instant(this.helptext.networkReconnectionIssueText),
        );
      }
    }
  }

  protected commitPendingChanges(): void {
    this.api
      .call('interface.services_restarted_on_sync')
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((services) => {
        if (services.length > 0) {
          const ips: string[] = [];
          services.forEach((item) => {
            // TODO: Check if `system-service` can actually be returned.
            const systemService = (item as unknown as { 'system-service': string })['system-service'];
            if (systemService) {
              this.affectedServices.push(systemService);
            }
            if (item.service) {
              this.affectedServices.push(item.service);
            }
            item.ips.forEach((ip) => {
              ips.push(ip);
            });
          });

          ips.forEach((ip) => {
            if (!this.uniqueIps.includes(ip)) {
              this.uniqueIps.push(ip);
            }
          });
        }
        this.dialogService
          .confirm({
            title: this.translate.instant(helptextInterfaces.commitChangesTitle),
            message: this.translate.instant(helptextInterfaces.commitChangesWarning),
            hideCheckbox: false,
            buttonText: this.translate.instant(helptextInterfaces.commitButton),
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((confirm: boolean) => {
            if (!confirm) {
              return;
            }

            this.api
              .call('interface.commit', [{ checkin_timeout: this.checkinTimeout }])
              .pipe(
                this.loader.withLoader(),
                this.errorHandler.withErrorHandler(),
                switchMap(() => this.getCheckInWaitingSeconds()),
                takeUntilDestroyed(this.destroyRef),
              )
              .subscribe((checkInSeconds) => {
                this.store$.dispatch(networkInterfacesChanged({ commit: true, checkIn: false }));
                this.interfacesStore.loadInterfaces();
                this.handleWaitingCheckIn(checkInSeconds, true);
                this.cdr.markForCheck();
              });
          });
      });
  }

  protected checkInNow(): void {
    if (this.affectedServices.length > 0) {
      this.dialogService
        .confirm({
          title: this.translate.instant(helptextInterfaces.servicesRestarted.title),
          message: this.translate.instant(helptextInterfaces.servicesRestarted.message, {
            uniqueIPs: this.uniqueIps.join(', '),
            affectedServices: this.affectedServices.join(', '),
          }),
          hideCheckbox: true,
          buttonText: this.translate.instant(helptextInterfaces.servicesRestarted.button),
        })
        .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.finishCheckin();
        });
    } else {
      this.dialogService
        .confirm({
          title: this.translate.instant(helptextInterfaces.checkinTitle),
          message: this.translate.instant(helptextInterfaces.checkinMessage),
          hideCheckbox: true,
          buttonText: this.translate.instant(helptextInterfaces.checkinButton),
        })
        .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.finishCheckin();
        });
    }
  }

  private finishCheckin(): void {
    this.api
      .call('interface.checkin')
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.store$.dispatch(networkInterfacesChanged({ commit: true, checkIn: true }));

        this.snackbar.success(
          this.translate.instant(helptextInterfaces.checkinCompleteMessage),
        );
        this.hasPendingChanges = false;
        this.checkinWaiting = false;
        clearInterval(this.checkinInterval);
        this.checkinRemaining = null;
        this.newSystemUrls = [];
        this.willLoseUiAccess = false;
        this.cdr.markForCheck();
      });
  }

  protected rollbackPendingChanges(): void {
    this.dialogService
      .confirm({
        title: this.translate.instant(helptextInterfaces.revertChangesTitle),
        message: this.translate.instant(helptextInterfaces.revertChangesWarning),
        hideCheckbox: false,
        buttonText: this.translate.instant(helptextInterfaces.revertChangesButton),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirm: boolean) => {
        if (!confirm) {
          return;
        }

        this.api
          .call('interface.rollback')
          .pipe(
            this.loader.withLoader(),
            this.errorHandler.withErrorHandler(),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe(() => {
            this.store$.dispatch(networkInterfacesChanged({ commit: false }));
            this.interfacesStore.loadInterfaces();
            this.hasPendingChanges = false;
            this.checkinWaiting = false;
            this.newSystemUrls = [];
            this.willLoseUiAccess = false;
            this.snackbar.success(
              this.translate.instant(helptextInterfaces.changesRolledBack),
            );
            this.cdr.markForCheck();
          });
      });
  }

  protected goToHa(): void {
    this.router.navigate(['/', 'system', 'failover']);
  }

  private detectPendingIpChange(): void {
    const currentHostname = this.window.location.hostname.replace(/^\[|\]$/g, '');
    const isIpHostname = ipRegex({ exact: true }).test(currentHostname);

    combineLatest([
      this.api.call('interface.query'),
      this.store$.pipe(waitForGeneralConfig, take(1)),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([interfaces, generalConfig]) => {
      if (isIpHostname) {
        const pendingIps = interfaces
          .filter((iface) => this.hasAliasesChanged(iface))
          .flatMap((iface) => iface.aliases || [])
          .filter((alias) => alias.type === NetworkInterfaceAliasType.Inet
            || alias.type === NetworkInterfaceAliasType.Inet6)
          .map((alias) => alias.address)
          .filter((ip) => !ip.startsWith('fe80::') && !ip.startsWith('169.254.'));

        if (!pendingIps.includes(currentHostname)) {
          const { protocol, port } = this.window.location;
          this.newSystemUrls = [...new Set(pendingIps)].map((ip) => {
            const host = ip.includes(':') ? `[${ip}]` : ip;
            const portSuffix = port ? `:${port}` : '';
            return `${protocol}//${host}${portSuffix}/ui/network`;
          });
        } else {
          this.newSystemUrls = [];
        }
      } else {
        this.newSystemUrls = [];
      }

      this.willLoseUiAccess = this.checkWillLoseUiAccess(interfaces, generalConfig);
      this.cdr.markForCheck();
    });
  }

  private checkWillLoseUiAccess(
    interfaces: NetworkInterface[],
    generalConfig: SystemGeneralConfig,
  ): boolean {
    const allPendingIpv4 = interfaces
      .flatMap((iface) => iface.aliases || [])
      .filter((alias) => alias.type === NetworkInterfaceAliasType.Inet)
      .map((alias) => alias.address);

    const allPendingIpv6 = interfaces
      .flatMap((iface) => iface.aliases || [])
      .filter((alias) => alias.type === NetworkInterfaceAliasType.Inet6)
      .map((alias) => alias.address);

    const v4WillBeLost = generalConfig.ui_address.length > 0
      && !generalConfig.ui_address.includes('0.0.0.0')
      && !generalConfig.ui_address.some((addr) => allPendingIpv4.includes(addr));

    const v6WillBeLost = generalConfig.ui_v6address.length > 0
      && !generalConfig.ui_v6address.includes('::')
      && !generalConfig.ui_v6address.some((addr) => allPendingIpv6.includes(addr));

    return v4WillBeLost || v6WillBeLost;
  }

  private hasAliasesChanged(iface: NetworkInterface): boolean {
    const pendingAddresses = (iface.aliases || [])
      .filter((alias) => alias.type === NetworkInterfaceAliasType.Inet
        || alias.type === NetworkInterfaceAliasType.Inet6)
      .map((alias) => alias.address)
      .sort((a, b) => a.localeCompare(b));

    const activeAddresses = (iface.state?.aliases || [])
      .filter((alias) => alias.type === NetworkInterfaceAliasType.Inet
        || alias.type === NetworkInterfaceAliasType.Inet6)
      .map((alias) => alias.address)
      .sort((a, b) => a.localeCompare(b));

    if (pendingAddresses.length !== activeAddresses.length) {
      return true;
    }

    return pendingAddresses.some((addr, index) => addr !== activeAddresses[index]);
  }

  protected commitAndOpenNewUi(): void {
    this.api
      .call('interface.services_restarted_on_sync')
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((services) => {
        if (services.length > 0) {
          const ips: string[] = [];
          services.forEach((item) => {
            const systemService = (item as unknown as { 'system-service': string })['system-service'];
            if (systemService) {
              this.affectedServices.push(systemService);
            }
            if (item.service) {
              this.affectedServices.push(item.service);
            }
            item.ips.forEach((ip) => {
              ips.push(ip);
            });
          });

          ips.forEach((ip) => {
            if (!this.uniqueIps.includes(ip)) {
              this.uniqueIps.push(ip);
            }
          });
        }

        this.dialogService
          .confirm({
            title: this.translate.instant(helptextInterfaces.commitChangesTitle),
            message: this.translate.instant(helptextInterfaces.commitChangesWarning),
            hideCheckbox: false,
            buttonText: this.translate.instant(helptextInterfaces.commitButton),
          })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((confirm: boolean) => {
            if (!confirm) {
              return;
            }

            const tabs = this.newSystemUrls.map((url) => this.window.open(url, '_blank'));

            this.api
              .call('interface.commit', [{ checkin_timeout: this.checkinTimeout }])
              .pipe(
                this.loader.withLoader(),
                this.errorHandler.withErrorHandler(),
                switchMap(() => this.getCheckInWaitingSeconds()),
                takeUntilDestroyed(this.destroyRef),
              )
              .subscribe({
                next: (checkInSeconds) => {
                  this.store$.dispatch(networkInterfacesChanged({ commit: true, checkIn: false }));
                  this.interfacesStore.loadInterfaces();
                  this.handleWaitingCheckIn(checkInSeconds, true);
                  this.cdr.markForCheck();
                },
                error: () => {
                  tabs.forEach((tab) => tab?.close());
                },
              });
          });
      });
  }

  private openInterfaceForEditFromRoute(): void {
    const state = this.navigation?.extras?.state as { editInterface: string };
    if (!state?.editInterface) {
      return;
    }

    this.api.call('interface.query', [[['id', '=', state.editInterface]]])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((interfaces) => {
        if (!interfaces[0]) {
          return;
        }

        const slideInRef$ = this.slideIn.open(InterfaceFormComponent, {
          data: {
            interface: interfaces[0],
          },
        });
        this.handleSlideInClosed(slideInRef$);
      });
  }
}
