import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnInputComponent, TnRadioComponent, TnTooltipDirective,
} from '@truenas/ui-components';
import { finalize, forkJoin } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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
  styleUrl: './nvme-of-configuration.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    TranslateModule,
    IxFieldsetComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnRadioComponent,
    TnCheckboxComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TnTooltipDirective,
  ],
})
export class NvmeOfConfigurationComponent extends SidePanelForm implements OnInit {
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

  protected readonly form = this.formBuilder.nonNullable.group({
    basenqn: [''],
    ana: [false],
    rdma: [false],
    kernel: [true],
  });

  protected readonly helptext = helptextNvmeOf;

  protected readonly implementationOptions = [
    {
      label: this.translate.instant('Linux Kernel'),
      value: true,
    },
    {
      label: this.translate.instant('SPDK (userspace)'),
      value: false,
    },
  ];

  /** Public signal hosts can read to disable a Save action while invalid or loading. */
  readonly canSubmit = this.trackCanSubmit(this.isLoading);

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
