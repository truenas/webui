import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import helptext from 'app/helptext/services/components/service-snmp';
import { SnmpConfigUpdate } from 'app/interfaces/snmp-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './service-snmp.component.html',
  styleUrls: ['./service-snmp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSnmpComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    location: [''],
    contact: ['', Validators.email],
    community: ['', Validators.pattern(/^[\w_\-.\s]*$/)],

    v3: [false],
    v3_username: [''],
    v3_authtype: [''],
    v3_password: ['', [
      Validators.minLength(8),
      this.validation.validateOnCondition(
        () => this.isV3SupportEnabled,
        Validators.required,
      ),
    ]],
    v3_privproto: [''],
    v3_privpassphrase: ['', Validators.minLength(8)],

    options: [''],
    zilstat: [false],
    loglevel: [null as number],
  });

  readonly tooltips = {
    location: helptext.location_tooltip,
    contact: helptext.contact_tooltip,
    community: helptext.community_tooltip,
    v3: helptext.v3_tooltip,
    v3_username: helptext.v3_username_tooltip,
    v3_authtype: helptext.v3_authtype_tooltip,
    v3_password: helptext.v3_password_tooltip,
    v3_privproto: helptext.v3_privproto_tooltip,
    v3_privpassphrase: helptext.v3_privpassphrase_tooltip,
    options: helptext.options_tooltip,
    zilstat: helptext.zilstat_tooltip,
    loglevel: helptext.loglevel_tooltip,
  };

  readonly authtypeOptions$ = of(helptext.v3_authtype_options);
  readonly privprotoOptions$ = of(helptext.v3_privproto_options);
  readonly logLevelOptions$ = of(helptext.loglevel_options);

  get isV3SupportEnabled(): boolean {
    return this.form?.value?.['v3'];
  }

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private errorHandler: FormErrorHandlerService,
    private validation: IxValidatorsService,
  ) {}

  ngOnInit(): void {
    this.loadCurrentSettings();
  }

  onSubmit(): void {
    this.isFormLoading = true;
    const values = this.form.value;
    if (!values.v3) {
      values.v3_username = '';
      values.v3_password = '';
      values.v3_authtype = '';
      values.v3_privproto = null;
      values.v3_privpassphrase = '';
    }

    this.ws.call('snmp.update', [values as SnmpConfigUpdate]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/services']);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private loadCurrentSettings(): void {
    this.isFormLoading = true;
    this.ws.call('snmp.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.isFormLoading = false;
        this.form.patchValue(config);
        this.cdr.markForCheck();
      },
      error: (error) => {
        new EntityUtils().handleWsError(this, error, this.dialogService);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
