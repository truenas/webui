import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, output, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnFormFieldComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  finalize, merge, of, startWith, switchMap,
} from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { NvmeOfTransportType, nvmeOfTransportTypeLabels } from 'app/enums/nvme-of.enum';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';

@Component({
  selector: 'ix-port-form',
  templateUrl: './port-form.component.html',
  styleUrl: './port-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IxFieldsetComponent,
    ModalHeaderComponent,
    TranslateModule,
    AsyncPipe,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnSelectComponent,
    TnInputComponent,
    TnButtonComponent,
    FormActionsComponent,
    RequiresRolesDirective,
  ],
})
export class PortFormComponent implements OnInit {
  private api = inject(ApiService);
  private nvmeOfService = inject(NvmeOfService);
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private formErrorHandler = inject(FormErrorHandlerService);
  /** Present when opened via legacy SlideIn host. Absent when hosted in `<tn-side-panel>`. */
  readonly slideInRef = inject<SlideInRef<NvmeOfPort | undefined, NvmeOfPort | null>>(SlideInRef, { optional: true });
  private destroyRef = inject(DestroyRef);

  /** Port being edited when provided by a `<tn-side-panel>` host (SlideIn supplies it via `slideInRef`). */
  readonly data = input<NvmeOfPort>();
  /** Emitted with the saved port when hosted in a `<tn-side-panel>`. */
  readonly saved = output<NvmeOfPort>();

  protected isLoading = signal(false);

  private existingPort = signal<NvmeOfPort | null>(null);

  protected isNew = computed(() => !this.existingPort());

  protected types$ = this.nvmeOfService.getSupportedTransports().pipe(
    map((supportedTransports) => {
      const allOptions = mapToOptions(nvmeOfTransportTypeLabels, this.translate);

      return allOptions.filter((option) => supportedTransports.includes(option.value));
    }),
  );

  protected readonly helptext = helptextNvmeOf;
  protected readonly InputType = InputType;

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => of(this.hasUnsavedChanges()));
  }

  protected form = this.formBuilder.group({
    addr_trtype: [NvmeOfTransportType.Tcp],
    addr_trsvcid: [null as number | string],
    addr_traddr: ['', Validators.required],
  });

  private readonly formStatus = toSignal(
    this.form.statusChanges.pipe(startWith(this.form.status)),
    { initialValue: this.form.status },
  );

  /** Whether the form can be submitted — read by a `<tn-side-panel>` host's footer Save. */
  readonly canSubmit = computed(() => this.formStatus() === 'VALID' && !this.isLoading());

  protected addresses$ = merge(
    of(this.form.controls.addr_trtype.value),
    this.form.controls.addr_trtype.valueChanges,
  ).pipe(
    distinctUntilChanged(),
    switchMap((type) => {
      return this.api.call('nvmet.port.transport_address_choices', [type]);
    }),
    choicesToOptions(),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Public entry point for a `<tn-side-panel>` host's footer Save. */
  submit(): void {
    this.onSubmit();
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  get isTcp(): boolean {
    return this.form.value.addr_trtype === NvmeOfTransportType.Tcp;
  }

  get isFibreChannel(): boolean {
    return this.form.value.addr_trtype === NvmeOfTransportType.FibreChannel;
  }

  get portPlaceholder(): TranslatedString {
    return (this.isFibreChannel ? '' : '4420') as TranslatedString;
  }

  ngOnInit(): void {
    const existingPort = this.slideInRef?.getData() ?? this.data();

    if (existingPort) {
      this.existingPort.set(existingPort);

      this.form.patchValue(existingPort);
    }
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const payload = this.form.getRawValue();

    // Use default port 4420 if no port was specified (only for TCP/RDMA, not for Fibre Channel)
    if (!payload.addr_trsvcid && !this.isFibreChannel) {
      payload.addr_trsvcid = 4420;
    }

    const request$ = this.isNew()
      ? this.api.call('nvmet.port.create', [payload])
      : this.api.call('nvmet.port.update', [this.existingPort().id, payload]);

    request$.pipe(
      finalize(() => this.isLoading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (port) => {
        this.close(port);
      },
      error: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  private close(port: NvmeOfPort): void {
    if (this.slideInRef) {
      this.slideInRef.close({ response: port });
    } else {
      this.saved.emit(port);
    }
  }
}
