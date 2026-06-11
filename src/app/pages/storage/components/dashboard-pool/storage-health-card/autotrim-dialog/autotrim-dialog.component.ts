import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnDialogShellComponent, TnFormFieldComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { OnOff } from 'app/enums/on-off.enum';
import { Role } from 'app/enums/role.enum';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { Pool } from 'app/interfaces/pool.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-autotrim-dialog',
  templateUrl: './autotrim-dialog.component.html',
  styleUrls: ['./autotrim-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    ReactiveFormsModule,
    TnCheckboxComponent,
    TnFormFieldComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class AutotrimDialog implements OnInit {
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  protected dialogRef = inject<DialogRef<unknown, AutotrimDialog>>(DialogRef);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  pool = inject<Pool>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.PoolWrite];

  autotrimControl = new FormControl(false);

  readonly helptext = helptextVolumes;

  ngOnInit(): void {
    this.autotrimControl.setValue(this.pool.autotrim.value === 'on');
  }

  onSubmit(event?: SubmitEvent): void {
    event?.preventDefault();
    this.api.job('pool.update', [this.pool.id, { autotrim: this.autotrimControl.value ? OnOff.On : OnOff.Off }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
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
