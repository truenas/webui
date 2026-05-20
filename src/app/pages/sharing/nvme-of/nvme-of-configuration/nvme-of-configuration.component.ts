import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent } from '@truenas/ui-components';
import { finalize, forkJoin, of, startWith } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    ModalHeaderComponent,
    TranslateModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxRadioGroupComponent,
    ReactiveFormsModule,
    IxCheckboxComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TestDirective,
    MatTooltip,
  ],
})
export class NvmeOfConfigurationComponent implements OnInit {
  // Optional: present when opened via legacy SlideIn host. Absent when hosted in <tn-side-panel>.
  slideInRef = inject<SlideInRef<void, boolean>>(SlideInRef, { optional: true });
  // Emitted when the form should close (true = saved, false = cancelled). Only relevant for tn-side-panel hosts.
  readonly closed = output<boolean>();
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private nvmeOfService = inject(NvmeOfService);
  private destroyRef = inject(DestroyRef);
  private store$ = inject<Store<AppState>>(Store);

  readonly requiredRoles = [Role.SharingNvmeTargetWrite];
  readonly isLoading = signal(false);
  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly service = toSignal(this.store$.select(selectService(ServiceName.NvmeOf)));

  protected form = this.formBuilder.nonNullable.group({
    basenqn: [''],
    ana: [false],
    rdma: [false],
    kernel: [true],
  });

  protected readonly helptext = helptextNvmeOf;

  protected readonly implementationOptions$ = of([
    {
      label: this.translate.instant('Linux Kernel'),
      value: true,
    },
    {
      label: this.translate.instant('SPDK (userspace)'),
      value: false,
    },
  ]);

  private formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status },
  );

  /** Public signal hosts can read to disable a Save action while invalid or loading. */
  readonly canSubmit = computed(() => this.formStatus() === 'VALID' && !this.isLoading());

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  /** Public entry point for hosts (e.g. tn-side-panel) to trigger form submission. */
  submit(): void {
    this.onSubmit();
  }

  private close(saved: boolean): void {
    if (this.slideInRef) {
      this.slideInRef.close({ response: saved });
    } else {
      this.closed.emit(saved);
    }
  }

  ngOnInit(): void {
    this.loadConfiguration();
  }

  private loadConfiguration(): void {
    this.isLoading.set(true);

    forkJoin([
      this.api.call('nvmet.global.config'),
      this.nvmeOfService.isRdmaCapable(),
    ]).pipe(
      this.errorHandler.withErrorHandler(),
      finalize(() => this.isLoading.set(false)),
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

  protected onSubmit(): void {
    this.isLoading.set(true);

    const { kernel, ...rest } = this.form.value;
    const payload = this.isEnterprise() ? { ...rest, kernel } : rest;

    this.api.call('nvmet.global.update', [payload]).pipe(
      this.errorHandler.withErrorHandler(),
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('Global configuration updated.'));
      this.close(true);
    });
  }
}
