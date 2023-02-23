import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/vm/vm-list';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { VmListComponent } from 'app/pages/vm/vm-list/vm-list.component';
import { DialogService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './stop-vm-dialog.component.html',
  styleUrls: ['./stop-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopVmDialogComponent {
  forceAfterTimeoutCheckbox = new FormControl(false);

  readonly helptext = helptext;

  constructor(
    private dialogRef: MatDialogRef<StopVmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { vm: VirtualMachine; parent: VmListComponent },
    private dialog: MatDialog,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) { }

  onStop(): void {
    const jobDialogRef = this.dialog.open(
      EntityJobComponent,
      {
        data: {
          title: this.translate.instant('Stopping {rowName}', { rowName: this.data.vm.name }),
        },
      },
    );
    jobDialogRef.componentInstance.setCall('vm.stop', [this.data.vm.id, {
      force: false,
      force_after_timeout: this.forceAfterTimeoutCheckbox.value,
    }]);
    jobDialogRef.componentInstance.submit();
    jobDialogRef.componentInstance.success.pipe(untilDestroyed(this.data.parent)).subscribe(() => {
      jobDialogRef.close(false);
      this.dialogService.info(
        this.translate.instant('Finished'),
        this.translate.instant(helptext.stop_dialog.successMessage, { vmName: this.data.vm.name }),
        true,
      );
    });
    this.dialogRef.close(true);
  }
}
