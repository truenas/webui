import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from 'app/modules/entity/utils';
import { CloudsyncRestoreDialogComponent } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './add-spn-dialog.component.html',
  styleUrls: ['./add-spn-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSpnDialogComponent {
  readonly form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<CloudsyncRestoreDialogComponent>,
    private dialogService: DialogService,
    private loader: AppLoaderService,
  ) { }

  onSubmit(): void {
    this.loader.open();

    const payload = {
      username: this.form.value.username,
      password: this.form.value.password,
    };

    this.ws.call('nfs.add_principal', [payload]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.dialogRef.close();
        this.dialogService.info(
          this.translate.instant('Success'),
          this.translate.instant('You have successfully added credentials.'),
        );
      },
      error: (err) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    });
  }
}
