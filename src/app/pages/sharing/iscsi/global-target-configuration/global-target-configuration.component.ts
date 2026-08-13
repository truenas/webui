import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, FormControl, Validators, ReactiveFormsModule, FormGroup,
} from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType,
  TnCheckboxComponent,
  TnChipInputComponent,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnInputComponent,
} from '@truenas/ui-components';
import {
  forkJoin, take,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { RdmaProtocolName, ServiceName } from 'app/enums/service-name.enum';
import { helptextIscsi } from 'app/helptext/sharing';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-global-target-configuration',
  templateUrl: './global-target-configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnChipInputComponent,
    TnCheckboxComponent,
    TranslateModule,
  ],
})
export class GlobalTargetConfigurationComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private validatorsService = inject(IxValidatorsService);
  private destroyRef = inject(DestroyRef);

  protected readonly InputType = InputType;
  protected readonly isHaSystem = signal(false);
  private originalBasename: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    basename: ['', Validators.required],
    isns_servers: [[] as string[]],
    pool_avail_threshold: [null as number | null],
    listen_port: [null as number | null, Validators.required],
    alua: [false],
    iser: [false],
  }) as FormGroup<{
    basename: FormControl<string>;
    isns_servers: FormControl<string[]>;
    pool_avail_threshold: FormControl<number | null>;
    listen_port: FormControl<number | null>;
    alua?: FormControl<boolean>;
    iser: FormControl<boolean>;
  }>;

  readonly tooltips = {
    basename: helptextIscsi.config.basenameTooltip,
    isns_servers: helptextIscsi.config.isnsServersTooltip,
    pool_avail_threshold: helptextIscsi.config.alertThreshold,
    alua: helptextIscsi.config.aluaTooltip,
    iser: helptextIscsi.config.iserTooltip,
  };

  readonly requiredRoles = [Role.SharingIscsiGlobalWrite];

  ngOnInit(): void {
    // Wired before the load: `loadFormConfig`'s patch callback is replayed by `retryLoad`, so a
    // subscription registered inside it would be re-registered on every retry.
    this.listenForHaStatus();
    this.checkForRdmaSupport();
    this.setupBasenameValidation();

    this.loadFormConfig(this.api.call('iscsi.global.config'), (config) => {
      this.originalBasename = config.basename;
      this.form.patchValue(config);
    });
  }

  protected handleSubmit = (): SubmitResult => {
    // `form.value` rather than the event's `allValues` (a raw value): `iser` is disabled on
    // systems without RDMA support, and the update payload must not carry it there.
    const values = { ...this.form.value };

    return {
      request$: this.api.call('iscsi.global.update', [values]),
      successMessage: this.translate.instant('Settings saved.'),
      onSuccess: () => {
        this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));
      },
    };
  };

  private listenForHaStatus(): void {
    this.store$.select(selectIsHaLicensed).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isHa) => {
      this.isHaSystem.set(isHa);

      if (!isHa) {
        this.form.removeControl('alua');
      }

      if (isHa && !this.form.controls.alua) {
        this.form.addControl('alua', new FormControl(false, { nonNullable: true }));
      }
    });
  }

  private checkForRdmaSupport(): void {
    forkJoin([
      this.api.call('rdma.capable_protocols'),
      this.store$.select(selectIsEnterprise).pipe(take(1)),
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([capableProtocols, isEnterprise]) => {
      const hasRdmaSupport = capableProtocols.includes(RdmaProtocolName.Iser) && isEnterprise;
      if (hasRdmaSupport) {
        this.form.controls.iser.enable();
      } else {
        this.form.controls.iser.disable();
      }
    });
  }

  private setupBasenameValidation(): void {
    this.form.controls.basename.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const basenameControl = this.form.controls.basename;

      // Only apply pattern validation if the basename value has been changed from the original
      if (value !== this.originalBasename) {
        basenameControl.setValidators([
          Validators.required,
          this.validatorsService.withMessage(
            Validators.pattern(/^[a-z0-9.:-]+$/),
            this.translate.instant('Only lowercase alphanumeric characters and . : - are allowed.'),
          ),
        ]);
      } else {
        // If value matches original, only require it to be non-empty
        basenameControl.setValidators([Validators.required]);
      }

      basenameControl.updateValueAndValidity({ emitEvent: false });
    });
  }
}
