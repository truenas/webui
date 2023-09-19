import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { LifetimeUnit } from 'app/enums/lifetime-unit.enum';
import { RetentionPolicy } from 'app/enums/retention-policy.enum';
import { ScheduleMethod } from 'app/enums/schedule-method.enum';
import helptext from 'app/helptext/data-protection/replication/replication-wizard';
import { Option } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { CronPresetValue } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';

@UntilDestroy()
@Component({
  selector: 'ix-replication-when',
  templateUrl: './replication-when.component.html',
  styleUrls: ['./replication-when.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplicationWhenComponent implements OnInit, OnChanges, SummaryProvider {
  @Input() isCustomRetentionVisible = true;
  @Output() save = new EventEmitter<void>();

  form = this.formBuilder.group({
    schedule_method: [ScheduleMethod.Cron, [Validators.required]],
    schedule_picker: [CronPresetValue.Daily, [Validators.required]],
    readonly: [true],
    retention_policy: [RetentionPolicy.Source, [Validators.required]],
    lifetime_value: [2, [Validators.required]],
    lifetime_unit: [LifetimeUnit.Week, [Validators.required]],
  });

  readonly helptext = helptext;

  scheduleMethodOptions$ = of([
    { label: this.translate.instant('Run On a Schedule'), value: ScheduleMethod.Cron },
    { label: this.translate.instant('Run Once'), value: ScheduleMethod.Once },
  ]);

  defaultRetentionPolicyOptions = [
    { label: this.translate.instant('Same as Source'), value: RetentionPolicy.Source },
    { label: this.translate.instant('Never Delete'), value: RetentionPolicy.None },
  ];

  lifetimeUnitOptions$ = of([
    { label: this.translate.instant('Hours'), value: LifetimeUnit.Hour },
    { label: this.translate.instant('Days'), value: LifetimeUnit.Day },
    { label: this.translate.instant('Weeks'), value: LifetimeUnit.Week },
    { label: this.translate.instant('Months'), value: LifetimeUnit.Month },
    { label: this.translate.instant('Years'), value: LifetimeUnit.Year },
  ]);

  get retentionPolicyOptions$(): Observable<Option[]> {
    return this.isCustomRetentionVisible ? of([
      ...this.defaultRetentionPolicyOptions,
      { label: this.translate.instant('Custom'), value: RetentionPolicy.Custom },
    ]) : of(this.defaultRetentionPolicyOptions);
  }

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.isCustomRetentionVisible && !changes.isCustomRetentionVisible.currentValue) {
      this.form.controls.retention_policy.setValue(RetentionPolicy.Source);
    }
  }

  ngOnInit(): void {
    this.form.controls.readonly.disable();
    this.form.controls.lifetime_value.disable();
    this.form.controls.lifetime_unit.disable();
    this.form.controls.schedule_method.valueChanges.pipe(untilDestroyed(this)).subscribe((method) => {
      if (method === ScheduleMethod.Cron) {
        this.form.controls.schedule_picker.enable();
        this.form.controls.readonly.disable();
      } else {
        this.form.controls.schedule_picker.disable();
        this.form.controls.readonly.enable();
      }
    });
    this.form.controls.retention_policy.valueChanges.pipe(untilDestroyed(this)).subscribe((policy) => {
      if (policy === RetentionPolicy.Custom) {
        this.form.controls.lifetime_value.enable();
        this.form.controls.lifetime_unit.enable();
      } else {
        this.form.controls.lifetime_value.disable();
        this.form.controls.lifetime_unit.disable();
      }
    });
  }

  getSummary(): SummarySection {
    const summary: SummarySection = [];
    const values = this.form.value;

    if (values.schedule_method === ScheduleMethod.Cron) {
      summary.push({
        label: this.translate.instant(helptext.schedule_method_placeholder),
        value: this.translate.instant('Run On a Schedule'),
      });
    } else {
      summary.push({
        label: this.translate.instant(helptext.schedule_method_placeholder),
        value: this.translate.instant('Run Once'),
      });
    }

    return summary;
  }

  getPayload(): ReplicationWhenComponent['form']['value'] {
    return this.form.value;
  }

  onSave(): void {
    this.save.emit();
  }
}
