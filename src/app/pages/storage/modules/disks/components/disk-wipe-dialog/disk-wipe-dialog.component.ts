import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DiskWipeMethod } from 'app/enums/disk-wipe-method.enum';
import { Role } from 'app/enums/role.enum';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-disk-wipe-dialog',
  templateUrl: './disk-wipe-dialog.component.html',
  styleUrls: ['./disk-wipe-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    WarningComponent,
    ReactiveFormsModule,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class DiskWipeDialogComponent {
  form = this.formBuilder.group({
    wipe_method: [DiskWipeMethod.Quick, [Validators.required]],
  });

  readonly tooltips = {
    wipe_method: helptextDisks.dw_wipe_method_tooltip,
  };

  readonly wipeMethods$ = of([
    {
      label: this.translate.instant('Quick'),
      value: DiskWipeMethod.Quick,
    }, {
      label: this.translate.instant('Full with zeros'),
      value: DiskWipeMethod.Full,
    }, {
      label: this.translate.instant('Full with random data'),
      value: DiskWipeMethod.FullRandom,
    },
  ]);

  protected readonly Role = Role;

  constructor(
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogRef: MatDialogRef<DiskWipeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { diskName: string; exportedPool: string },
  ) { }

  get title(): string {
    return this.translate.instant('Wipe Disk {name}', { name: this.data.diskName });
  }

  onSubmit(): void {
    this.dialogService.confirm({
      title: this.title,
      message: 'Wipe this disk?',
    })
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => this.wipeDisk());
  }

  private wipeDisk(): void {
    this.dialogService.jobDialog(
      this.ws.job('disk.wipe', [this.data.diskName, this.form.value.wipe_method]),
      {
        canMinimize: true,
        description: this.translate.instant('Wiping disk...'),
      },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogService.generalDialog({
          title: this.title,
          message: helptextDisks.diskWipeDialogForm.infoContent,
          hideCancel: true,
        });
        this.dialogRef.close(true);
      });
  }
}
