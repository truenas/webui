import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  combineLatest, EMPTY, forkJoin, Observable, of,
} from 'rxjs';
import {
  catchError, filter, switchMap, take, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

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

  readonly poolOptions$ = this.ws.call('systemdataset.pool_choices').pipe(choicesToOptions());

  constructor(
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<StorageSettingsFormComponent>,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private ixValidator: IxValidatorsService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private store$: Store<AppState>,
    private snackbar: SnackbarService,
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
            this.slideInRef.close();
          }),
          catchError((error) => {
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
    this.isFormLoading = true;
    this.cdr.markForCheck();

    forkJoin([
      this.ws.call('systemdataset.config'),
      this.store$.pipe(waitForAdvancedConfig, take(1)),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([systemDatasetConfig, advancedConfig]) => {
          this.isFormLoading = false;
          this.form.patchValue({
            pool: systemDatasetConfig.pool,
            swapondrive: advancedConfig.swapondrive,
          });
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isFormLoading = false;
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * @return boolean True when saving can continue.
   */
  private confirmSmbRestartIfNeeded(): Observable<boolean> {
    this.isFormLoading = true;
    this.cdr.markForCheck();
    return this.ws.call('service.query').pipe(
      switchMap((services) => {
        this.isFormLoading = false;
        this.cdr.markForCheck();

        const smbService = _.find(services, { service: ServiceName.Cifs });
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
