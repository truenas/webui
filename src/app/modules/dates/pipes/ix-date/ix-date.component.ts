import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { getMachineTime, LocaleService } from 'app/modules/language/locale.service';

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
  // cycle — only when `date` actually changes. Reads the `timezone` property and
  // converts via the shared pure `getMachineTime` (rather than the mockable
  // `localeService.toMachineTime`) so the component stays unit-testable with a
  // plain `{ timezone }` LocaleService stub.
  readonly machineTime = computed(() => getMachineTime(this.date(), this.localeService.timezone));

  readonly isTimezoneDifference = computed(() => {
    const machineTime = this.machineTime().getTime();
    const date = this.date();
    const dateMs = typeof date === 'number' ? date : date.getTime();
    return machineTime !== dateMs;
  });
}
