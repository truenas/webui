import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { TunableType } from 'app/enums/tunable-type.enum';
import { helptextSystemTunable as helptext } from 'app/helptext/system/tunable';
import { Tunable } from 'app/interfaces/tunable.interface';
import { ErrorHandlerService } from 'app/modules/ix-forms/services/error-handler.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './tunable-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TunableFormComponent {
  private editingTunable: Tunable;
  get isNew(): boolean {
    return !this.editingTunable;
  }
  get title(): string {
    return this.isNew ? this.translate.instant('Add Sysctl') : this.translate.instant('Edit Sysctl');
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
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
  ) {}

  setTunableForEdit(tunable: Tunable): void {
    this.editingTunable = tunable;
    this.form.patchValue(this.editingTunable);
    this.form.controls.var.disable();
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const request$ = this.isNew ? this.createTunable() : this.updateTunable();
    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private createTunable(): Observable<Tunable> {
    return this.ws.call('tunable.create', [{
      ...this.form.getRawValue(),
      type: TunableType.Sysctl,
    }]);
  }

  private updateTunable(): Observable<Tunable> {
    const values = this.form.value;
    return this.ws.call('tunable.update', [
      this.editingTunable.id,
      {
        comment: values.comment,
        enabled: values.enabled,
        value: values.value,
      },
    ]);
  }
}
