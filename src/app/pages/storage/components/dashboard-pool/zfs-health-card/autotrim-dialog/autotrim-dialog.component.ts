import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle, MatDialogClose,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { OnOff } from 'app/enums/on-off.enum';
import { Role } from 'app/enums/role.enum';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { Pool } from 'app/interfaces/pool.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-autotrim-dialog',
  templateUrl: './autotrim-dialog.component.html',
  styleUrls: ['./autotrim-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class AutotrimDialogComponent implements OnInit {
  protected readonly requiredRoles = [Role.PoolWrite];

  autotrimControl = new FormControl(false);

  readonly helptext = helptextVolumes;

  constructor(
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private dialogRef: MatDialogRef<AutotrimDialogComponent>,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public pool: Pool,
  ) { }

  ngOnInit(): void {
    this.autotrimControl.setValue(this.pool.autotrim.value === 'on');
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.api.job('pool.update', [this.pool.id, { autotrim: this.autotrimControl.value ? OnOff.On : OnOff.Off }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => {
          this.snackbar.success(
            this.translate.instant('Pool options for {poolName} successfully saved.', { poolName: this.pool.name }),
          );
          this.dialogRef.close(true);
        },
      });
  }
}
