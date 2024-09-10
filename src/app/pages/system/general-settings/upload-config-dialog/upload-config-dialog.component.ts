import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UploadService } from 'app/services/upload.service';

@UntilDestroy()
@Component({
  selector: 'ix-upload-config-dialog',
  templateUrl: './upload-config-dialog.component.html',
  styleUrls: ['./upload-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadConfigDialogComponent {
  readonly requiredRoles = [Role.FullAdmin];

  form = this.formBuilder.group({
    config: [null as File[], Validators.required],
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private upload: UploadService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  onSubmit(): void {
    this.dialogService
      .jobDialog(
        this.upload.uploadAsJob({
          file: this.form.value.config[0],
          method: 'config.upload',
        }),
        { title: this.translate.instant('Uploading and Applying Config') },
      )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.router.navigate(['/system-tasks/reboot'], { skipLocationChange: true });
      });
  }
}
