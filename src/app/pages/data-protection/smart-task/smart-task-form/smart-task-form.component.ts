import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { SmartTestType, smartTestTypeLabels } from 'app/enums/smart-test-type.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/data-protection/smart/smart';
import { SmartTestTask } from 'app/interfaces/smart-test.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  crontabToScheduleWithoutMinutes,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './smart-task-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartTaskFormComponent implements OnInit {
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
    type: [null as SmartTestType, Validators.required],
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

  constructor(
    private fb: FormBuilder,
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
    private errorHandler: FormErrorHandlerService,
    private slideInRef: IxSlideInRef<SmartTaskFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingTest: SmartTestTask,
  ) {}

  ngOnInit(): void {
    if (this.editingTest) {
      this.setTestForEdit();
    }
  }

  setTestForEdit(): void {
    this.form.patchValue({
      ...this.editingTest,
      schedule: scheduleToCrontab(this.editingTest.schedule),
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
        if (this.isNew) {
          this.snackbar.success(this.translate.instant('Task created'));
        } else {
          this.snackbar.success(this.translate.instant('Task updated'));
        }
        this.isLoading = false;
        this.slideInRef.close(true);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
