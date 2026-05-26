import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { LocaleService } from 'app/modules/language/locale.service';

@Component({
  selector: 'ix-date',
  styleUrls: ['./ix-date.component.scss'],
  templateUrl: './ix-date.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltip,
    TranslateModule,
    FormatDateTimePipe,
  ],
})
export class IxDateComponent {
  private localeService = inject(LocaleService);

  /** Date must be in browser timezone */
  readonly date = input.required<number | Date>();

  get machineTime(): Date {
    return this.localeService.toMachineTime(this.date());
  }

  get isTimezoneDifference(): boolean {
    return this.machineTime < this.date() || this.machineTime > this.date();
  }
}
