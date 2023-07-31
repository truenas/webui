import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VirtualMachine, VmCloneParams } from 'app/interfaces/virtual-machine.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './clone-vm-dialog.component.html',
  styleUrls: ['./clone-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloneVmDialogComponent {
  nameControl = new FormControl('');

  constructor(
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    @Inject(MAT_DIALOG_DATA) public vm: VirtualMachine,
    private dialogRef: MatDialogRef<CloneVmDialogComponent>,
    private dialogService: DialogService,
  ) { }

  onClone(): void {
    this.loader.open();
    const params = [this.vm.id] as VmCloneParams;
    if (this.nameControl.value) {
      params.push(this.nameControl.value);
    }

    this.ws.call('vm.clone', params)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close(true);
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
