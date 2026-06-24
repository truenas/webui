import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemTunable as helptext } from 'app/helptext/system/tunable';
import { Job } from 'app/interfaces/job.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-tunable-form',
  templateUrl: './tunable-form.component.html',
  styleUrls: ['./tunable-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class TunableFormComponent extends SidePanelForm implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemTunableWrite];

  get isNew(): boolean {
    return !this.editingTunable;
  }

  get title(): string {
    if (this.isNew) {
      return this.translate.instant('Add Tunable');
    }
    const type = this.editingTunable?.type?.toUpperCase() || '';
    return this.translate.instant('Edit Tunable ({type})', { type });
  }

  protected isFormLoading = signal(false);

  form = this.fb.nonNullable.group({
    type: [''],
    var: ['', Validators.required], // TODO Add pattern and explanation for it
    value: ['', Validators.required],
    comment: [''],
    enabled: [true],
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  readonly tooltips = {
    var: helptext.varTooltip,
    value: helptext.valueTooltip,
  };

  private editingTunable: Tunable;

  /**
   * Row to edit when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to
   * carry data). Absent for Add, and unused in the legacy SlideIn host (which
   * supplies the row via `slideInRef.getData()`).
   */
  readonly editTunable = input<Tunable | undefined>(undefined);

  protected types$ = this.api.call('tunable.tunable_type_choices').pipe(
    choicesToOptions(),
  );

  ngOnInit(): void {
    this.editingTunable = this.slideInRef
      ? this.slideInRef.getData() as Tunable | undefined
      : this.editTunable();
    if (this.editingTunable) {
      this.setTunableForEdit();
    }
  }

  private setTunableForEdit(): void {
    this.form.patchValue(this.editingTunable);
    this.form.controls.type.disable();
    this.form.controls.var.disable();
  }

  protected onSubmit(): void {
    this.isFormLoading.set(true);

    const request$ = this.isNew ? this.createTunable() : this.updateTunable();
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      complete: () => {
        this.isFormLoading.set(false);
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
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
