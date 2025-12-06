import { Component, ChangeDetectionStrategy, computed, input, output, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter,
  forkJoin,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ContainerStatus } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { Container, ContainerStopParams } from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { StopOptionsDialog, StopOptionsOperation } from 'app/pages/containers/components/all-containers/container-list/stop-options-dialog/stop-options-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
  private destroyRef = inject(DestroyRef);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialog = inject(DialogService);
  private matDialog = inject(MatDialog);
  private loader = inject(LoaderService);

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
    const containers = this.stoppedCheckedContainers();
    if (containers.length === 0) {
      return;
    }

    const operations = containers.map((container) => this.start(container.id));
    forkJoin(operations)
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant(this.bulkActionStartedMessage));
        this.resetBulkSelection.emit();
      });
  }

  onBulkStop(): void {
    this.matDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Stop })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((options: ContainerStopParams) => {
          const containers = this.activeCheckedContainers();
          if (containers.length === 0) {
            return of(null);
          }
          const operations = containers.map((container) => this.stop(container.id, options));
          return forkJoin(operations);
        }),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant(this.bulkActionStartedMessage));
        this.resetBulkSelection.emit();
      });
  }

  onBulkRestart(): void {
    this.matDialog
      .open(StopOptionsDialog, { data: StopOptionsOperation.Restart })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((options: ContainerStopParams) => {
          const containers = this.activeCheckedContainers();
          if (containers.length === 0) {
            return of(null);
          }
          const operations = containers.map((container) => this.restart(container.id, options));
          return forkJoin(operations);
        }),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant(this.bulkActionStartedMessage));
        this.resetBulkSelection.emit();
      });
  }

  private start(containerId: number): Observable<void> {
    return this.api.call('container.start', [containerId]);
  }

  private stop(containerId: number, options: ContainerStopParams): Observable<unknown> {
    return this.dialog.jobDialog(
      this.api.job('container.stop', [containerId, options]),
      { title: this.translate.instant('Stopping Container') },
    ).afterClosed();
  }

  private restart(containerId: number, options: ContainerStopParams): Observable<void> {
    return this.dialog.jobDialog(
      this.api.job('container.stop', [containerId, options]),
      { title: this.translate.instant('Stopping Container') },
    )
      .afterClosed()
      .pipe(
        switchMap(() => this.api.call('container.start', [containerId]).pipe(
          this.loader.withLoader(),
        )),
      );
  }
}
