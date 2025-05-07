import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
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
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-ups',
  templateUrl: './service-ups.component.html',
  styleUrls: ['./service-ups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  protected readonly requiredRoles = [Role.SystemGeneralWrite];

  protected isFormLoading = signal(false);
  isMasterMode = true;

  form = this.fb.group({
    identifier: [null as string | null, [Validators.required, Validators.pattern(/^[\w|,|.|\-|_]+$/)]],
    mode: [null as UpsMode | null],
    remotehost: [null as string | null, Validators.required],
    remoteport: [null as number | null, Validators.required],
    driver: [null as string | null, Validators.required],
    port: [null as string | null, Validators.required],
    monuser: [null as string | null, Validators.required],
    monpwd: [null as string | null, Validators.pattern(/^((?![#|\s]).)*$/)],
    extrausers: [null as string | null],
    rmonitor: [false],
    shutdown: [null as string | null],
    shutdowntimer: [null as number | null],
    shutdowncmd: [null as string | null],
    powerdown: [false],
    nocommwarntime: [300 as number | null],
    hostsync: [15],
    options: [null as string | null],
    optionsupsd: [null as string | null],
  });

  readonly helptext = helptextServiceUps;
  readonly labels = {
    identifier: helptextServiceUps.identifierLabel,
    mode: helptextServiceUps.modeLabel,
    remotehost: helptextServiceUps.remotehostLabel,
    remoteport: helptextServiceUps.remoteportLabel,
    driver: helptextServiceUps.driverLabel,
    port: helptextServiceUps.portLabel,
    monuser: helptextServiceUps.monuserLabel,
    monpwd: helptextServiceUps.monpwdLabel,
    extrausers: helptextServiceUps.extrausersLabel,
    rmonitor: helptextServiceUps.rmonitorLabel,
    shutdown: helptextServiceUps.shutdownLabel,
    shutdowntimer: helptextServiceUps.shutdowntimerLabel,
    shutdowncmd: helptextServiceUps.shutdowncmdLabel,
    powerdown: helptextServiceUps.powerdownLabel,
    nocommwarntime: helptextServiceUps.nocommwarntimeLabel,
    hostsync: helptextServiceUps.hostsyncLabel,
    options: helptextServiceUps.optionsLabel,
    optionsupsd: helptextServiceUps.optionsupsdLabel,
  };

  readonly providers: Record<string, IxComboboxProvider> = {
    driver: new SimpleAsyncComboboxProvider(this.api.call('ups.driver_choices').pipe(choicesToOptions())),
    port: new SimpleAsyncComboboxProvider(this.api.call('ups.port_choices').pipe(singleArrayToOptions())),
  };

  readonly tooltips = {
    identifier: helptextServiceUps.identifierTooltip,
    mode: this.translate.instant(
      'Choose <i>Master</i> if the UPS is plugged directly\
      into the system serial port. The UPS will remain the\
      last item to shut down. Choose <i>Slave</i> to have\
      this system shut down before <i>Master</i>. See the\
      <a href="{url}"\
      target="_blank">Network UPS Tools Overview</a>.',
      { url: 'https://networkupstools.org/docs/user-manual.chunked/ar01s02.html#_monitoring_client' },
    ),
    remotehost: helptextServiceUps.remotehostTooltip,
    remoteport: helptextServiceUps.remoteportTooltip,
    driver: helptextServiceUps.driverTooltip,
    port: helptextServiceUps.portTooltip,
    monuser: helptextServiceUps.monuserTooltip,
    monpwd: helptextServiceUps.monpwdTooltip,
    extrausers: helptextServiceUps.extrausersTooltip,
    rmonitor: helptextServiceUps.rmonitorTooltip,
    shutdown: helptextServiceUps.shutdownTooltip,
    shutdowntimer: helptextServiceUps.shutdowntimerTooltip,
    shutdowncmd: helptextServiceUps.shutdowncmdTooltip,
    powerdown: helptextServiceUps.powerdownTooltip,
    nocommwarntime: helptextServiceUps.nocommwarntimeTooltip,
    hostsync: helptextServiceUps.hostsyncTooltip,
    options: helptextServiceUps.optionsTooltip,
    optionsupsd: helptextServiceUps.optionsupsdTooltip,
  };

  readonly modeOptions$ = of(translateOptions(this.translate, helptextServiceUps.modeOptions));
  readonly shutdownOptions$ = of(translateOptions(this.translate, helptextServiceUps.shutdownOptions));

  constructor(
    private api: ApiService,
    private formErrorHandler: FormErrorHandlerService,
    private errorHandler: ErrorHandlerService,
    private fb: NonNullableFormBuilder,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    public slideInRef: SlideInRef<undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.isFormLoading.set(true);
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
    this.api.call('ups.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue(config);
          this.isFormLoading.set(false);
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.showErrorModal(error);
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

    this.isFormLoading.set(true);
    this.api.call('ups.update', [params as UpsConfigUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
