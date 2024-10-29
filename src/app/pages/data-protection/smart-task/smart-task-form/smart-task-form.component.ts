import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SmartTestType, smartTestTypeLabels } from 'app/enums/smart-test-type.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSmart } from 'app/helptext/data-protection/smart/smart';
import { SmartTestTask } from 'app/interfaces/smart-test.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SchedulerComponent } from 'app/modules/scheduler/components/scheduler/scheduler.component';
import {
  crontabToScheduleWithoutMinutes,
} from 'app/modules/scheduler/utils/crontab-to-schedule.utils';
import { scheduleToCrontab } from 'app/modules/scheduler/utils/schedule-to-crontab.utils';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-smart-task-form',
  templateUrl: './smart-task-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    IxInputComponent,
    SchedulerComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SmartTaskFormComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];

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
    disks: helptextSmart.smarttest_disks_tooltip,
    type: helptextSmart.smarttest_type_tooltip,
    desc: helptextSmart.smarttest_desc_tooltip,
    schedule: helptextSmart.smarttest_picker_tooltip,
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
    private slideInRef: SlideInRef<SmartTaskFormComponent>,
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
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
