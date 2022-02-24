import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input,
} from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import {
  SchedulerModalConfig,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal-config.interface';
import {
  SchedulerModalComponent,
} from 'app/modules/scheduler/components/scheduler-modal/scheduler-modal.component';
import { getDefaultCrontabPresets } from 'app/modules/scheduler/utils/get-default-crontab-presets.utils';

@UntilDestroy()
@Component({
  selector: 'ix-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulerComponent implements ControlValueAccessor {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() required = false;
  @Input() hideMinutes = false;

  /**
   * Optional extra time boundaries for every day, i.e. "15:30" - "23:30"
   */
  @Input() beginTime: string;
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

  onCustomOptionSelected(): void {
    this.matDialog.open(SchedulerModalComponent, {
      data: {
        beginTime: this.beginTime,
        endTime: this.endTime,
        hideMinutes: this.hideMinutes,
        crontab: this.customCrontab,
      } as SchedulerModalConfig,
    })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((newCrontab: string) => {
        this.crontab = newCrontab;
        this.onChange(newCrontab);
        this.customCrontab = newCrontab;
      });
  }
}
