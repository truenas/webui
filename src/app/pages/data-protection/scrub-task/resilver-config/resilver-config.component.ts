import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Weekday } from 'app/enums/weekday.enum';
import helptext from 'app/helptext/storage/resilver/resilver';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, TaskService, WebSocketService } from 'app/services';
import { EntityUtils } from '../../../../modules/entity/utils';
import { CalendarService } from '../../../../services/calendar.service';

@UntilDestroy()
@Component({
  templateUrl: './resilver-config.component.html',
  styleUrls: ['./resilver-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResilverConfigComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    enabled: [true],
    begin: [''],
    end: [''],
    weekday: [[
      Weekday.Monday,
      Weekday.Tuesday,
      Weekday.Wednesday,
      Weekday.Thursday,
      Weekday.Friday,
      Weekday.Saturday,
      Weekday.Sunday,
    ], Validators.required],
  });

  readonly tooltips = {
    enabled: helptext.enabled_tooltip,
    begin: helptext.begin_tooltip,
    end: helptext.end_tooltip,
    weekday: helptext.weekday_tooltip,
  };

  daysOfWeek$ = of(this.calendarService.getWeekdayOptions());
  timeOptions$ = of(this.taskService.getTimeOptions());

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private translate: TranslateService,
    private calendarService: CalendarService,
    private taskService: TaskService,
    private dialogService: DialogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('pool.resilver.config')
      .pipe(untilDestroyed(this))
      .subscribe(
        (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        (error) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          new EntityUtils().handleWsError(null, error, this.dialogService);
        },
      );
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    this.ws.call('pool.resilver.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/data-protection']);
      }, (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      });
  }
}
