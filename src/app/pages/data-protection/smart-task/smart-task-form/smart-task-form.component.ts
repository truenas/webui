import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { SmartTestType, smartTestTypeLabels } from 'app/enums/smart-test-type.enum';
import { choicesToOptions, mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/data-protection/smart/smart';
import { SmartTestTask } from 'app/interfaces/smart-test.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  crontabToScheduleWithoutMinutes,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './smart-task-form.component.html',
  styleUrls: ['./smart-task-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartTaskFormComponent {
  get isNew(): boolean {
    return !this.editingTest;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add S.M.A.R.T. Test')
      : this.translate.instant('Edit S.M.A.R.T. Test');
  }

  form = this.fb.group({
    disks: [[] as string[]],
    all_disks: [false],
    type: [null as SmartTestType],
    desc: [''],
    schedule: ['', Validators.required],
  });

  isLoading = false;

  isAllDisksSelected$ = this.form.select((values) => values.all_disks);

  readonly tooltips = {
    disks: helptext.smarttest_disks_tooltip,
    type: helptext.smarttest_type_tooltip,
    desc: helptext.smarttest_desc_tooltip,
    schedule: helptext.smarttest_picker_tooltip,
  };

  readonly diskOptions$ = this.ws.call('smart.test.disk_choices').pipe(choicesToOptions());
  readonly typeOptions$ = of(mapToOptions(smartTestTypeLabels, this.translate));

  private editingTest: SmartTestTask;

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
  ) {}

  setTestForEdit(test: SmartTestTask): void {
    this.editingTest = test;
    this.form.patchValue({
      ...test,
      schedule: scheduleToCrontab(test.schedule),
    });
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
      disks: this.form.value.all_disks ? [] : this.form.value.disks,
      schedule: crontabToScheduleWithoutMinutes(this.form.value.schedule),
    };

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('smart.test.create', [values]);
    } else {
      request$ = this.ws.call('smart.test.update', [
        this.editingTest.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInService.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
