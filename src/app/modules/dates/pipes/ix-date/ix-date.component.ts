import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
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
  private readonly localeService = inject(LocaleService);

  /** Date must be in browser timezone */
  readonly date = input.required<number | Date>();

  // computed() memoizes per-input so a snapshot list with hundreds of ix-date
  // cells under OnPush doesn't re-run the conversion on every change-detection
  // cycle — only when `date` actually changes.
  readonly machineTime = computed(() => this.localeService.toMachineTime(this.date()));

  readonly isTimezoneDifference = computed(() => {
    const machineTime = this.machineTime();
    const date = this.date();
    return machineTime < date || machineTime > date;
  });
}
