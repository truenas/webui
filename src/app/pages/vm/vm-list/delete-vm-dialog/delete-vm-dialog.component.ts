import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/vm/vm-list';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { VirtualMachineRow } from 'app/pages/vm/vm-list/virtual-machine-row.interface';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  templateUrl: './delete-vm-dialog.component.html',
  styleUrls: ['./delete-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteVmDialogComponent implements OnInit {
  form = this.formBuilder.group({
    zvols: [false],
    force: [false],
    confirmName: [''],
  });

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DeleteVmDialogComponent>,
    private validators: IxValidatorsService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) public vm: VirtualMachineRow,
  ) { }

  ngOnInit(): void {
    this.setConfirmationValidator();
  }

  onDelete(): void {
    this.loader.open();

    this.ws.call('vm.delete', [this.vm.id, {
      force: this.form.value.force,
      zvols: this.form.value.zvols,
    }])
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

  private setConfirmationValidator(): void {
    const validator = this.validators.confirmValidator(
      this.vm.name,
      this.translate.instant('Enter vm name to continue.'),
    );
    this.form.controls.confirmName.setValidators(validator);
  }
}
