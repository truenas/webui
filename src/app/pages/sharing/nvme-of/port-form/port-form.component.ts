import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal,
} from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  finalize, of, share, switchMap,
} from 'rxjs';
import { startWith } from 'rxjs/operators';
import { NvmeOfTransportType, nvmeOfTransportTypeLabels } from 'app/enums/nvme-of.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfPort } from 'app/interfaces/nvme-of.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-port-form',
  styleUrls: ['./port-form.component.scss'],
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
  ],
})
export class PortFormComponent implements OnInit {
  protected isLoading = signal(false);

  private existingPort = signal<NvmeOfPort | null>(null);

  protected isNew = computed(() => !this.existingPort());

  // TODO: Limit by what's available in the system and hide control if not needed.
  protected types$ = of(mapToOptions(nvmeOfTransportTypeLabels, this.translate));
  protected readonly helptext = helptextNvmeOf;

  protected form = this.formBuilder.group({
    addr_trtype: [NvmeOfTransportType.Tcp],
    addr_trsvcid: [null as number | string, Validators.required],
    addr_traddr: ['', Validators.required],
  });

  protected addresses$ = this.form.controls.addr_trtype.valueChanges.pipe(
    startWith(this.form.value.addr_trtype),
    switchMap((type) => {
      return this.api.call('nvmet.port.transport_address_choices', [type]);
    }),
    choicesToOptions(),
    share(),
  );

  constructor(
    private api: ApiService,
    private formBuilder: NonNullableFormBuilder,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    public slideInRef: SlideInRef<NvmeOfPort | undefined, boolean>,
  ) {}

  get isTcp(): boolean {
    return this.form.value.addr_trtype === NvmeOfTransportType.Tcp;
  }

  get isFibreChannel(): boolean {
    return this.form.value.addr_trtype === NvmeOfTransportType.FibreChannel;
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

    const request$ = this.isNew()
      ? this.api.call('nvmet.port.create', [payload])
      : this.api.call('nvmet.port.update', [this.existingPort().id, payload]);

    request$.pipe(
      finalize(() => this.isLoading.set(false)),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(
        this.isNew()
          ? this.translate.instant('Port Created')
          : this.translate.instant('Port Updated'),
      );

      this.slideInRef.close({
        response: true,
        error: null,
      });
    });
  }
}
