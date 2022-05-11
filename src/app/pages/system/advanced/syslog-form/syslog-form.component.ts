import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY, forkJoin, of } from 'rxjs';
import {
  catchError, map, switchMap, tap,
} from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { choicesToOptions } from 'app/helpers/options.helper';
import { helptextSystemAdvanced, helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { AdvancedConfigUpdate } from 'app/interfaces/advanced-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: 'syslog-form.component.html',
  styleUrls: ['./syslog-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyslogFormComponent implements OnInit {
  isFormLoading = false;
  readonly form = this.fb.group({
    fqdn_syslog: [false],
    sysloglevel: [null as SyslogLevel],
    syslogserver: [''],
    syslog_transport: [null as SyslogTransport],
    syslog_tls_certificate: [null as string],
    syslog_tls_certificate_authority: [null as string],
    syslog: [false],
  });

  readonly isTlsTransport$ = this.form.select((values) => values.syslog_transport === SyslogTransport.Tls);

  readonly tooltips = {
    fqdn_syslog: helptext.fqdn_tooltip,
    sysloglevel: helptext.sysloglevel.tooltip,
    syslogserver: helptext.syslogserver.tooltip,
    syslog_transport: helptext.syslog_transport.tooltip,
    syslog_tls_certificate: helptext.syslog_tls_certificate.tooltip,
    syslog: helptext.system_dataset_tooltip,
  };

  readonly levelOptions = of(helptextSystemAdvanced.sysloglevel.options);
  readonly transportOptions = of(helptextSystemAdvanced.syslog_transport.options);
  readonly certificateOptions = this.ws.call('system.advanced.syslog_certificate_choices').pipe(
    choicesToOptions(),
    map((options) => [{ label: '---', value: null }, ...options]),
  );
  readonly certificateAuthorityOptions = this.ws.call('system.advanced.syslog_certificate_authority_choices')
    .pipe(choicesToOptions());

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.form.controls['syslog_tls_certificate'].enabledWhile(this.isTlsTransport$);

    this.loadForm();
  }

  onSubmit(): void {
    const { syslog, ...values } = this.form.value;
    let configUpdate: Partial<AdvancedConfigUpdate> = {
      syslog_transport: values.syslog_transport,
      fqdn_syslog: values.fqdn_syslog,
      syslogserver: values.syslogserver,
      sysloglevel: values.sysloglevel,
    };

    if (values.syslog_transport === SyslogTransport.Tls) {
      configUpdate = {
        ...configUpdate,
        syslog_tls_certificate: parseInt(values.syslog_tls_certificate),
        syslog_tls_certificate_authority: parseInt(values.syslog_tls_certificate_authority),
      };
    }

    this.isFormLoading = true;
    this.ws.call('system.advanced.update', [configUpdate]).pipe(
      switchMap(() => this.ws.job('systemdataset.update', [{ syslog }]).pipe(
        tap((job) => {
          if (job.state !== JobState.Success) {
            return;
          }
          this.isFormLoading = false;
          this.sysGeneralService.refreshSysGeneral();
          this.cdr.markForCheck();
          this.slideInService.close();
        }),
        catchError((error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError({ ...error, ...(error.exc_info || {}) }, this.form);
          this.cdr.markForCheck();
          return EMPTY;
        }),
      )),
      untilDestroyed(this),
    ).subscribe();
  }

  private loadForm(): void {
    this.isFormLoading = true;

    forkJoin([
      this.ws.call('system.advanced.config'),
      this.ws.call('systemdataset.config'),
    ]).pipe(untilDestroyed(this))
      .subscribe(
        ([advancedConfig, { syslog }]) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.form.patchValue({
            ...advancedConfig,
            syslog_tls_certificate: String(advancedConfig.syslog_tls_certificate),
            syslog_tls_certificate_authority: String(advancedConfig.syslog_tls_certificate_authority),
            syslog,
          });
        },
        (error) => {
          this.isFormLoading = false;
          new EntityUtils().handleWsError(null, error, this.dialogService);
        },
      );
  }
}
