import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
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
  private apiEndPoint: string;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private matDialog: MatDialog,
    private authService: AuthService,
    private translate: TranslateService,
  ) {
    this.authService.authToken$.pipe(
      tap((token) => {
        this.apiEndPoint = '/_upload?auth_token=' + token;
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onSubmit(): void {
    const formData: FormData = new FormData();
    const dialogRef = this.matDialog.open(
      EntityJobComponent,
      { data: { title: this.translate.instant('Uploading and Applying Config'), closeOnClickOutside: false } },
    );
    dialogRef.componentInstance.setDescription(this.translate.instant('Uploading and Applying Config'));
    formData.append('data', JSON.stringify({
      method: 'config.upload',
      params: [],
    }));
    formData.append('file', this.form.value.config[0]);
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.router.navigate(['/others/reboot'], { skipLocationChange: true });
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((job) => {
      dialogRef.componentInstance.setDescription(job.error);
    });
    dialogRef.componentInstance.wspost(this.apiEndPoint, formData);
  }
}
