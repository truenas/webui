import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';
import { filter, last, take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ServiceOperation } from 'app/enums/service-name.enum';
import { ServiceStatus, serviceStatusLabels } from 'app/enums/service-status.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Service } from 'app/interfaces/service.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServiceStopConfirmationService } from 'app/services/service-stop-confirmation.service';
import { ServicesService } from 'app/services/services.service';

@Component({
  selector: 'ix-service-status-cell',
  templateUrl: './service-status-cell.component.html',
  styleUrls: ['./service-status-cell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MapValuePipe,
    TnIconButtonComponent,
    RequiresRolesDirective,
    NgClass,
  ],
})
export class ServiceStatusCellComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private stopConfirmation = inject(ServiceStopConfirmationService);
  private snackbar = inject(SnackbarService);
  private servicesService = inject(ServicesService);
  private destroyRef = inject(DestroyRef);

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

  protected startService(): void {
    this.api.job('service.control', [ServiceOperation.Start, this.service().service, { silent: false }]).pipe(
      observeJob(),
      last(),
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job) => {
      if (job.result === true) {
        this.snackbar.success(this.translate.instant('Service started'));
      }
    });
  }

  protected stopServiceClicked(): void {
    this.stopConfirmation.confirmStop(this.service().service).pipe(
      filter(Boolean),
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.stopService());
  }

  private stopService(): void {
    this.api.job('service.control', [ServiceOperation.Stop, this.service().service, { silent: false }]).pipe(
      observeJob(),
      last(),
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((job) => {
      if (job.result === true) {
        this.snackbar.success(this.translate.instant('Service stopped'));
      }
    });
  }
}
