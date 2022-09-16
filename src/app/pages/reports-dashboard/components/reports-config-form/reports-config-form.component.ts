import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import {
  filter, first, map, switchMap, tap,
} from 'rxjs/operators';
import { helptext } from 'app/helptext/system/reporting';
import { ReportingConfigUpdate } from 'app/interfaces/reporting.interface';
import { rangeValidator } from 'app/modules/entity/entity-form/validators/range-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './reports-config-form.component.html',
  styleUrls: ['./reports-config-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsConfigFormComponent implements OnInit {
  isFormLoading = true;
  tooltips = {
    cpu_in_percentage: helptext.cpu_in_percentage_tooltip,
    graphite_separateinstances: helptext.graphite_separateinstances_tooltip,
    graphite: helptext.graphite_tooltip,
    graph_age: helptext.graph_age_tooltip,
    graph_points: helptext.graph_points_tooltip,
  };
  userValues: ReportingConfigUpdate;
  readonly defaultValues: ReportingConfigUpdate = {
    cpu_in_percentage: false,
    graphite_separateinstances: false,
    graphite: '',
    graph_age: 12,
    graph_points: 1200,
  };
  form = this.fb.group({
    cpu_in_percentage: [this.defaultValues.cpu_in_percentage, []],
    graphite_separateinstances: [this.defaultValues.graphite_separateinstances, []],
    graphite: [this.defaultValues.graphite, []],
    graph_age: [this.defaultValues.graph_age, [Validators.required, rangeValidator(1, 60)]],
    graph_points: [this.defaultValues.graph_points, [Validators.required, rangeValidator(1, 4096)]],
  });

  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private dialog: DialogService,
    private errorHandler: FormErrorHandlerService,
    private slideIn: IxSlideInService,
  ) { }

  ngOnInit(): void {
    this.isFormLoading = false;
    this.ws.call('reporting.config').pipe(
      untilDestroyed(this),
    ).subscribe((config) => {
      delete config.id;
      this.userValues = config;
      this.form.patchValue(config);
    });
  }

  onReset(): void {
    this.form.setValue(this.defaultValues);
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.confirmClearReportHistoryIfNeeded().pipe(
      tap(() => {
        this.isFormLoading = true;
        this.cdr.markForCheck();
      }),
      switchMap((body) => this.ws.call('reporting.update', [body])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideIn.close();
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  private confirmClearReportHistoryIfNeeded(): Observable<ReportingConfigUpdate> {
    return this.form.value$.pipe(
      first(),
      switchMap((body: ReportingConfigUpdate) => {
        if (body.graph_age !== this.userValues.graph_age || body.graph_points !== this.userValues.graph_points) {
          return this.dialog.confirm({
            title: helptext.dialog.title,
            message: helptext.dialog.message,
            buttonMsg: helptext.dialog.action,
          }).pipe(
            filter(Boolean),
            map(() => ({ confirm_rrd_destroy: true, ...body })),
          );
        }

        return of(body);
      }),
    );
  }
}
