import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { TunableType } from 'app/enums/tunable-type.enum';
import { helptextSystemTunable as helptext } from 'app/helptext/system/tunable';
import { Job } from 'app/interfaces/job.interface';
import { Tunable } from 'app/interfaces/tunable.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './tunable-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TunableFormComponent implements OnInit {
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
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private slideInRef: IxSlideInRef<TunableFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingTunable: Tunable,
  ) {}

  ngOnInit(): void {
    if (this.editingTunable) {
      this.setTunableForEdit();
    }
  }

  setTunableForEdit(): void {
    this.form.patchValue(this.editingTunable);
    this.form.controls.var.disable();
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const request$ = this.isNew ? this.createTunable() : this.updateTunable();
    request$.pipe(untilDestroyed(this)).subscribe({
      complete: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close(true);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private createTunable(): Observable<Job<Tunable>> {
    return this.ws.job('tunable.create', [{
      ...this.form.getRawValue(),
      type: TunableType.Sysctl,
    }]);
  }

  private updateTunable(): Observable<Job<Tunable>> {
    const values = this.form.value;
    return this.ws.job('tunable.update', [
      this.editingTunable.id,
      {
        comment: values.comment,
        enabled: values.enabled,
        value: values.value,
      },
    ]);
  }
}
