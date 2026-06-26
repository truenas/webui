import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, output, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, ValidatorFn, AbstractControl, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
  TnSelectComponent, TnTooltipDirective,
} from '@truenas/ui-components';
import { omit } from 'lodash-es';
import { finalize, switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-host-form',
  templateUrl: './host-form.component.html',
  styleUrls: ['./host-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    TranslateModule,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnButtonComponent,
    TnSelectComponent,
    EditableComponent,
    DetailsTableComponent,
    DetailsItemComponent,
    TnTooltipDirective,
    AsyncPipe,
  ],
})
export class HostFormComponent implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  // Present only when opened via the legacy SlideIn host; absent inside a
  // `<tn-side-panel>` (the go-forward host), where edit data arrives via the
  // `host` input and the created record is emitted through `closed`.
  private slideInRef = inject<SlideInRef<NvmeOfHost | undefined, NvmeOfHost | null>>(SlideInRef, { optional: true });
  private destroyRef = inject(DestroyRef);

  /** Edit data supplied by a `<tn-side-panel>` host (legacy host uses `slideInRef.getData()`). */
  readonly host = input<NvmeOfHost | undefined>(undefined);

  /** Created/updated record emitted on a successful submit when hosted in a `<tn-side-panel>`. */
  readonly closed = output<NvmeOfHost | null>();

  // Captured on a successful submit so `closed` can hand the created/updated record
  // back to the side-panel host (and through it to the add-host picker).
  private createdRecord: NvmeOfHost | null = null;

  private readonly ixForm = viewChild(IxFormComponent);

  private existingHost = signal<NvmeOfHost | null>(null);

  protected isNew = computed(() => !this.existingHost());

  protected hashOptions$ = this.api.call('nvmet.host.dhchap_hash_choices').pipe(singleArrayToOptions());
  protected dhGroupOptions$ = this.api.call('nvmet.host.dhchap_dhgroup_choices').pipe(singleArrayToOptions());

  private nqnValidator(): ValidatorFn {
    return (control: AbstractControl): Record<string, { message: string }> | null => {
      const value = control.value as string;

      if (!value) {
        return null; // Let required validator handle empty values
      }

      if (!value.startsWith('nqn.')) {
        return {
          nqnFormat: {
            message: this.translate.instant('Host NQN must start with "nqn." followed by a date and domain (e.g., nqn.2014-08.org.nvmexpress)'),
          },
        };
      }

      if (value.length < 11) {
        return {
          nqnMinLength: {
            message: this.translate.instant('Host NQN must be at least 11 characters long'),
          },
        };
      }

      if (value.length > 223) {
        return {
          nqnMaxLength: {
            message: this.translate.instant('Host NQN cannot exceed 223 characters'),
          },
        };
      }

      // Check for basic format: nqn.YYYY-MM.domain
      const nqnPattern = /^nqn\.\d{4}-\d{2}\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*(:.*)?$/;
      if (!nqnPattern.test(value)) {
        return {
          nqnInvalid: {
            message: this.translate.instant('Invalid NQN format. Must be: nqn.YYYY-MM.reverse-domain-name (e.g., nqn.2014-08.com.example or nqn.2014-08.org.nvmexpress:host1)'),
          },
        };
      }

      return null;
    };
  }

  protected form = this.formBuilder.group({
    hostnqn: ['', [
      Validators.required,
      this.nqnValidator(),
    ]],
    description: [''],

    requireHostAuthentication: [false],
    dhchap_hash: ['SHA-256'],
    dhchap_dhgroup: ['4096-BIT' as string | null],
    dhchap_key: [null as string | null],
    dhchap_ctrl_key: [null as string | null],

    addDhKeyExchange: [false],
  });

  protected isGeneratingHostKey = signal(false);
  protected isGeneratingTrueNasKey = signal(false);

  readonly requiredRoles = [Role.SharingNvmeTargetWrite];

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
    const existingHost = this.slideInRef?.getData() ?? this.host();

    if (existingHost) {
      this.existingHost.set(existingHost);

      this.form.patchValue({
        ...existingHost,
        requireHostAuthentication: Boolean(existingHost.dhchap_key),
        addDhKeyExchange: Boolean(existingHost.dhchap_dhgroup),
      });
    }
  }

  protected get hasNqn(): boolean {
    return Boolean(this.form.value.hostnqn);
  }

  protected generateHostKey(): void {
    this.isGeneratingHostKey.set(true);
    this.api.call('nvmet.host.generate_key', [this.form.value.dhchap_hash, this.form.value.hostnqn])
      .pipe(
        finalize(() => this.isGeneratingHostKey.set(false)),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((key) => {
        this.form.patchValue({
          dhchap_key: key,
        });
      });
  }

  protected generateTrueNasKey(): void {
    this.isGeneratingTrueNasKey.set(true);
    this.api.call('nvmet.global.config').pipe(
      switchMap((config) => {
        return this.api.call('nvmet.host.generate_key', [this.form.value.dhchap_hash, config.basenqn]);
      }),
    )
      .pipe(
        finalize(() => this.isGeneratingTrueNasKey.set(false)),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((key) => {
        this.form.patchValue({
          dhchap_ctrl_key: key,
        });
      });
  }

  protected handleSubmit = (_: FormSubmitEvent): SubmitResult => {
    const value = this.form.getRawValue();
    const payload = {
      ...omit(value, 'requireHostAuthentication', 'addDhKeyExchange'),
      dhchap_key: value.requireHostAuthentication ? value.dhchap_key : null,
      dhchap_dhgroup: (value.requireHostAuthentication && value.addDhKeyExchange) ? value.dhchap_dhgroup : null,
    };

    const request$ = this.isNew()
      ? this.api.call('nvmet.host.create', [payload])
      : this.api.call('nvmet.host.update', [this.existingHost().id, payload]);

    return {
      request$,
      successMessage: this.isNew()
        ? this.translate.instant('Host added')
        : this.translate.instant('Host updated'),
      onSuccess: (record) => {
        this.createdRecord = record as NvmeOfHost;
      },
    };
  };

  protected readonly helptext = helptextNvmeOf;
}
