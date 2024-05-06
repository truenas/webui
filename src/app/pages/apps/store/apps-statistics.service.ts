import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChartReleaseStats } from 'app/interfaces/chart-release.interface';
import { WebSocketService } from 'app/services/ws.service';

type State = Record<string, ChartReleaseStats>;

@UntilDestroy()
@Injectable()
export class AppsStatisticsService extends ComponentStore<State> {
  constructor(
    private ws: WebSocketService,
  ) {
    super({});
  }

  getStatsForApp(appName: string): Observable<ChartReleaseStats> {
    return this.state$.pipe(map((stats) => stats[appName]));
  }

  subscribeToUpdates(): void {
    this.ws.subscribe('chart.release.statistics')
      .pipe(untilDestroyed(this))
      .subscribe((event) => this.onStatisticsReceived(event.fields));
  }

  private onStatisticsReceived(update: { id: string; stats: ChartReleaseStats }[]): void {
    const statsByApp = update.reduce((acc, { id, stats }) => {
      acc[id] = stats;
      return acc;
    }, {} as Record<string, ChartReleaseStats>);

    this.setState(statsByApp);
  }
}
