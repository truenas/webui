import {
  Component, ChangeDetectionStrategy, Input, EventEmitter, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { YesNoPipe } from 'app/core/pipes/yes-no.pipe';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { WebSocketErrorName } from 'app/enums/websocket-error-name.enum';
import { helptextVmList } from 'app/helptext/vm/vm-list';
import { ApiCallParams } from 'app/interfaces/api/api-call-directory.interface';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { CloneVmDialogComponent } from 'app/pages/vm/vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { DeleteVmDialogComponent } from 'app/pages/vm/vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { StopVmDialogComponent } from 'app/pages/vm/vm-list/stop-vm-dialog/stop-vm-dialog.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { UrlOptionsService } from 'app/services/url-options.service';
import { VmService } from 'app/services/vm.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-vm-details-row',
  templateUrl: './vm-details-row.component.html',
  styleUrls: ['./vm-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualMachineDetailsRowComponent {
  @Input() vm: VirtualMachine;
  @Output() refresh = new EventEmitter<void>();

  protected wsMethods = {
    start: 'vm.start',
    restart: 'vm.restart',
    stop: 'vm.stop',
    poweroff: 'vm.poweroff',
    update: 'vm.update',
    clone: 'vm.clone',
  } as const;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private matDialog: MatDialog,
    private yesNoPipe: YesNoPipe,
    private urlOptions: UrlOptionsService,
    private router: Router,
    private dialogService: DialogService,
    private storageService: StorageService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private vmService: VmService,
  ) {}

  protected checkMemory(): void {
    // emit memory check
  }

  protected doStart(): void {
    this.toggleVmStatus(this.vm);
  }

  protected doStop(): void {
    this.openStopDialog(this.vm);
  }

  protected doRestart(): void {
    this.ws.startJob(this.wsMethods.restart, [this.vm.id])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        complete: () => this.checkMemory(),
        error: (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }

  protected doPowerOff(): void {
    this.doRowAction(this.vm, this.wsMethods.poweroff, [this.vm.id]);
  }

  protected openDisplay(): void {
    this.ws.call('vm.get_display_devices', [this.vm.id])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: () => {
          this.vmService.openDisplayWebUri(this.vm.id);
        },
        error: (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }

  protected openDevices(): void {
    this.router.navigate(['/', 'vm', String(this.vm.id), 'devices']);
  }

  protected openSerialShell(): void {
    this.router.navigate(['/vm', 'serial', String(this.vm.id)]);
  }

  protected doEdit(): void {
    const slideInRef = this.slideInService.open(VmEditFormComponent, { data: this.vm });
    slideInRef.slideInClosed$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => this.refresh.emit());
  }

  protected doDelete(): void {
    this.matDialog.open(DeleteVmDialogComponent, { data: this.vm })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.refresh.emit());
  }

  protected doClone(): void {
    this.matDialog.open(CloneVmDialogComponent, { data: this.vm })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.refresh.emit());
  }

  protected downloadLogs(): void {
    const path = `/var/log/libvirt/qemu/${this.vm.id}_${this.vm.name}.log`;
    const filename = `${this.vm.id}_${this.vm.name}.log`;
    this.ws.call('core.download', ['filesystem.get', [path], filename]).pipe(
      switchMap(([, url]) => this.storageService.downloadUrl(url, filename, 'text/plain')),
      untilDestroyed(this),
    ).subscribe({
      error: (error: unknown) => this.errorHandler.showErrorModal(error),
    });
  }

  private doRowAction<T extends 'vm.start' | 'vm.update' | 'vm.poweroff'>(
    row: VirtualMachine,
    method: T,
    params: ApiCallParams<T> = [row.id],
  ): void {
    this.ws.call(method, params)
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: () => this.checkMemory(),
        error: (error: WebSocketError) => {
          if (method === this.wsMethods.start
            && error.errname === WebSocketErrorName.NoMemory) {
            // this.onMemoryError(row);
            return;
          }
          if (method === this.wsMethods.update) {
            row.autostart = !row.autostart;
          }
          this.dialogService.error(this.errorHandler.parseError(error));
        },
      });
  }

  private toggleVmStatus(row: VirtualMachine): void {
    if (row.status.state === ServiceStatus.Running) {
      this.openStopDialog(row);
    } else {
      this.doRowAction(row, this.wsMethods.start);
    }
  }

  private openStopDialog(vm: VirtualMachine): void {
    this.matDialog.open(StopVmDialogComponent, {
      data: vm,
    })
      .afterClosed()
      .pipe(
        filter((data: { wasStopped: boolean; forceAfterTimeout: boolean }) => data?.wasStopped),
        untilDestroyed(this),
      )
      .subscribe((data: { forceAfterTimeout: boolean }) => {
        this.stopVm(vm, data.forceAfterTimeout);
        this.checkMemory();
      });
  }

  stopVm(vm: VirtualMachine, forceAfterTimeout: boolean): void {
    const jobDialogRef = this.matDialog.open(
      EntityJobComponent,
      {
        data: {
          title: this.translate.instant('Stopping {rowName}', { rowName: vm.name }),
        },
      },
    );
    jobDialogRef.componentInstance.setCall('vm.stop', [vm.id, {
      force: false,
      force_after_timeout: forceAfterTimeout,
    }]);
    jobDialogRef.componentInstance.submit();
    jobDialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      jobDialogRef.close(false);
      this.dialogService.info(
        this.translate.instant('Finished'),
        this.translate.instant(helptextVmList.stop_dialog.successMessage, { vmName: vm.name }),
        true,
      );
    });
  }

  private onMemoryError(): void {
    this.dialogService.confirm({
      title: helptextVmList.memory_dialog.title,
      message: helptextVmList.memory_dialog.message,
      confirmationCheckboxText: helptextVmList.memory_dialog.secondaryCheckboxMessage,
      buttonText: helptextVmList.memory_dialog.buttonMessage,
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.doRowAction(this.vm, this.wsMethods.start, [this.vm.id, { overcommit: true }]);
      });
  }
}
