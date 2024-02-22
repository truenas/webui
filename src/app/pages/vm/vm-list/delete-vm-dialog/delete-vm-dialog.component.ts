import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextVmList } from 'app/helptext/vm/vm-list';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './delete-vm-dialog.component.html',
  styleUrls: ['./delete-vm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteVmDialogComponent implements OnInit {
  protected readonly requiredRoles = [Role.VmWrite];

  form = this.formBuilder.group({
    zvols: [false],
    force: [false],
    confirmName: [''],
  });

  readonly helptext = helptextVmList;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private dialogRef: MatDialogRef<DeleteVmDialogComponent>,
    private validators: IxValidatorsService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    @Inject(MAT_DIALOG_DATA) public vm: VirtualMachine,
  ) { }

  ngOnInit(): void {
    this.setConfirmationValidator();
  }

  onDelete(): void {
    this.ws.call('vm.delete', [this.vm.id, {
      force: this.form.value.force,
      zvols: this.form.value.zvols,
    }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close(true);
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
