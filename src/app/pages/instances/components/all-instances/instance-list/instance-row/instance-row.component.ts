import {
  Component, ChangeDetectionStrategy, input, computed, output,
} from '@angular/core';
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
import { VirtualizationStatus, virtualizationTypeLabels } from 'app/enums/virtualization.enum';
import { VirtualizationInstance, VirtualizationStopParams } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceStatusCellComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-row/instance-status-cell/instance-status-cell.component';
import {
  StopOptionsDialogComponent, StopOptionsOperation,
} from 'app/pages/instances/components/all-instances/instance-list/stop-options-dialog/stop-options-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-row',
  templateUrl: './instance-row.component.html',
  styleUrls: ['./instance-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    TestDirective,
    TranslateModule,
    MatTooltipModule,
    MatButtonModule,
    MatCheckboxModule,
    RequiresRolesDirective,
    MapValuePipe,
    InstanceStatusCellComponent,
  ],
})
export class InstanceRowComponent {
  protected readonly requiredRoles = [Role.VirtInstanceWrite];
  readonly instance = input.required<VirtualizationInstance>();
  readonly selected = input<boolean>(false);
  protected readonly isStopped = computed(() => this.instance().status === VirtualizationStatus.Stopped);

  readonly selectionChange = output();

  protected readonly typeLabels = virtualizationTypeLabels;

  constructor(
    private dialog: DialogService,
    private translate: TranslateService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private snackbar: SnackbarService,
  ) {}

  start(): void {
    const instanceId = this.instance().id;

    this.dialog.jobDialog(
      this.api.job('virt.instance.start', [instanceId]),
      { title: this.translate.instant('Starting...') },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Instance started'));
      });
  }

  stop(): void {
    const instanceId = this.instance().id;

    this.matDialog
      .open(StopOptionsDialogComponent, { data: StopOptionsOperation.Stop })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((options: VirtualizationStopParams) => {
          return this.dialog.jobDialog(
            this.api.job('virt.instance.stop', [instanceId, options]),
            { title: this.translate.instant('Stopping...') },
          )
            .afterClosed()
            .pipe(this.errorHandler.catchError());
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Instance stopped'));
      });
  }

  restart(): void {
    const instanceId = this.instance().id;

    this.matDialog
      .open(StopOptionsDialogComponent, { data: StopOptionsOperation.Restart })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap((options: VirtualizationStopParams) => {
          return this.dialog.jobDialog(
            this.api.job('virt.instance.restart', [instanceId, options]),
            { title: this.translate.instant('Restarting...') },
          )
            .afterClosed()
            .pipe(this.errorHandler.catchError());
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Instance restarted'));
      });
  }
}
