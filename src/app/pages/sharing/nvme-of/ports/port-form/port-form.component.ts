import { ChangeDetectionStrategy, Component, computed, OnInit, signal, inject } from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  finalize, merge, of, switchMap,
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
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';

@UntilDestroy()
@Component({
  selector: 'ix-port-form',
  templateUrl: './port-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IxFieldsetComponent,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    TranslateModule,
    ReactiveFormsModule,
    IxSelectComponent,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
  ],
})
export class PortFormComponent implements OnInit {
  private api = inject(ApiService);
  private nvmeOfService = inject(NvmeOfService);
  private formBuilder = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private formErrorHandler = inject(FormErrorHandlerService);
  slideInRef = inject<SlideInRef<NvmeOfPort | undefined, NvmeOfPort | null>>(SlideInRef);

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

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

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

  ngOnInit(): void {
    const existingPort = this.slideInRef.getData();

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
      untilDestroyed(this),
    ).subscribe({
      next: (port) => {
        this.slideInRef.close({
          response: port,
        });
      },
      error: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
