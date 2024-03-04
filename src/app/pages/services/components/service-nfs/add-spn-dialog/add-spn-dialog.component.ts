import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { CloudSyncRestoreDialogComponent } from 'app/pages/data-protection/cloudsync/cloudsync-restore-dialog/cloudsync-restore-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './add-spn-dialog.component.html',
  styleUrls: ['./add-spn-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSpnDialogComponent {
  readonly requiredRoles = [Role.FullAdmin];

  readonly form = this.formBuilder.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<CloudSyncRestoreDialogComponent>,
    private dialogService: DialogService,
    private loader: AppLoaderService,
  ) { }

  onSubmit(): void {
    const payload = {
      username: this.form.value.username,
      password: this.form.value.password,
    };

    this.ws.call('nfs.add_principal', [payload])
      .pipe(
        this.errorHandler.catchError(),
        this.loader.withLoader(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogRef.close();
        this.dialogService.info(
          this.translate.instant('Success'),
          this.translate.instant('You have successfully added credentials.'),
        );
      });
  }
}
