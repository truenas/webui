import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { formatDuration } from 'date-fns';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { secondsToDuration } from 'app/helpers/time.helpers';
import { PoolScanUpdate } from 'app/interfaces/pool.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';

@Component({
  selector: 'ix-last-pool-scan',
  templateUrl: './last-pool-scan.component.html',
  styleUrls: ['./last-pool-scan.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    DecimalPipe,
    FormatDateTimePipe,
  ],
})
export class LastPoolScanComponent {
  scan = input.required<PoolScanUpdate>();

  protected readonly isScrub = computed(() => this.scan()?.function === PoolScanFunction.Scrub);

  protected scanExplanation = computed(() => {
    // Date is substituted in template because formatDatePipe loads timezone asynchronously.
    // TODO: Consider implementing a reactive service for localized time formatting.
    switch (this.scan().state) {
      case PoolScanState.Finished:
        return this.isScrub()
          ? T('Finished Scrub on {date}')
          : T('Finished Resilver on {date}');
      case PoolScanState.Canceled:
        return this.isScrub()
          ? T('Canceled Scrub on {date}')
          : T('Canceled Resilver on {date}');
      default:
        return '';
    }
  });

  protected scanDuration = computed(() => {
    if (!this.scan()?.end_time?.$date || !this.scan()?.start_time?.$date) {
      return '';
    }

    const seconds = secondsToDuration((this.scan().end_time.$date - this.scan().start_time.$date) / 1000);
    return formatDuration(seconds);
  });
}
