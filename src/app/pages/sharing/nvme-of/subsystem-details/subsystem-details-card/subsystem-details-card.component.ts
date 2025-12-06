import { Clipboard } from '@angular/cdk/clipboard';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnChanges, output, signal, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfSubsystemDetails, UpdateNvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import {
  EditableSaveOnEnterDirective,
} from 'app/modules/forms/editable/editable-save-on-enter/editable-save-on-enter.directive';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import { subsystemDetailsCardElements } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-details-card/subsystem-details-card.elements';

@UntilDestroy()
@Component({
  selector: 'ix-subsystem-details-card',
  templateUrl: './subsystem-details-card.component.html',
  styleUrl: './subsystem-details-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    DetailsItemComponent,
    DetailsTableComponent,
    EditableComponent,
    FormsModule,
    IxInputComponent,
    ReactiveFormsModule,
    IxTextareaComponent,
    EditableSaveOnEnterDirective,
    TestDirective,
    UiSearchDirective,
    AsyncPipe,
  ],
})
export class SubsystemDetailsCardComponent implements OnChanges {
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private nvmeOfStore = inject(NvmeOfStore);
  private nvmeOfService = inject(NvmeOfService);
  private clipboard = inject(Clipboard);
  private auth = inject(AuthService);

  subsystem = input.required<NvmeOfSubsystemDetails>();
  readonly nameUpdated = output<string>();

  protected isSaving = signal(false);

  protected form = this.formBuilder.group({
    name: [''],
    subnqn: [''],
  });

  protected hasRole$ = this.auth.hasRole(Role.SharingNvmeTargetWrite);

  protected readonly searchableElements = subsystemDetailsCardElements;

  ngOnChanges(): void {
    this.form.patchValue({
      name: this.subsystem().name,
      subnqn: this.subsystem().subnqn,
    });
  }

  protected copyNqn(): void {
    const copied = this.clipboard.copy(this.subsystem().subnqn);
    if (copied) {
      this.snackbar.success(this.translate.instant('Subsystem NQN copied to clipboard'));
    }
  }

  protected updateField(field: keyof SubsystemDetailsCardComponent['form']['value']): void {
    if (this.form.value[field] === this.subsystem()[field]) {
      return;
    }

    this.isSaving.set(true);
    const update: UpdateNvmeOfSubsystem = {
      [field]: this.form.value[field],
    };

    this.nvmeOfService.updateSubsystem(this.subsystem(), update)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        untilDestroyed(this),
      )
      .subscribe({
        next: (updated) => {
          this.snackbar.success(this.translate.instant('Subsystem updated.'));
          if (field === 'name' && updated) {
            this.nameUpdated.emit(updated.name);
          }
          this.nvmeOfStore.initialize();
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
