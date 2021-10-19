import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { TunableType } from 'app/enums/tunable-type.enum';
import { helptext_system_tunable as helptext } from 'app/helptext/system/tunable';
import { Tunable, TunableUpdate } from 'app/interfaces/tunable.interface';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

@UntilDestroy()
@Component({
  templateUrl: './tunable-form.component.html',
  styleUrls: ['./tunable-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TunableFormComponent {
  private editingTunable: Tunable;
  get isNew(): boolean {
    return !this.editingTunable;
  }

  isFormLoading = false;

  form = this.fb.group({
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

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private modalService: IxModalService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
  ) {}

  setTunableForEdit(tunable: Tunable): void {
    this.editingTunable = tunable;
    if (!this.isNew) {
      this.form.patchValue(this.editingTunable);
    }
  }

  onSubmit(): void {
    const values: TunableUpdate = {
      ...this.form.value,
      type: TunableType.Sysctl,
    };

    this.isFormLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('tunable.create', [values]);
    } else {
      request$ = this.ws.call('tunable.update', [
        this.editingTunable.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.modalService.close();
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }
}
