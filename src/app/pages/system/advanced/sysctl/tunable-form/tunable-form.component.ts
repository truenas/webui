import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemTunable as helptext } from 'app/helptext/system/tunable';
import { Job } from 'app/interfaces/job.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
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

@UntilDestroy()
@Component({
  selector: 'ix-tunable-form',
  templateUrl: './tunable-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxTextareaComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    IxSelectComponent,
  ],
})
export class TunableFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.SystemTunableWrite];

  get isNew(): boolean {
    return !this.editingTunable;
  }

  get title(): string {
    return this.isNew ? this.translate.instant('Add Sysctl') : this.translate.instant('Edit Sysctl');
  }

  isFormLoading = false;

  form = this.fb.nonNullable.group({
    type: [''],
    var: ['', Validators.required], // TODO Add pattern and explanation for it
    value: ['', Validators.required],
    comment: [''],
    enabled: [true],
  });

  readonly tooltips = {
    var: helptext.var.tooltip,
    value: helptext.value.tooltip,
    comment: helptext.description.tooltip,
    enabled: helptext.enabled.tooltip,
  };

  private editingTunable: Tunable;

  protected types$ = this.api.call('tunable.tunable_type_choices').pipe(
    choicesToOptions(),
  );

  constructor(
    private api: ApiService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    public slideInRef: SlideInRef<Tunable | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    const tunable = this.slideInRef.getData();
    if (tunable) {
      this.editingTunable = tunable;
    }
  }

  ngOnInit(): void {
    if (this.editingTunable) {
      this.setTunableForEdit();
    }
  }

  setTunableForEdit(): void {
    this.form.patchValue(this.editingTunable);
    this.form.controls.type.disable();
    this.form.controls.var.disable();
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const request$ = this.isNew ? this.createTunable() : this.updateTunable();
    request$.pipe(untilDestroyed(this)).subscribe({
      complete: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.errorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private createTunable(): Observable<Job<Tunable>> {
    return this.api.job('tunable.create', [this.form.getRawValue()]);
  }

  private updateTunable(): Observable<Job<Tunable>> {
    const values = this.form.getRawValue();
    return this.api.job('tunable.update', [
      this.editingTunable.id,
      {
        comment: values.comment,
        enabled: values.enabled,
        value: values.value,
      },
    ]);
  }
}
