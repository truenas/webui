import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnAutocompleteComponent, TnCheckboxComponent,
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { UpsMode } from 'app/enums/ups-mode.enum';
import { choicesToOptions, singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextServiceUps } from 'app/helptext/services/components/service-ups';
import { UpsConfigUpdate } from 'app/interfaces/ups-config.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

/**
 * The form's own value shape, which is NOT `UpsConfigUpdate` (controls are nullable and the
 * mode-specific fields are stripped in {@link ServiceUpsComponent.handleSubmit}). `<ix-form>`
 * infers its generic from the snapshot, so typing it against the API shape would make
 * `FormSubmitEvent` lie.
 */
type UpsFormValue = ReturnType<ServiceUpsComponent['form']['getRawValue']>;

@Component({
  selector: 'ix-service-ups',
  templateUrl: './service-ups.component.html',
  styleUrls: ['./service-ups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TnAutocompleteComponent,
    TranslateModule,
  ],
})
export class ServiceUpsComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.SystemGeneralWrite];
  protected readonly InputType = InputType;

  protected readonly dataLoading = signal(false);
  /**
   * A failed config load leaves the form on untouched defaults the user never saw. Fed to
   * `<ix-form>`'s `extraDisabled` so Save (in-body and the panel footer's) can't submit them.
   */
  protected readonly loadFailed = signal(false);
  protected readonly initialFormSnapshot = signal<Partial<UpsFormValue> | null>(null);
  protected readonly isMasterMode = signal(true);

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

  /** Driver options: label is the description, value is the `driver$name` key. */
  readonly driverOptions$ = this.api.call('ups.driver_choices').pipe(choicesToOptions());

  /** Detected device paths; the label IS the value, so tn-autocomplete fits. */
  readonly portOptions$ = this.api.call('ups.port_choices').pipe(singleArrayToOptions());

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

  // tn-select does not translate option labels, so translate up-front.
  readonly modeOptions = translateOptions(this.translate, helptextServiceUps.modeOptions);
  readonly shutdownOptions = translateOptions(this.translate, helptextServiceUps.shutdownOptions);

  ngOnInit(): void {
    this.dataLoading.set(true);
    this.loadConfig();
    this.form.controls.remotehost.disable();
    this.form.controls.remoteport.disable();

    this.form.controls.mode.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((mode) => {
      if (mode === UpsMode.Master) {
        this.form.controls.remotehost.disable();
        this.form.controls.remoteport.disable();
        this.form.controls.port.setValidators(Validators.required);
        this.form.controls.driver.enable();
        this.isMasterMode.set(true);
      } else {
        this.form.controls.remotehost.enable();
        this.form.controls.remoteport.enable();
        this.form.controls.port.clearValidators();
        this.form.controls.driver.disable();
        this.isMasterMode.set(false);
      }
    });
  }

  private loadConfig(): void {
    this.api.call('ups.config')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (config) => {
          this.form.patchValue(config);
          this.initialFormSnapshot.set(this.form.getRawValue());
          this.dataLoading.set(false);
        },
        error: (error: unknown) => {
          this.dataLoading.set(false);
          this.loadFailed.set(true);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  protected handleSubmit = (): SubmitResult => {
    // Copy first: `form.value` hands back the FormGroup's own live value object, so deleting keys
    // off it writes through to form state. Save can be pressed again after a failed submit, which
    // would then re-run the reshaping over already-mutated values.
    const params = { ...this.form.value };

    if (this.isMasterMode()) {
      delete params.remoteport;
      delete params.remotehost;
    } else {
      delete params.driver;
    }

    return {
      request$: this.api.call('ups.update', [params as UpsConfigUpdate]),
      successMessage: this.translate.instant('Service configuration saved'),
    };
  };
}
