import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EMPTY, Observable, of } from 'rxjs';
import {
  catchError, filter, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { selectService } from 'app/store/services/services.selectors';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

export interface StorageSettings {
  systemDsPool: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-storage-settings-form',
  templateUrl: './storage-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class StorageSettingsFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.DatasetWrite];

  isFormLoading = false;

  form = this.fb.nonNullable.group({
    pool: ['', Validators.required],
  });

  readonly poolOptions$ = this.api.call('systemdataset.pool_choices').pipe(choicesToOptions());

  private storageSettings: StorageSettings;

  constructor(
    private api: ApiService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    public slideInRef: SlideInRef<StorageSettings, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.storageSettings = this.slideInRef.getData();
  }

  ngOnInit(): void {
    this.loadFormData();
  }

  onSubmit(): void {
    const values = this.form.value;
    const { pool } = values;
    this.confirmSmbRestartIfNeeded().pipe(
      filter(Boolean),
      switchMap(() => {
        this.isFormLoading = true;
        this.cdr.markForCheck();
        return this.api.job('systemdataset.update', [{ pool }])
          .pipe(
            tap((job) => {
              if (job.state !== JobState.Success) {
                return;
              }
              this.isFormLoading = false;
              this.store$.dispatch(advancedConfigUpdated());
              this.cdr.markForCheck();
              this.snackbar.success(this.translate.instant('System dataset updated.'));
              this.slideInRef.close({ response: true, error: null });
            }),
            catchError((error: unknown) => {
              this.isFormLoading = false;
              this.formErrorHandler.handleValidationErrors(error, this.form);
              this.cdr.markForCheck();
              return EMPTY;
            }),
          );
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private loadFormData(): void {
    this.form.patchValue({
      pool: this.storageSettings.systemDsPool,
    });
    this.cdr.markForCheck();
  }

  /**
   * @return boolean True when saving can continue.
   */
  private confirmSmbRestartIfNeeded(): Observable<boolean> {
    this.isFormLoading = true;
    this.cdr.markForCheck();
    return this.store$.select(selectService(ServiceName.Cifs)).pipe(
      switchMap((smbService) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();

        if (smbService.state === ServiceStatus.Running) {
          return this.dialogService.confirm({
            title: this.translate.instant('Restart SMB Service'),
            message: this.translate.instant(
              'The system dataset will be updated and the SMB service restarted. This will cause a temporary disruption of any active SMB connections.',
            ),
            hideCheckbox: false,
            buttonText: this.translate.instant('Continue'),
          });
        }

        return of(true);
      }),
    );
  }
}
