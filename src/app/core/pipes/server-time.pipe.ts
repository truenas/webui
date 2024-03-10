import { Pipe, PipeTransform } from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { utcToZonedTime } from 'date-fns-tz';
import { AppState } from 'app/store';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Pipe({
  name: 'serverTime',
  pure: false,
})
export class ServerTimePipe implements PipeTransform {
  timezone: string;
  constructor(
    private store$: Store<AppState>,
  ) {
    this.store$.select(selectTimezone).pipe(untilDestroyed(this)).subscribe((timezone) => {
      this.timezone = timezone;
    });
  }

  transform(value: Date | number): Date {
    if (!this.timezone) {
      console.error('Timezone not available.');
      return new Date(value);
    }
    return utcToZonedTime(value, this.timezone);
  }
}
