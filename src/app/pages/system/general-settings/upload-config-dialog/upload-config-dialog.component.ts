import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './upload-config-dialog.component.html',
  styleUrls: ['./upload-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadConfigDialogComponent {
  form = this.formBuilder.group({
    config: [null as File[], Validators.required],
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private mdDialog: MatDialog,
    private ws: WebSocketService,
    private appLoader: AppLoaderService,
    private dialogService: DialogService,
  ) {}

  onSubmit(): void {
    const formData: FormData = new FormData();
    const dialogRef = this.mdDialog.open(EntityJobComponent,
      { data: { title: 'Uploading and Applying Config', closeOnClickOutside: false } });
    dialogRef.componentInstance.setDescription('Uploading and Applying Config');
    formData.append('data', JSON.stringify({
      method: 'config.upload',
      params: [],
    }));
    formData.append('file', this.form.value.config[0]);
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close();
      this.router.navigate(['/others/reboot'], { skipLocationChange: true });
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res) => {
      dialogRef.componentInstance.setDescription(res.error);
    });
    this.appLoader.open();
    this.ws.call('auth.generate_token').pipe(untilDestroyed(this)).subscribe({
      next: (token) => {
        this.appLoader.close();
        dialogRef.componentInstance.wspost('/_upload?auth_token=' + token, formData);
      },
      error: (error: WebsocketError) => {
        this.appLoader.close();
        this.dialogService.errorReportMiddleware(error);
      },
    });
  }
}
