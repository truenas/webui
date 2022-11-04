import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { EMPTY, Observable, of } from 'rxjs';
import {
  catchError, filter, switchMap, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { choicesToOptions } from 'app/helpers/options.helper';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  templateUrl: './system-dataset-pool.component.html',
  styleUrls: ['./system-dataset-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemDatasetPoolComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    pool: ['', Validators.required],
  });

  readonly poolOptions$ = this.ws.call('systemdataset.pool_choices').pipe(choicesToOptions());

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private translate: TranslateService,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('systemdataset.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.isFormLoading = false;
          this.form.patchValue(config);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isFormLoading = false;
          new EntityUtils().handleWsError(this, error, this.dialogService);
          this.cdr.markForCheck();
        },
      });
  }

  onSubmit(): void {
    const values = this.form.value;

    this.confirmSmbRestartIfNeeded().pipe(
      filter(Boolean),
      switchMap(() => {
        this.isFormLoading = true;
        return this.ws.job('systemdataset.update', [values]).pipe(
          tap((job) => {
            if (job.state !== JobState.Success) {
              return;
            }
            this.isFormLoading = false;
            this.store$.dispatch(advancedConfigUpdated());
            this.cdr.markForCheck();
            this.slideInService.close();
          }),
          catchError((error) => {
            this.isFormLoading = false;
            this.errorHandler.handleWsFormError(error, this.form);
            this.cdr.markForCheck();
            return EMPTY;
          }),
        );
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  /**
   * @return boolean True when saving can continue.
   */
  private confirmSmbRestartIfNeeded(): Observable<boolean> {
    return this.ws.call('service.query').pipe(
      switchMap((services) => {
        const smbService = _.find(services, { service: ServiceName.Cifs });
        if (smbService.state === ServiceStatus.Running) {
          return this.dialogService.confirm({
            title: this.translate.instant('Restart SMB Service'),
            message: this.translate.instant(
              'The system dataset will be updated and the SMB service restarted. This will cause a temporary disruption of any active SMB connections.',
            ),
            hideCheckBox: false,
            buttonMsg: this.translate.instant('Continue'),
          });
        }

        return of(true);
      }),
    );
  }
}
