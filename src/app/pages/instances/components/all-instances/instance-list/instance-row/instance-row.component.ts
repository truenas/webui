import { Component, ChangeDetectionStrategy, input, computed, output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import {
  ContainerInstance,
  VirtualizationStopParams,
  ContainerInstanceMetrics,
} from 'app/interfaces/container.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceStatusCellComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-row/instance-status-cell/instance-status-cell.component';
import {
  StopOptionsDialog, StopOptionsOperation,
} from 'app/pages/instances/components/all-instances/instance-list/stop-options-dialog/stop-options-dialog.component';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-row',
  templateUrl: './instance-row.component.html',
  styleUrls: ['./instance-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    TestDirective,
    TranslateModule,
    MatTooltipModule,
    MatButtonModule,
    MatCheckboxModule,
    RequiresRolesDirective,
    InstanceStatusCellComponent,
    YesNoPipe,
  ],
})
export class InstanceRowComponent {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private matDialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private instancesStore = inject(VirtualizationInstancesStore);

  protected readonly requiredRoles = [Role.ContainerWrite];
  readonly instance = input.required<ContainerInstance>();
  readonly metrics = input<ContainerInstanceMetrics | undefined>();
  readonly selected = input<boolean>(false);
  protected readonly isStopped = computed(() => this.instance()?.status?.state === VirtualizationStatus.Stopped);

  readonly hasMetrics = computed(() => {
    const metrics = this.metrics();

    return this.instance()?.status?.state === VirtualizationStatus.Running
      && metrics
      && Object.keys(metrics).length > 0;
  });

  readonly selectionChange = output();

  start(): void {
    const instanceId = this.instance().id;

    this.api.call('container.start', [instanceId])
      .pipe(this.errorHandler.withErrorHandler(), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container started'));
        this.instancesStore.selectInstance(this.instance().id);
      });
  }

  stop(): void {
    const instanceId = this.instance().id;

    this.matDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Stop })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((options: VirtualizationStopParams) => {
          return this.api.call('container.stop', [instanceId, options])
            .pipe(this.errorHandler.withErrorHandler());
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container stopped'));
        this.instancesStore.selectInstance(this.instance().id);
      });
  }

  restart(): void {
    const instanceId = this.instance().id;

    this.matDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Restart })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((options: VirtualizationStopParams) => {
          return this.api.call('container.stop', [instanceId, options])
            .pipe(
              switchMap(() => this.api.call('container.start', [instanceId])),
              this.errorHandler.withErrorHandler(),
            );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container restarted'));
        this.instancesStore.selectInstance(this.instance().id);
      });
  }
}
