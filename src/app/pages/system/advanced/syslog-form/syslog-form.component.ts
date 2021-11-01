import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { forkJoin, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { choicesToOptions } from 'app/helpers/options.helper';
import { helptext_system_advanced, helptext_system_advanced as helptext } from 'app/helptext/system/advanced';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

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
    syslog_tls_certificate: [null as number],
    syslog_tls_certificate_authority: [null as number],
    syslog: [false],
  });

  readonly isTlsTransport$ = this.form.controls['syslog_transport'].value$.pipe(
    map((value) => value === SyslogTransport.Tls),
  );

  readonly tooltips = {
    fqdn_syslog: helptext.fqdn_tooltip,
    sysloglevel: helptext.sysloglevel.tooltip,
    syslogserver: helptext.syslogserver.tooltip,
    syslog_transport: helptext.syslog_transport.tooltip,
    syslog_tls_certificate: helptext.syslog_tls_certificate.tooltip,
    syslog: helptext.system_dataset_tooltip,
  };

  readonly levelOptions = of(helptext_system_advanced.sysloglevel.options);
  readonly transportOptions = of(helptext_system_advanced.syslog_transport.options);
  readonly certificateOptions = this.ws.call('system.advanced.syslog_certificate_choices').pipe(choicesToOptions());
  readonly certificateAuthorityOptions = this.ws.call('system.advanced.syslog_certificate_authority_choices').pipe(
    choicesToOptions(),
    map((options) => [{ label: '---', value: null }, ...options]),
  );

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
    private modalService: IxModalService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form.controls['syslog_tls_certificate'].enabledWhile(this.isTlsTransport$);

    this.loadForm();
  }

  onSubmit(): void {
    const { syslog, ...configUpdate } = this.form.value;
    this.isFormLoading = true;
    this.ws.call('system.advanced.update', [configUpdate]).pipe(
      switchMap(() => this.ws.job('systemdataset.update', [{ syslog }])),
      untilDestroyed(this),
    ).subscribe(() => {
      this.isFormLoading = false;
      this.modalService.close();
      this.sysGeneralService.refreshSysGeneral();
    }, (res) => {
      this.isFormLoading = false;
      new EntityUtils().handleWSError(this, res);
      this.cdr.markForCheck();
    });
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
          this.form.patchValue({
            ...advancedConfig,
            syslog,
          });
        },
        (error) => {
          this.isFormLoading = false;
          new EntityUtils().handleWSError(null, error, this.dialogService);
        },
      );
  }
}
