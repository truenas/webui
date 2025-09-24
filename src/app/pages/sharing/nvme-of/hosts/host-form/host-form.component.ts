import { ChangeDetectionStrategy, Component, computed, OnInit, signal, inject } from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { omit } from 'lodash-es';
import { finalize, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-host-form',
  templateUrl: './host-form.component.html',
  styleUrls: ['./host-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IxFieldsetComponent,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    TranslateModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    ReactiveFormsModule,
    IxCheckboxComponent,
    IxTextareaComponent,
    IxSelectComponent,
    EditableComponent,
    DetailsTableComponent,
    DetailsItemComponent,
    MatTooltip,
    RequiresRolesDirective,
  ],
})
export class HostFormComponent implements OnInit {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  slideInRef = inject<SlideInRef<NvmeOfHost | undefined, NvmeOfHost | null>>(SlideInRef);

  protected isLoading = signal(false);

  private existingHost = signal<NvmeOfHost | null>(null);

  protected isNew = computed(() => !this.existingHost());

  protected hashOptions$ = this.api.call('nvmet.host.dhchap_hash_choices').pipe(singleArrayToOptions());
  protected dhGroupOptions$ = this.api.call('nvmet.host.dhchap_dhgroup_choices').pipe(singleArrayToOptions());

  protected form = this.formBuilder.group({
    hostnqn: ['', Validators.required],

    requireHostAuthentication: [false],
    dhchap_hash: ['SHA-256'],
    dhchap_dhgroup: ['4096-BIT' as string | null],
    dhchap_key: [null as string | null],
    dhchap_ctrl_key: [null as string | null],

    addDhKeyExchange: [false],
  });

  protected isGeneratingHostKey = signal(false);
  protected isGeneratingTrueNasKey = signal(false);

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  ngOnInit(): void {
    const existingHost = this.slideInRef.getData();

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
        untilDestroyed(this),
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
        untilDestroyed(this),
      )
      .subscribe((key) => {
        this.form.patchValue({
          dhchap_ctrl_key: key,
        });
      });
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const value = this.form.getRawValue();
    const payload = {
      ...omit(value, 'requireHostAuthentication', 'addDhKeyExchange'),
      dhchap_key: value.requireHostAuthentication ? value.dhchap_key : null,
      dhchap_dhgroup: (value.requireHostAuthentication && value.addDhKeyExchange) ? value.dhchap_dhgroup : null,
    };

    const request$ = this.isNew()
      ? this.api.call('nvmet.host.create', [payload])
      : this.api.call('nvmet.host.update', [this.existingHost().id, payload]);

    request$.pipe(
      finalize(() => this.isLoading.set(false)),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe({
      next: (savedHost) => {
        this.slideInRef.close({
          response: savedHost,
        });
      },
      error: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  protected readonly helptext = helptextNvmeOf;
}
