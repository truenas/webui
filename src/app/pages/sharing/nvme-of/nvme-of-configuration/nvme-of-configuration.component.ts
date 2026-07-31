import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
  TnRadioComponent, TnTooltipDirective,
} from '@truenas/ui-components';
import { finalize, forkJoin } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { Option } from 'app/interfaces/option.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectService } from 'app/store/services/services.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-nvme-of-configuration',
  templateUrl: './nvme-of-configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnRadioComponent,
    TnCheckboxComponent,
    ReactiveFormsModule,
    TnTooltipDirective,
  ],
})
export class NvmeOfConfigurationComponent extends IxFormHostForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private nvmeOfService = inject(NvmeOfService);
  private destroyRef = inject(DestroyRef);
  private store$ = inject<Store<AppState>>(Store);

  readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  /** Initial config fetch only — the submit lifecycle is owned by the inner `<ix-form>`. */
  protected readonly isLoadingConfig = signal(false);

  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly service = toSignal(this.store$.select(selectService(ServiceName.NvmeOf)));

  protected readonly form = this.formBuilder.nonNullable.group({
    basenqn: [''],
    ana: [false],
    rdma: [false],
    kernel: [true],
  });

  protected readonly helptext = helptextNvmeOf;

  protected readonly implementationOptions: Option<boolean>[] = [
    {
      label: this.translate.instant('Linux Kernel'),
      value: true,
    },
    {
      label: this.translate.instant('SPDK (userspace)'),
      value: false,
    },
  ];

  ngOnInit(): void {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    this.isLoadingConfig.set(true);

    forkJoin([
      this.api.call('nvmet.global.config'),
      this.nvmeOfService.isRdmaCapable(),
    ]).pipe(
      this.errorHandler.withErrorHandler(),
      finalize(() => this.isLoadingConfig.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([config, isRdmaCapable]) => {
      this.form.patchValue(config);

      if (!isRdmaCapable) {
        this.form.controls.rdma.disable();
      }

      if (!this.isHaLicensed()) {
        this.form.controls.ana.disable();
      }

      const service = this.service();
      if (service?.state === ServiceStatus.Running) {
        this.form.controls.kernel.disable();
      }
    });
  }

  // Ignores the event: this form sends a full config every time, so `changedValues` (and the
  // `initialFormSnapshot` that would make it meaningful) buys nothing. `isEdit` is likewise fixed
  // via `[isEditMode]="true"` — a global config is never a create.
  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    // `form.value` (not the event's raw values) so controls disabled by the loaded system
    // capabilities — RDMA, ANA, Implementation — stay out of the payload.
    const { kernel, ...rest } = this.form.value;
    const payload = this.isEnterprise() ? { ...rest, kernel } : rest;

    return {
      request$: this.api.call('nvmet.global.update', [payload]),
      successMessage: this.translate.instant('Global configuration updated.'),
    };
  };
}
