import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  InputType,
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { merge, of, switchMap } from 'rxjs';
import { distinctUntilChanged, map, shareReplay } from 'rxjs/operators';
import { NvmeOfTransportType, nvmeOfTransportTypeLabels } from 'app/enums/nvme-of.enum';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';

@Component({
  selector: 'ix-port-form',
  templateUrl: './port-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    AsyncPipe,
  ],
})
export class PortFormComponent implements OnInit {
  private api = inject(ApiService);
  private nvmeOfService = inject(NvmeOfService);
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);

  /** Edit data supplied by a `<tn-side-panel>` host. */
  readonly port = input<NvmeOfPort | undefined>(undefined);

  /** Created/updated record emitted on a successful submit when hosted in a `<tn-side-panel>`. */
  readonly closed = output<NvmeOfPort | null>();

  // Captured on a successful submit so `closed` can hand the created/updated record
  // back to the side-panel host (and through it to the add-port picker).
  private createdRecord: NvmeOfPort | null = null;

  private readonly ixForm = viewChild(IxFormComponent);

  protected readonly InputType = InputType;

  private existingPort = signal<NvmeOfPort | null>(null);

  protected isNew = computed(() => !this.existingPort());

  protected types$ = this.nvmeOfService.getSupportedTransports().pipe(
    map((supportedTransports) => {
      const allOptions = mapToOptions(nvmeOfTransportTypeLabels, this.translate);

      return allOptions.filter((option) => supportedTransports.includes(option.value));
    }),
  );

  protected readonly helptext = helptextNvmeOf;

  readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected form = this.formBuilder.group({
    addr_trtype: [NvmeOfTransportType.Tcp],
    addr_trsvcid: [null as number | string],
    addr_traddr: ['', Validators.required],
  });

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

  get isTcp(): boolean {
    return this.form.value.addr_trtype === NvmeOfTransportType.Tcp;
  }

  get isFibreChannel(): boolean {
    return this.form.value.addr_trtype === NvmeOfTransportType.FibreChannel;
  }

  get portPlaceholder(): TranslatedString {
    return (this.isFibreChannel ? '' : '4420') as TranslatedString;
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty;
  }

  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  submit(): void {
    this.ixForm()?.submit();
  }

  protected onFormClosed(): void {
    this.closed.emit(this.createdRecord);
  }

  ngOnInit(): void {
    const existingPort = this.port();

    if (existingPort) {
      this.existingPort.set(existingPort);

      this.form.patchValue(existingPort);
    }
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const payload = this.form.getRawValue();

    // Use default port 4420 if no port was specified (only for TCP/RDMA, not for Fibre Channel)
    if (!payload.addr_trsvcid && !this.isFibreChannel) {
      payload.addr_trsvcid = 4420;
    }

    const request$ = this.isNew()
      ? this.api.call('nvmet.port.create', [payload])
      : this.api.call('nvmet.port.update', [this.existingPort().id, payload]);

    return {
      request$,
      successMessage: this.isNew()
        ? this.translate.instant('Port added')
        : this.translate.instant('Port updated'),
      onSuccess: (record) => {
        this.createdRecord = record as NvmeOfPort;
      },
    };
  };
}
