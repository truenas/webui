import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, Observable, switchMap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ServiceName, serviceNames, ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus, serviceStatusLabels } from 'app/enums/service-status.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Service } from 'app/interfaces/service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { ServicesService } from 'app/services/services.service';

@Component({
  selector: 'ix-service-status-cell',
  templateUrl: './service-status-cell.component.html',
  styleUrls: ['./service-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MapValuePipe,
    TestDirective,
    IxIconComponent,
    RequiresRolesDirective,
    MatIconButton,
    NgClass,
  ],
})
@UntilDestroy()
export class ServiceStatusCellComponent {
  readonly service = input.required<Service>();

  protected readonly requiredRoles = computed(() => {
    return this.servicesService.getRolesRequiredToManage(this.service().service);
  });

  protected isRunning = computed(() => {
    return this.service().state === ServiceStatus.Running;
  });

  protected uniqueRowTag = computed(() => {
    return 'service-' + this.service().service.replace(/\./g, '');
  });

  protected status = computed(() => this.service().state);

  protected statusLabels = serviceStatusLabels;

  constructor(
    private api: ApiService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: LoaderService,
    private errorHandler: ErrorHandlerService,
    private iscsiService: IscsiService,
    private snackbar: SnackbarService,
    private servicesService: ServicesService,
  ) {}

  protected startService(): void {
    this.api.job('service.control', [ServiceOperation.Start, this.service().service, { silent: false }]).pipe(
      observeJob(),
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe({
      complete: () => this.snackbar.success(this.translate.instant('Service started')),
    });
  }

  protected stopServiceClicked(): void {
    this.confirmStop().pipe(
      filter(Boolean),
      take(1),
      untilDestroyed(this),
    ).subscribe(() => this.stopService());
  }

  private stopService(): void {
    this.api.job('service.control', [ServiceOperation.Stop, this.service().service]).pipe(
      observeJob(),
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe({
      complete: () => this.snackbar.success(this.translate.instant('Service stopped')),
    });
  }

  private confirmStop(): Observable<boolean> {
    if (this.service().service === ServiceName.Iscsi) {
      return this.confirmStopIscsiService();
    }

    return this.dialogService.confirm({
      message: this.translate.instant('Are you sure you want to stop {serviceName}?', {
        serviceName: serviceNames.get(this.service().service),
      }),
      hideCheckbox: true,
      buttonColor: 'warn',
      buttonText: this.translate.instant('Stop'),
    });
  }

  private confirmStopIscsiService(): Observable<boolean> {
    return this.iscsiService.getGlobalSessions().pipe(
      switchMap((sessions) => {
        let message = this.translate.instant('Stop {serviceName}?', { serviceName: serviceNames.get(this.service().service) });
        if (sessions.length) {
          const connectionsMessage = this.translate.instant('{n, plural, one {There is an active iSCSI connection.} other {There are # active iSCSI connections}}', {
            n: sessions.length,
          });
          const stopMessage = this.translate.instant('Stop the {serviceName} service and close these connections?', {
            serviceName: serviceNames.get(this.service().service),
          });
          message = `<font color="red">${connectionsMessage}</font><br>${stopMessage}` as TranslatedString;
        }

        return this.dialogService.confirm({
          message,
          hideCheckbox: true,
          buttonColor: 'warn',
          buttonText: this.translate.instant('Stop'),
        });
      }),
      untilDestroyed(this),
    );
  }
}
