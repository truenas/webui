import { Component, ChangeDetectionStrategy, computed, input, output, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter,
  switchMap,
  tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ContainerStatus } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { Container, ContainerStopParams } from 'app/interfaces/container.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { StopOptionsDialog, StopOptionsOperation } from 'app/pages/containers/components/all-containers/container-list/stop-options-dialog/stop-options-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-container-list-bulk-actions',
  templateUrl: './container-list-bulk-actions.component.html',
  styleUrls: ['./container-list-bulk-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    IxIconComponent,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
})

export class ContainerListBulkActionsComponent {
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private matDialog = inject(MatDialog);

  readonly checkedContainers = input.required<Container[]>();
  readonly resetBulkSelection = output();

  protected readonly requiredRoles = [Role.ContainerWrite];

  readonly bulkActionStartedMessage = this.translate.instant('Requested action performed for selected Containers');

  protected readonly isBulkStartDisabled = computed(() => {
    return this.checkedContainers().every(
      (container) => [ContainerStatus.Running].includes(container.status?.state),
    );
  });

  protected readonly isBulkStopDisabled = computed(() => {
    return this.checkedContainers().every(
      (container) => [ContainerStatus.Stopped].includes(container.status?.state),
    );
  });

  protected readonly activeCheckedContainers = computed(() => {
    return this.checkedContainers().filter(
      (container) => [ContainerStatus.Running].includes(container.status?.state),
    );
  });

  protected readonly stoppedCheckedContainers = computed(() => {
    return this.checkedContainers().filter(
      (container) => [ContainerStatus.Stopped].includes(container.status?.state),
    );
  });

  onBulkStart(): void {
    this.stoppedCheckedContainers().forEach((container) => this.start(container.id));
    this.resetBulkSelection.emit();
    this.snackbar.success(this.translate.instant(this.bulkActionStartedMessage));
  }

  onBulkStop(): void {
    this.matDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Stop })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap((options: ContainerStopParams) => {
          this.activeCheckedContainers().forEach((container) => this.stop(container.id, options));
          this.snackbar.success(this.translate.instant(this.bulkActionStartedMessage));
          this.resetBulkSelection.emit();
        }),
        untilDestroyed(this),
      ).subscribe();
  }

  onBulkRestart(): void {
    this.matDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Restart })
      .afterClosed()
      .pipe(
        filter(Boolean),
        tap((options: ContainerStopParams) => {
          this.activeCheckedContainers().forEach((container) => this.restart(container.id, options));
          this.snackbar.success(this.translate.instant(this.bulkActionStartedMessage));
          this.resetBulkSelection.emit();
        }),
        untilDestroyed(this),
      ).subscribe();
  }

  private start(containerId: number): void {
    this.api.call('container.start', [containerId])
      .pipe(this.errorHandler.withErrorHandler(), untilDestroyed(this))
      .subscribe();
  }

  private stop(containerId: number, options: ContainerStopParams): void {
    this.api.call('container.stop', [containerId, options])
      .pipe(this.errorHandler.withErrorHandler(), untilDestroyed(this))
      .subscribe();
  }

  private restart(containerId: number, options: ContainerStopParams): void {
    this.api.call('container.stop', [containerId, options])
      .pipe(
        switchMap(() => this.api.call('container.start', [containerId])),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
