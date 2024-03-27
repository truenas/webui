import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { utcToZonedTime } from 'date-fns-tz';

@Component({
  templateUrl: './ix-date.component.html',
  selector: 'ix-date',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxDateComponent {
  @Input() date: number | Date;
  @Input() dateFormat: string = null;
  @Input() timeFormat: string = null;
  @Input() machineTimezone: string;

  get serverTime(): Date {
    return this.machineTimezone ? utcToZonedTime(this.date, this.machineTimezone) : null;
  }

  get isTimezoneDifference(): boolean {
    return this.serverTime < this.date || this.serverTime > this.date;
  }
}
