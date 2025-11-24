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
import { ContainerStatus } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import {
  ContainerInstance,
  ContainerStopParams,
  ContainerInstanceMetrics,
} from 'app/interfaces/container.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerStatusCellComponent } from 'app/pages/containers/components/all-containers/container-list/container-row/container-status-cell/container-status-cell.component';
import {
  StopOptionsDialog, StopOptionsOperation,
} from 'app/pages/containers/components/all-containers/container-list/stop-options-dialog/stop-options-dialog.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-container-row',
  templateUrl: './container-row.component.html',
  styleUrls: ['./container-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    TestDirective,
    TranslateModule,
    MatTooltipModule,
    MatButtonModule,
    MatCheckboxModule,
    RequiresRolesDirective,
    ContainerStatusCellComponent,
    YesNoPipe,
  ],
})
export class ContainerRowComponent {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private matDialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private containersStore = inject(ContainersStore);

  protected readonly requiredRoles = [Role.ContainerWrite];
  readonly container = input.required<ContainerInstance>();
  readonly metrics = input<ContainerInstanceMetrics | undefined>();
  readonly selected = input<boolean>(false);
  protected readonly isStopped = computed(() => this.container()?.status?.state === ContainerStatus.Stopped);

  readonly hasMetrics = computed(() => {
    const metrics = this.metrics();

    return this.container()?.status?.state === ContainerStatus.Running
      && metrics
      && Object.keys(metrics).length > 0;
  });

  readonly selectionChange = output();

  start(): void {
    const containerId = this.container().id;

    this.api.call('container.start', [containerId])
      .pipe(this.errorHandler.withErrorHandler(), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container started'));
        this.containersStore.selectContainer(this.container().id);
      });
  }

  stop(): void {
    const containerId = this.container().id;

    this.matDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Stop })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((options: ContainerStopParams) => {
          return this.api.call('container.stop', [containerId, options])
            .pipe(this.errorHandler.withErrorHandler());
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container stopped'));
        this.containersStore.selectContainer(this.container().id);
      });
  }

  restart(): void {
    const containerId = this.container().id;

    this.matDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Restart })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((options: ContainerStopParams) => {
          return this.api.call('container.stop', [containerId, options])
            .pipe(
              switchMap(() => this.api.call('container.start', [containerId])),
              this.errorHandler.withErrorHandler(),
            );
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Container restarted'));
        this.containersStore.selectContainer(this.container().id);
      });
  }
}
