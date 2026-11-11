import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { patchState, signalState } from '@ngrx/signals';
import { AppStats } from 'app/interfaces/app.interface';
import { ApiService } from 'app/modules/websocket/api.service';

interface AppsStatsState {
  statsByApp: Record<string, AppStats>;
}

@Injectable()
export class AppsStatsService {
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  private readonly state = signalState<AppsStatsState>({ statsByApp: {} });

  /**
   * Reads the signal, so a template or `computed()` calling this re-renders when new stats arrive.
   */
  getStatsForApp(appName: string): AppStats | undefined {
    return this.state.statsByApp()[appName];
  }

  subscribeToUpdates(): void {
    this.api.subscribe('app.stats')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event.msg === 'added') {
          this.onStatisticsReceived(event.fields);
        }
      });
  }

  private onStatisticsReceived(update: AppStats[]): void {
    const statsByApp = update.reduce((acc, stats) => {
      acc[stats.app_name] = stats;
      return acc;
    }, {} as Record<string, AppStats>);

    patchState(this.state, { statsByApp });
  }
}
