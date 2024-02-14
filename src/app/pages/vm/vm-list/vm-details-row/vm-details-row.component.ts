import {
  Component, ChangeDetectionStrategy, Input, EventEmitter, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs';
import { VmState } from 'app/enums/vm.enum';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { CloneVmDialogComponent } from 'app/pages/vm/vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { DeleteVmDialogComponent } from 'app/pages/vm/vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { VmService } from 'app/services/vm.service';

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

  get isRunning(): boolean {
    return this.vm.status.state === VmState.Running;
  }

  get showDisplayButton(): boolean {
    return !this.isRunning || !this.vm.display_available;
  }

  constructor(
    private slideInService: IxSlideInService,
    private matDialog: MatDialog,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private vmService: VmService,
  ) {}

  protected doStart(): void {
    this.vmService.doStart(this.vm);
  }

  protected doStop(): void {
    this.vmService.doStop(this.vm);
  }

  protected doRestart(): void {
    this.vmService
      .doRestart(this.vm)
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => this.vmService.checkMemory(),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
  }

  protected doPowerOff(): void {
    this.vmService.doPowerOff(this.vm);
  }

  protected openDisplay(): void {
    this.vmService.openDisplay(this.vm);
  }

  protected openDevices(): void {
    this.router.navigate(['/vm', String(this.vm.id), 'devices']);
  }

  protected openSerialShell(): void {
    this.router.navigate(['/vm', 'serial', String(this.vm.id)]);
  }

  protected doEdit(): void {
    this.slideInService
      .open(VmEditFormComponent, { data: this.vm })
      .slideInClosed$.pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.refresh.emit());
  }

  protected doDelete(): void {
    this.matDialog
      .open(DeleteVmDialogComponent, { data: this.vm })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe(() => this.refresh.emit());
  }

  protected doClone(): void {
    this.matDialog
      .open(CloneVmDialogComponent, { data: this.vm })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.refresh.emit());
  }

  protected downloadLogs(): void {
    this.vmService
      .downloadLogs(this.vm)
      .pipe(untilDestroyed(this))
      .subscribe({
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
  }
}
