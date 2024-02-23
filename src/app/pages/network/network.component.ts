import {
  Component, Inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { Navigation, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, firstValueFrom, lastValueFrom, switchMap,
} from 'rxjs';
import { filter } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { Interval } from 'app/interfaces/timeout.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import { InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { AppState } from 'app/store/index';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

@UntilDestroy()
@Component({
  selector: 'ix-network',
  templateUrl: './network.component.html',
  styleUrls: ['./network.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkComponent implements OnInit {
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
  helptext = helptextInterfaces;

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private dialogService: DialogService,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
    private errorHandler: ErrorHandlerService,
    private systemGeneralService: SystemGeneralService,
    private interfacesStore: InterfacesStore,
    private actions$: Actions,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
  ) {
    this.navigation = this.router.getCurrentNavigation();
  }

  ngOnInit(): void {
    this.loadCheckinStatus();

    this.actions$.pipe(ofType(networkInterfacesChanged), untilDestroyed(this))
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

    if (this.systemGeneralService.getProductType() === ProductType.ScaleEnterprise) {
      this.listenForHaStatus();
    }

    this.openInterfaceForEditFromRoute();
  }

  handleSlideInClosed(slideInRef: IxSlideInRef<unknown>): void {
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.interfacesStore.loadInterfaces();
      this.loadCheckinStatusAfterChange();
    });
  }

  async loadCheckinStatus(): Promise<void> {
    if (!await firstValueFrom(this.authService.hasRole(Role.NetworkInterfaceWrite))) {
      return;
    }

    this.hasPendingChanges = await this.getPendingChanges();
    this.handleWaitingCheckin(await this.getCheckinWaitingSeconds());
  }

  async loadCheckinStatusAfterChange(): Promise<void> {
    if (!await firstValueFrom(this.authService.hasRole(Role.NetworkInterfaceWrite))) {
      return;
    }

    let hasPendingChanges = await this.getPendingChanges();
    let checkinWaitingSeconds = await this.getCheckinWaitingSeconds();

    // This handles scenario where user made one change, clicked Test and then made another change.
    // TODO: Backend should be deciding to reset timer.
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

          this.cdr.markForCheck();
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
            title: helptextInterfaces.commit_changes_title,
            message: helptextInterfaces.commit_changes_warning,
            hideCheckbox: false,
            buttonText: helptextInterfaces.commit_button,
          })
          .pipe(untilDestroyed(this))
          .subscribe((confirm: boolean) => {
            if (!confirm) {
              return;
            }

            this.ws
              .call('interface.commit', [{ checkin_timeout: this.checkinTimeout }])
              .pipe(
                this.loader.withLoader(),
                this.errorHandler.catchError(),
                switchMap(() => this.getCheckinWaitingSeconds()),
                untilDestroyed(this),
              )
              .subscribe((checkInSeconds) => {
                this.store$.dispatch(networkInterfacesChanged({ commit: true, checkIn: false }));
                this.interfacesStore.loadInterfaces();
                this.handleWaitingCheckin(checkInSeconds);
                this.cdr.markForCheck();
              });
          });
      });
  }

  checkInNow(): void {
    if (this.affectedServices.length > 0) {
      this.dialogService
        .confirm({
          title: helptextInterfaces.services_restarted.title,
          message: this.translate.instant(helptextInterfaces.services_restarted.message, {
            uniqueIPs: this.uniqueIps.join(', '),
            affectedServices: this.affectedServices.join(', '),
          }),
          hideCheckbox: true,
          buttonText: helptextInterfaces.services_restarted.button,
        })
        .pipe(filter(Boolean), untilDestroyed(this))
        .subscribe(() => {
          this.finishCheckin();
        });
    } else {
      this.dialogService
        .confirm({
          title: helptextInterfaces.checkin_title,
          message: helptextInterfaces.checkin_message,
          hideCheckbox: true,
          buttonText: helptextInterfaces.checkin_button,
        })
        .pipe(filter(Boolean), untilDestroyed(this))
        .subscribe(() => {
          this.finishCheckin();
        });
    }
  }

  finishCheckin(): void {
    this.ws
      .call('interface.checkin')
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.store$.dispatch(networkInterfacesChanged({ commit: true, checkIn: true }));

        this.snackbar.success(
          this.translate.instant(helptextInterfaces.checkin_complete_message),
        );
        this.hasPendingChanges = false;
        this.checkinWaiting = false;
        clearInterval(this.checkinInterval);
        this.checkinRemaining = null;
        this.cdr.markForCheck();
      });
  }

  rollbackPendingChanges(): void {
    this.dialogService
      .confirm({
        title: helptextInterfaces.rollback_changes_title,
        message: helptextInterfaces.rollback_changes_warning,
        hideCheckbox: false,
        buttonText: helptextInterfaces.rollback_button,
      })
      .pipe(untilDestroyed(this))
      .subscribe((confirm: boolean) => {
        if (!confirm) {
          return;
        }

        this.ws
          .call('interface.rollback')
          .pipe(
            this.loader.withLoader(),
            this.errorHandler.catchError(),
            untilDestroyed(this),
          )
          .subscribe(() => {
            this.store$.dispatch(networkInterfacesChanged({ commit: false }));
            this.interfacesStore.loadInterfaces();
            this.hasPendingChanges = false;
            this.checkinWaiting = false;
            this.snackbar.success(
              this.translate.instant(helptextInterfaces.changes_rolled_back),
            );
            this.cdr.markForCheck();
          });
      });
  }

  goToHa(): void {
    this.router.navigate(['/', 'system', 'failover']);
  }

  private openInterfaceForEditFromRoute(): void {
    const state = this.navigation?.extras?.state as { editInterface: string };
    if (!state?.editInterface) {
      return;
    }

    this.ws.call('interface.query', [[['id', '=', state.editInterface]]])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((interfaces) => {
        if (!interfaces[0]) {
          return;
        }

        const slideInRef = this.slideInService.open(InterfaceFormComponent, { data: interfaces[0] });
        this.handleSlideInClosed(slideInRef);
      });
  }
}
