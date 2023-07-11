import {
  Component, Inject, OnDestroy, OnInit,
} from '@angular/core';
import { Navigation, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, lastValueFrom, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import helptext from 'app/helptext/network/interfaces/interfaces-list';
import { CoreEvent } from 'app/interfaces/events';
import { NetworkInterfacesChangedEvent } from 'app/interfaces/events/network-interfaces-changed-event.interface';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppTableConfig } from 'app/modules/entity/table/table.component';
import { TableService } from 'app/modules/entity/table/table.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import {
  AppLoaderService,
  DialogService, SystemGeneralService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { AppState } from 'app/store/index';

@UntilDestroy()
@Component({
  selector: 'ix-interfaces-list',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
})
export class NetworkComponent implements OnInit, OnDestroy {
  protected summaryCall = 'network.general.summary' as const;
  formEvent$: Subject<CoreEvent>;

  isHaEnabled = false;
  hasPendingChanges = false;
  checkinWaiting = false;
  checkinTimeout = 60;
  checkinTimeoutPattern = /\d+/;
  checkinRemaining: number = null;
  private uniqueIps: string[] = [];
  private affectedServices: string[] = [];
  checkinInterval: Interval;

  private navigation: Navigation;
  helptext = helptext;

  staticRoutesTableConf: AppTableConfig<NetworkComponent> = {
    title: this.translate.instant('Static Routes'),
    queryCall: 'staticroute.query',
    deleteCall: 'staticroute.delete',
    name: 'staticRoutes',
    columns: [
      { name: this.translate.instant('Destination'), prop: 'destination' },
      { name: this.translate.instant('Gateway'), prop: 'gateway' },
    ],
    parent: this,
    add: () => {
      const slideInRef = this.slideInService.open(StaticRouteFormComponent);
      this.handleSlideInClosed(slideInRef);
    },
    edit: (route: StaticRoute) => {
      const slideInRef = this.slideInService.open(StaticRouteFormComponent, { data: route });
      this.handleSlideInClosed(slideInRef);
    },
    deleteMsg: {
      title: 'static route',
      key_props: ['destination', 'gateway'],
    },
  };

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private dialogService: DialogService,
    private formatter: IxFormatterService,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private tableService: TableService,
    private slideInService: IxSlideInService,
    private core: CoreService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    private errorHandler: ErrorHandlerService,
    private systemGeneralService: SystemGeneralService,
    private interfacesStore: InterfacesStore,
    @Inject(WINDOW) private window: Window,
  ) {
    this.navigation = this.router.getCurrentNavigation();
  }

  ngOnInit(): void {
    this.checkInterfacePendingChanges();
    this.core
      .register({ observerClass: this, eventName: 'NetworkInterfacesChanged' })
      .pipe(untilDestroyed(this))
      .subscribe((evt: NetworkInterfacesChangedEvent) => {
        if (!evt || !evt.data.checkin) {
          return;
        }

        this.checkinRemaining = null;
        this.checkinWaiting = false;
        if (this.checkinInterval) {
          clearInterval(this.checkinInterval);
        }
        this.hasPendingChanges = false;
      });

    if (this.systemGeneralService.getProductType() === ProductType.ScaleEnterprise) {
      this.listenForHaStatus();
    }

    this.openInterfaceForEditFromRoute();
  }

  handleSlideInClosed(slideInRef: IxSlideInRef<unknown, unknown>): void {
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.staticRoutesTableConf.tableComponent.getData();
      this.interfacesStore.loadInterfaces();
      this.checkInterfacePendingChanges();
    });
  }

  async checkInterfacePendingChanges(): Promise<void> {
    let hasPendingChanges = await this.getPendingChanges();
    let checkinWaitingSeconds = await this.getCheckinWaitingSeconds();

    if (hasPendingChanges && checkinWaitingSeconds > 0) {
      await this.cancelCommit();
      hasPendingChanges = await this.getPendingChanges();
      checkinWaitingSeconds = await this.getCheckinWaitingSeconds();
    }

    this.hasPendingChanges = hasPendingChanges;
    this.handleWaitingCheckin(checkinWaitingSeconds);
  }

  private listenForHaStatus(): void {
    combineLatest([
      this.store$.select(selectIsHaLicensed),
      this.store$.select(selectHaStatus).pipe(filter(Boolean)),
    ]).pipe(untilDestroyed(this)).subscribe(([isHa, { hasHa }]) => {
      this.isHaEnabled = isHa && hasHa;
    });
  }

  private getCheckinWaitingSeconds(): Promise<number> {
    return lastValueFrom(
      this.ws.call('interface.checkin_waiting'),
    );
  }

  private getPendingChanges(): Promise<boolean> {
    return lastValueFrom(
      this.ws.call('interface.has_pending_changes'),
    );
  }

  private async cancelCommit(): Promise<void> {
    await lastValueFrom(
      this.ws.call('interface.cancel_rollback'),
    );
  }

  private handleWaitingCheckin(seconds: number): void {
    if (seconds !== null) {
      if (seconds > 0 && this.checkinRemaining === null) {
        this.checkinRemaining = Math.round(seconds);
        this.checkinInterval = setInterval(() => {
          if (this.checkinRemaining > 0) {
            this.checkinRemaining -= 1;
          } else {
            this.checkinRemaining = null;
            this.checkinWaiting = false;
            clearInterval(this.checkinInterval);
            this.window.location.reload(); // should just refresh after the timer goes off
          }
        }, 1000);
      }
      this.checkinWaiting = true;
    } else {
      this.checkinWaiting = false;
      this.checkinRemaining = null;
      if (this.checkinInterval) {
        clearInterval(this.checkinInterval);
      }
    }
  }

  commitPendingChanges(): void {
    this.ws
      .call('interface.services_restarted_on_sync')
      .pipe(untilDestroyed(this))
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
            title: helptext.commit_changes_title,
            message: helptext.commit_changes_warning,
            hideCheckbox: false,
            buttonText: helptext.commit_button,
          })
          .pipe(untilDestroyed(this))
          .subscribe((confirm: boolean) => {
            if (confirm) {
              this.loader.open();
              this.ws
                .call('interface.commit', [{ checkin_timeout: this.checkinTimeout }])
                .pipe(untilDestroyed(this))
                .subscribe({
                  next: async () => {
                    this.core.emit({
                      name: 'NetworkInterfacesChanged',
                      data: { commit: true, checkin: false },
                      sender: this,
                    });
                    this.interfacesStore.loadInterfaces();
                    this.loader.close();
                    this.handleWaitingCheckin(await this.getCheckinWaitingSeconds());
                  },
                  error: (error: WebsocketError) => {
                    this.loader.close();
                    this.dialogService.error(this.errorHandler.parseWsError(error));
                  },
                });
            }
          });
      });
  }

  checkInNow(): void {
    if (this.affectedServices.length > 0) {
      this.dialogService
        .confirm({
          title: helptext.services_restarted.title,
          message: this.translate.instant(helptext.services_restarted.message, {
            uniqueIPs: this.uniqueIps.join(', '),
            affectedServices: this.affectedServices.join(', '),
          }),
          hideCheckbox: true,
          buttonText: helptext.services_restarted.button,
        })
        .pipe(filter(Boolean), untilDestroyed(this))
        .subscribe(() => {
          this.finishCheckin();
        });
    } else {
      this.dialogService
        .confirm({
          title: helptext.checkin_title,
          message: helptext.checkin_message,
          hideCheckbox: true,
          buttonText: helptext.checkin_button,
        })
        .pipe(filter(Boolean), untilDestroyed(this))
        .subscribe(() => {
          this.finishCheckin();
        });
    }
  }

  finishCheckin(): void {
    this.loader.open();
    this.ws
      .call('interface.checkin')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: true, checkin: true }, sender: this });
          this.loader.close();
          this.snackbar.success(
            this.translate.instant(helptext.checkin_complete_message),
          );
          this.hasPendingChanges = false;
          this.checkinWaiting = false;
          clearInterval(this.checkinInterval);
          this.checkinRemaining = null;
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }

  rollbackPendingChanges(): void {
    this.dialogService
      .confirm({
        title: helptext.rollback_changes_title,
        message: helptext.rollback_changes_warning,
        hideCheckbox: false,
        buttonText: helptext.rollback_button,
      })
      .pipe(untilDestroyed(this))
      .subscribe((confirm: boolean) => {
        if (confirm) {
          this.loader.open();
          this.ws
            .call('interface.rollback')
            .pipe(untilDestroyed(this))
            .subscribe({
              next: () => {
                this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false }, sender: this });
                this.interfacesStore.loadInterfaces();
                this.hasPendingChanges = false;
                this.checkinWaiting = false;
                this.loader.close();
                this.snackbar.success(
                  this.translate.instant(helptext.changes_rolled_back),
                );
              },
              error: (error: WebsocketError) => {
                this.loader.close();
                this.dialogService.error(this.errorHandler.parseWsError(error));
              },
            });
        }
      });
  }

  goToHa(): void {
    this.router.navigate(['/', 'system', 'failover']);
  }

  ngOnDestroy(): void {
    if (this.formEvent$) {
      this.formEvent$.complete();
    }
    this.core.unregister({ observerClass: this });
  }

  private openInterfaceForEditFromRoute(): void {
    const state = this.navigation?.extras?.state as { editInterface: string };
    if (!state?.editInterface) {
      return;
    }

    this.loader.open();
    this.ws.call('interface.query', [[['id', '=', state.editInterface]]])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (interfaces) => {
          this.loader.close();
          if (!interfaces[0]) {
            return;
          }

          const slideInRef = this.slideInService.open(InterfaceFormComponent, { data: interfaces[0] });
          this.handleSlideInClosed(slideInRef);
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
