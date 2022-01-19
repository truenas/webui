import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ServiceName } from '../../../../enums/service-name.enum';
import { ServiceStatus } from '../../../../enums/service-status.enum';
import { choicesToOptions } from '../../../../helpers/options.helper';
import { EntityUtils } from '../../../../modules/entity/utils';

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
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('systemdataset.config')
      .pipe(untilDestroyed(this))
      .subscribe(
        (config) => {
          this.isFormLoading = false;
          this.form.patchValue(config);
          this.cdr.markForCheck();
        },
        (error) => {
          this.isFormLoading = false;
          new EntityUtils().handleWsError(null, error, this.dialogService);
          this.cdr.markForCheck();
        },
      );
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const values = this.form.value;

    this.confirmSmbRestartIfNeeded().pipe(
      filter(Boolean),
      switchMap(() => this.ws.job('systemdataset.update', [values])),
      untilDestroyed(this),
    ).subscribe(
      () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
      },
      (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    );
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
