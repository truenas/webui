import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import {
  EMPTY, forkJoin, Observable,
} from 'rxjs';
import {
  catchError, filter, switchMap, tap,
} from 'rxjs/operators';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptextSharingIscsi, shared } from 'app/helptext/sharing';
import { numberValidator } from 'app/modules/entity/entity-form/validators/number-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-target-global-configuration',
  templateUrl: './target-global-configuration.component.html',
  styleUrls: ['./target-global-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetGlobalConfigurationComponent implements OnInit {
  isFormLoading = false;
  areSettingsSaved = false;

  form = this.fb.group({
    basename: ['', Validators.required],
    isns_servers: [[] as string[]],
    pool_avail_threshold: [null as number, numberValidator()],
  });

  readonly tooltips = {
    basename: helptextSharingIscsi.globalconf_tooltip_basename,
    isns_servers: helptextSharingIscsi.globalconf_tooltip_isns_servers,
    pool_avail_threshold: helptextSharingIscsi.globalconf_tooltip_pool_avail_threshold,
  };

  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dialog: DialogService,
    private errorHandler: FormErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadFormValues();
  }

  onSubmit(): void {
    this.areSettingsSaved = false;
    this.setLoading(true);
    const values = this.form.value;

    this.ws.call('iscsi.global.update', [values])
      .pipe(
        switchMap(() => this.checkIfServiceShouldBeEnabled()),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => {
          this.setLoading(false);
          this.areSettingsSaved = true;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.setLoading(false);
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private loadFormValues(): void {
    this.setLoading(true);

    this.ws.call('iscsi.global.config').pipe(untilDestroyed(this)).subscribe(
      (config) => {
        this.form.patchValue(config);
        this.setLoading(false);
      },
      (error) => {
        new EntityUtils().handleWsError(null, error, this.dialog);
        this.setLoading(false);
      },
    );
  }

  private checkIfServiceShouldBeEnabled(): Observable<unknown> {
    return this.ws.call('service.query').pipe(
      switchMap((services) => {
        const service = _.find(services, { service: ServiceName.Iscsi });
        if (service.enable) {
          return EMPTY;
        }

        return this.dialogService.confirm({
          title: shared.dialog_title,
          message: shared.dialog_message,
          hideCheckBox: true,
          buttonMsg: shared.dialog_button,
        }).pipe(
          filter(Boolean),
          switchMap(() => forkJoin([
            this.ws.call('service.update', [service.id, { enable: true }]),
            this.ws.call('service.start', [service.service, { silent: false }]),
          ])),
          tap(() => {
            this.dialogService.info(
              this.translate.instant('{service} Service', { service: 'iSCSI' }),
              this.translate.instant('The {service} service has been enabled.', { service: 'iSCSI' }),
              '250px',
              'info',
            );
          }),
          catchError((error) => {
            this.dialogService.errorReport(error.error, error.reason, error.trace.formatted);
            return EMPTY;
          }),
        );
      }),
    );
  }

  private setLoading(value: boolean): void {
    this.isFormLoading = value;
    this.cdr.markForCheck();
  }
}
