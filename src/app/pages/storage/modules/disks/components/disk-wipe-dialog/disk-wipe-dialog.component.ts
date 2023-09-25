import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DiskWipeMethod } from 'app/enums/disk-wipe-method.enum';
import helptext from 'app/helptext/storage/disks/disks';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  templateUrl: './disk-wipe-dialog.component.html',
  styleUrls: ['./disk-wipe-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskWipeDialogComponent {
  form = this.formBuilder.group({
    wipe_method: [DiskWipeMethod.Quick, [Validators.required]],
  });

  readonly tooltips = {
    wipe_method: helptext.dw_wipe_method_tooltip,
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

  constructor(
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
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
    const jobDialogRef = this.matDialog.open(EntityJobComponent, {
      data: {
        title: this.title,
      },
    });
    const jobComponent = jobDialogRef.componentInstance;
    jobComponent.setDescription(helptext.diskWipeDialogForm.startDescription);
    jobComponent.setCall(
      'disk.wipe',
      [this.data.diskName, this.form.value.wipe_method],
    );
    jobComponent.success.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        jobDialogRef.close();
        this.dialogRef.close();
        this.dialogService.generalDialog({
          title: this.title,
          message: helptext.diskWipeDialogForm.infoContent,
          hideCancel: true,
        });
      },
    });

    jobComponent.submit();
  }
}
