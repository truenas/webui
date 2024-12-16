import {
  ChangeDetectionStrategy, Component, computed, inject,
} from '@angular/core';
import { MatSlideToggle, MatSlideToggleChange } from '@angular/material/slide-toggle';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { ServiceRow } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { convertStringToId } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { ServicesService } from 'app/services/services.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-state-column',
  templateUrl: './service-state-column.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RequiresRolesDirective,
    MatSlideToggle,
    TestDirective,
    TranslateModule,
  ],
})
export class ServiceStateColumnComponent extends ColumnComponent<ServiceRow> {
  protected service = computed(() => this.row());

  protected readonly requiredRoles = computed(() => {
    return this.servicesService.getRolesRequiredToManage(this.service().service);
  });

  protected readonly isRunning = computed(() => this.service().state === ServiceStatus.Running);

  protected testIdServiceName = computed(() => {
    return convertStringToId(this.service().name).replace(/\./g, '');
  });

  private servicesService = inject(ServicesService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private loader = inject(AppLoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private iscsiService = inject(IscsiService);

  private serviceName = computed(() => {
    return serviceNames.has(this.service().service)
      ? serviceNames.get(this.service().service)
      : this.service().service;
  });

  protected onSlideToggleChanged(event: MatSlideToggleChange): void {
    const toggle = event.source;

    if (this.isRunning()) {
      this.confirmStop().pipe(
        tap((confirmed) => {
          if (!confirmed) {
            toggle.checked = true;
          }
        }),
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => {
        this.stopService(toggle);
      });
    } else {
      this.startService(toggle);
    }
  }

  private confirmStop(): Observable<boolean> {
    if (this.service().service === ServiceName.Iscsi) {
      return this.confirmStopIscsiService();
    }

    const serviceName = this.serviceName();
    return this.dialogService.confirm({
      title: this.translate.instant('Alert'),
      message: this.translate.instant('Stop {serviceName}?', { serviceName }),
      hideCheckbox: true,
      buttonText: this.translate.instant('Stop'),
    });
  }

  private stopService(toggle: MatSlideToggle): void {
    this.api.call('service.stop', [this.service().service, { silent: false }]).pipe(
      this.loader.withLoader(),
      untilDestroyed(this),
    ).subscribe({
      next: () => this.snackbar.success(this.translate.instant('Service stopped')),
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        toggle.checked = true;
      },
    });
  }

  private startService(toggle: MatSlideToggle): void {
    this.api.call('service.start', [this.service().service, { silent: false }]).pipe(
      this.loader.withLoader(),
      untilDestroyed(this),
    ).subscribe({
      next: () => this.snackbar.success(this.translate.instant('Service started')),
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        toggle.checked = false;
      },
    });
  }

  private confirmStopIscsiService(): Observable<boolean> {
    const serviceName = this.serviceName();

    return this.iscsiService.getGlobalSessions().pipe(
      switchMap((sessions) => {
        let message = this.translate.instant('Stop {serviceName}?', { serviceName });
        if (sessions.length) {
          const connectionsMessage = this.translate.instant('{n, plural, one {There is an active iSCSI connection.} other {There are # active iSCSI connections}}', { n: sessions.length });
          const stopMessage = this.translate.instant('Stop the {serviceName} service and close these connections?', { serviceName });
          message = `<font color="red">${connectionsMessage}</font><br>${stopMessage}`;
        }

        return this.dialogService.confirm({
          title: this.translate.instant('Alert'),
          message,
          hideCheckbox: true,
          buttonText: this.translate.instant('Stop'),
        });
      }),
      untilDestroyed(this),
    );
  }
}
