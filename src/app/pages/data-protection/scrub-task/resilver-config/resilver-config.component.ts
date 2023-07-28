import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Weekday } from 'app/enums/weekday.enum';
import helptext from 'app/helptext/storage/resilver/resilver';
import { ResilverConfigUpdate } from 'app/interfaces/resilver-config.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CalendarService } from 'app/services/calendar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { TaskService } from 'app/services/task.service';
import { WebSocketService } from 'app/services/ws.service';

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
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private calendarService: CalendarService,
    private taskService: TaskService,
    private dialogService: DialogService,
    private router: Router,
    private snackbar: SnackbarService,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('pool.resilver.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue(config);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isFormLoading = true;
    this.ws.call('pool.resilver.update', [values as ResilverConfigUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Resilver configuration saved'));
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.router.navigate(['/data-protection']);
        },
        error: (error) => {
          this.isFormLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
