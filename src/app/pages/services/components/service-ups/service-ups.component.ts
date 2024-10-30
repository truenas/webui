import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { UpsMode } from 'app/enums/ups-mode.enum';
import { choicesToOptions, singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextServiceUps } from 'app/helptext/services/components/service-ups';
import { UpsConfigUpdate } from 'app/interfaces/ups-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-ups',
  templateUrl: './service-ups.component.html',
  styleUrls: ['./service-ups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxComboboxComponent,
    IxTextareaComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ServiceUpsComponent implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  isFormLoading = false;
  isMasterMode = true;

  form = this.fb.group({
    identifier: [null as string, [Validators.required, Validators.pattern(/^[\w|,|.|\-|_]+$/)]],
    mode: [null as UpsMode],
    remotehost: [null as string, Validators.required],
    remoteport: [null as number, Validators.required],
    driver: [null as string, Validators.required],
    port: [null as string, Validators.required],
    monuser: [null as string, Validators.required],
    monpwd: [null as string, Validators.pattern(/^((?![#|\s]).)*$/)],
    extrausers: [null as string],
    rmonitor: [false],
    shutdown: [null as string],
    shutdowntimer: [null as number],
    shutdowncmd: [null as string],
    powerdown: [false],
    nocommwarntime: [300],
    hostsync: [15],
    description: [null as string],
    options: [null as string],
    optionsupsd: [null as string],
  });

  readonly helptext = helptextServiceUps;
  readonly labels = {
    identifier: helptextServiceUps.ups_identifier_placeholder,
    mode: helptextServiceUps.ups_mode_placeholder,
    remotehost: helptextServiceUps.ups_remotehost_placeholder,
    remoteport: helptextServiceUps.ups_remoteport_placeholder,
    driver: helptextServiceUps.ups_driver_placeholder,
    port: helptextServiceUps.ups_port_placeholder,
    monuser: helptextServiceUps.ups_monuser_placeholder,
    monpwd: helptextServiceUps.ups_monpwd_placeholder,
    extrausers: helptextServiceUps.ups_extrausers_placeholder,
    rmonitor: helptextServiceUps.ups_rmonitor_placeholder,
    shutdown: helptextServiceUps.ups_shutdown_placeholder,
    shutdowntimer: helptextServiceUps.ups_shutdowntimer_placeholder,
    shutdowncmd: helptextServiceUps.ups_shutdowncmd_placeholder,
    powerdown: helptextServiceUps.ups_powerdown_placeholder,
    nocommwarntime: helptextServiceUps.ups_nocommwarntime_placeholder,
    hostsync: helptextServiceUps.ups_hostsync_placeholder,
    description: helptextServiceUps.ups_description_placeholder,
    options: helptextServiceUps.ups_options_placeholder,
    optionsupsd: helptextServiceUps.ups_optionsupsd_placeholder,
  };

  readonly providers: Record<string, IxComboboxProvider> = {
    driver: new SimpleAsyncComboboxProvider(this.ws.call('ups.driver_choices').pipe(choicesToOptions())),
    port: new SimpleAsyncComboboxProvider(this.ws.call('ups.port_choices').pipe(singleArrayToOptions())),
  };

  readonly tooltips = {
    identifier: helptextServiceUps.ups_identifier_tooltip,
    mode: this.translate.instant(
      'Choose <i>Master</i> if the UPS is plugged directly\
      into the system serial port. The UPS will remain the\
      last item to shut down. Choose <i>Slave</i> to have\
      this system shut down before <i>Master</i>. See the\
      <a href="{url}"\
      target="_blank">Network UPS Tools Overview</a>.',
      { url: 'https://networkupstools.org/docs/user-manual.chunked/ar01s02.html#_monitoring_client' },
    ),
    remotehost: helptextServiceUps.ups_remotehost_tooltip,
    remoteport: helptextServiceUps.ups_remoteport_tooltip,
    driver: helptextServiceUps.ups_driver_tooltip,
    port: helptextServiceUps.ups_port_tooltip,
    monuser: helptextServiceUps.ups_monuser_tooltip,
    monpwd: helptextServiceUps.ups_monpwd_tooltip,
    extrausers: helptextServiceUps.ups_extrausers_tooltip,
    rmonitor: helptextServiceUps.ups_rmonitor_tooltip,
    shutdown: helptextServiceUps.ups_shutdown_tooltip,
    shutdowntimer: helptextServiceUps.ups_shutdowntimer_tooltip,
    shutdowncmd: helptextServiceUps.ups_shutdowncmd_tooltip,
    powerdown: helptextServiceUps.ups_powerdown_tooltip,
    nocommwarntime: helptextServiceUps.ups_nocommwarntime_tooltip,
    hostsync: helptextServiceUps.ups_hostsync_tooltip,
    description: helptextServiceUps.ups_description_tooltip,
    options: helptextServiceUps.ups_options_tooltip,
    optionsupsd: helptextServiceUps.ups_optionsupsd_tooltip,
  };

  readonly modeOptions$ = of(helptextServiceUps.ups_mode_options);
  readonly shutdownOptions$ = of(helptextServiceUps.ups_shutdown_options);

  constructor(
    private ws: WebSocketService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private slideInRef: SlideInRef<ServiceUpsComponent>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.loadConfig();
    this.form.controls.remotehost.disable();
    this.form.controls.remoteport.disable();

    this.form.controls.mode.valueChanges.pipe(untilDestroyed(this)).subscribe((mode) => {
      if (mode === UpsMode.Master) {
        this.form.controls.remotehost.disable();
        this.form.controls.remoteport.disable();
        this.form.controls.port.setValidators(Validators.required);
        this.form.controls.driver.enable();
        this.isMasterMode = true;
      } else {
        this.form.controls.remotehost.enable();
        this.form.controls.remoteport.enable();
        this.form.controls.port.clearValidators();
        this.form.controls.driver.disable();
        this.isMasterMode = false;
      }
    });
  }

  private loadConfig(): void {
    this.ws.call('ups.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.dialogService.error(this.errorHandler.parseError(error));
          this.cdr.markForCheck();
        },
      });
  }

  onSubmit(): void {
    const params = this.form.value;

    if (this.isMasterMode) {
      delete params.remoteport;
      delete params.remotehost;
    } else {
      delete params.driver;
    }

    this.isFormLoading = true;
    this.ws.call('ups.update', [params as UpsConfigUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.slideInRef.close(true);
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isFormLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
