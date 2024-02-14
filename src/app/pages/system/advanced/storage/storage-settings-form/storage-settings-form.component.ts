import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, EMPTY, Observable, of,
} from 'rxjs';
import {
  catchError, filter, switchMap, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { CHAINED_COMPONENT_REF, SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ChainedComponentRef } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectService } from 'app/store/services/services.selectors';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  templateUrl: './storage-settings-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorageSettingsFormComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    pool: ['', Validators.required],
    swapondrive: [null as number, [
      Validators.required,
      this.ixValidator.withMessage(Validators.min(0), this.translate.instant('Minimum value is 0')),
      this.ixValidator.withMessage(Validators.pattern('^[0-9]*$'), this.translate.instant('Only integers allowed')),
    ]],
  });
  protected readonly Role = Role;
  readonly poolOptions$ = this.ws.call('systemdataset.pool_choices').pipe(choicesToOptions());

  constructor(
    private ws: WebSocketService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private ixValidator: IxValidatorsService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
    @Inject(SLIDE_IN_DATA) private storageSettings: { systemDsPool: string; swapSize: number },
    @Inject(CHAINED_COMPONENT_REF) private chainedRef: ChainedComponentRef,
  ) {}

  ngOnInit(): void {
    this.loadFormData();
  }

  onSubmit(): void {
    const values = this.form.value;
    const { pool } = values;
    const { swapondrive } = values;
    this.confirmSmbRestartIfNeeded().pipe(
      filter(Boolean),
      switchMap(() => {
        this.isFormLoading = true;
        this.cdr.markForCheck();
        return combineLatest([
          this.ws.job('systemdataset.update', [{ pool }]),
          this.ws.call('system.advanced.update', [{ swapondrive: +swapondrive }]),
        ]).pipe(
          tap(([job]) => {
            if (job.state !== JobState.Success) {
              return;
            }
            this.isFormLoading = false;
            this.store$.dispatch(advancedConfigUpdated());
            this.cdr.markForCheck();
            this.snackbar.success(this.translate.instant('System dataset updated.'));
            this.chainedRef.close({ response: true, error: null });
          }),
          catchError((error: unknown) => {
            this.isFormLoading = false;
            this.formErrorHandler.handleWsFormError(error, this.form);
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
      swapondrive: this.storageSettings.swapSize,
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
