import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppStats } from 'app/interfaces/app.interface';
import { ApiService } from 'app/modules/websocket/api.service';

type State = Record<string, AppStats>;

@UntilDestroy()
@Injectable()
export class AppsStatsService extends ComponentStore<State> {
  constructor(
    private api: ApiService,
  ) {
    super({});
  }

  getStatsForApp(appName: string): Observable<AppStats> {
    return this.state$.pipe(map((stats) => stats[appName]));
  }

  subscribeToUpdates(): void {
    this.api.subscribe('app.stats')
      .pipe(untilDestroyed(this))
      .subscribe((event) => this.onStatisticsReceived(event.fields));
  }

  private onStatisticsReceived(update: AppStats[]): void {
    const statsByApp = update.reduce((acc, stats) => {
      acc[stats.app_name] = stats;
      return acc;
    }, {} as Record<string, AppStats>);

    this.setState(statsByApp);
  }
}
