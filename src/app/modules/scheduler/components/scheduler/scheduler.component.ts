import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import {
  ControlValueAccessor, NgControl, ReactiveFormsModule, FormsModule,
} from '@angular/forms';
import { MatOptionSelectionChange, MatOption } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelect } from '@angular/material/select';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import {
  SchedulerModalConfig,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal-config.interface';
import {
  SchedulerModalComponent,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal.component';
import { CrontabExplanationPipe } from 'app/modules/scheduler/pipes/crontab-explanation.pipe';
import { CronPresetValue, getDefaultCrontabPresets } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatSelect,
    ReactiveFormsModule,
    TestDirective,
    FormsModule,
    MatOption,
    IxErrorsComponent,
    TranslateModule,
    CrontabExplanationPipe,
  ],
})
export class SchedulerComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required = false;
  @Input() hideMinutes = false;

  protected readonly customValue = 'custom';
  /**
   * Optional extra time boundaries for every day, i.e. "15:30" - "23:30"
   */
  @Input() startTime: string;
  @Input() endTime: string;

  readonly defaultPresets = getDefaultCrontabPresets(this.translate);

  isDisabled = false;
  crontab: string;
  customCrontab: string;

  onTouched: () => void;
  onChange: (crontab: string) => void;

  constructor(
    public controlDirective: NgControl,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
    this.controlDirective.valueAccessor = this;
  }

  registerOnChange(onChange: (crontab: string) => void): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: () => void): void {
    this.onTouched = onTouched;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  writeValue(crontab: string): void {
    this.crontab = crontab;
    const isDefaultPreset = this.defaultPresets.some((preset) => preset.value === crontab);
    if (!isDefaultPreset && crontab) {
      this.customCrontab = crontab;
    }

    this.cdr.markForCheck();
  }

  onCustomOptionSelected(previousValue: string): void {
    this.matDialog.open(SchedulerModalComponent, {
      data: {
        startTime: this.startTime,
        endTime: this.endTime,
        hideMinutes: this.hideMinutes,
        crontab: previousValue,
      } as SchedulerModalConfig,
    })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((newCrontab: string) => {
        if (Object.values(CronPresetValue).includes(newCrontab as CronPresetValue)) {
          this.customCrontab = undefined;
        } else {
          this.customCrontab = newCrontab;
        }
        this.cdr.markForCheck();
        this.crontab = newCrontab;
        this.onChange(newCrontab);
        this.cdr.markForCheck();
      });
  }

  onOptionSelectionChange(value: MatOptionSelectionChange<string>): void {
    if (!value.source.selected) {
      return;
    }
    if (!value.isUserInput) {
      return;
    }
    const selection = value.source.value as CronPresetValue;
    if (selection.toString() === this.customValue) {
      this.onCustomOptionSelected(undefined);
    } else if (!Object.values(CronPresetValue).includes(selection)) {
      this.onCustomOptionSelected(selection);
    } else {
      this.crontab = selection;
      this.customCrontab = undefined;
      this.onChange(selection);
      this.cdr.markForCheck();
    }
  }
}
