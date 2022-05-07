import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormSchedulerConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { Field } from 'app/modules/entity/entity-form/models/field.interface';

@UntilDestroy()
@Component({
  selector: 'form-scheduler',
  templateUrl: './form-scheduler.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormSchedulerComponent implements Field, OnInit {
  config: FormSchedulerConfig;
  group: FormGroup;
  fieldShow: string;

  startTime: string;
  endTime: string;
  formControl: FormControl;

  ngOnInit(): void {
    this.formControl = this.group.controls[this.config.name] as FormControl;

    if (this.config.options && this.config.options.length === 2) {
      this.setTimeBoundaries();
    }

    // This is unnecessary, but mimics the behaviour of old form-scheduler.
    this.formControl.setValue(this.formControl.value);
  }

  private setTimeBoundaries(): void {
    const [startControlName, endControlName] = this.config.options;
    const startControl = this.group.controls[startControlName];
    const endControl = this.group.controls[endControlName];

    startControl.valueChanges.pipe(untilDestroyed(this)).subscribe((startTime) => {
      this.startTime = startTime;
    });
    this.startTime = startControl.value;

    endControl.valueChanges.pipe(untilDestroyed(this)).subscribe((endTime) => {
      this.endTime = endTime;
    });
    this.endTime = endControl.value;
  }
}
