import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY,
  Observable, OperatorFunction, filter, map, pipe,
  shareReplay,
  switchMap,
} from 'rxjs';
import { customApp } from 'app/constants/catalog.constants';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { AppState } from 'app/enums/app-state.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import {
  App, AppStartQueryParams, AppUpgradeParams,
} from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { Job } from 'app/interfaces/job.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { WebSocketService } from 'app/services/ws.service';

const ignoredAppsList = [customApp];

export function filterIgnoredApps(): OperatorFunction<AvailableApp[], AvailableApp[]> {
  return pipe(
    map((apps) => apps.filter((app) => !ignoredAppsList.includes(app.name))),
  );
}

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  constructor(private ws: WebSocketService, private translate: TranslateService) {}

  getPoolList(): Observable<Pool[]> {
    return this.ws.call('pool.query');
  }

  getInterfaces(): Observable<NetworkInterface[]> {
    return this.ws.call('interface.query');
  }

  getCatalogAppDetails(name: string, train: string): Observable<CatalogApp> {
    return this.ws.call('catalog.get_app_details', [name, { train }]);
  }

  getAllAppsCategories(): Observable<string[]> {
    return this.ws.call('app.categories');
  }

  getLatestApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.latest', filters).pipe(filterIgnoredApps());
  }

  getAvailableApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.available', filters).pipe(filterIgnoredApps());
  }

  getSimilarApps(app: AvailableApp): Observable<AvailableApp[]> {
    return this.ws.call('app.similar', [app.name, app.train]);
  }

  getAllApps(): Observable<App[]> {
    return this.ws.call('app.query', [[], { extra: { retrieve_config: true } }]).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  getApp(name: string): Observable<App[]> {
    return this.ws.call('app.query', [[['name', '=', name]], {
      extra: {
        include_app_schema: true,
        retrieve_config: true,
      },
    }]);
  }

  getInstalledAppsUpdates(): Observable<ApiEvent> {
    return this.ws.subscribe('app.query');
  }

  getInstalledAppsStatusUpdates(): Observable<ApiEvent<Job<void, AppStartQueryParams>>> {
    return this.ws.subscribe('core.get_jobs').pipe(
      filter((event: ApiEvent<Job<void, AppStartQueryParams>>) => {
        return ['app.start', 'app.stop'].includes(event.fields.method);
      }),
    );
  }

  getAppUpgradeSummary(name: string, version?: string): Observable<AppUpgradeSummary> {
    const payload: AppUpgradeParams = [name];
    if (version) {
      payload.push({ app_version: version });
    }
    return this.ws.call('app.upgrade_summary', payload);
  }

  startApplication(name: string): Observable<Job<void>> {
    return this.ws.job('app.start', [name]);
  }

  stopApplication(name: string): Observable<Job<void>> {
    return this.ws.job('app.stop', [name]);
  }

  restartApplication(app: App): Observable<Job<void>> {
    switch (app.state) {
      case AppState.Running:
        return this.stopApplication(app.name).pipe(
          filter((job) => job.state === JobState.Success),
          switchMap(() => this.startApplication(app.name)),
        );
      case AppState.Stopped:
        return this.startApplication(app.name).pipe();
      case AppState.Deploying:
      default:
        return EMPTY;
    }
  }

  convertDateToRelativeDate(date: Date): string {
    const diff = Math.round((Number(new Date()) - Number(date)) / 1000);
    const day = 60 * 60 * 24;

    if (diff < day) { return this.translate.instant('Last 24 hours'); }
    if (diff < day * 3) { return this.translate.instant('Last 3 days'); }
    if (diff < day * 14) { return this.translate.instant('Last week'); }
    if (diff < day * 60) { return this.translate.instant('Last month'); }
    return this.translate.instant('Long time ago');
  }

  private getAppsFetchCall(
    endPoint: 'app.available' | 'app.latest',
    filters?: AppsFiltersValues,
  ): Observable<AvailableApp[]> {
    if (filters && !filters.categories?.length) {
      delete filters.categories;
    }
    if (filters && !filters.sort?.length) {
      delete filters.sort;
    }
    if (!filters || (filters && !Object.keys(filters).length)) {
      return this.ws.call(endPoint).pipe(filterIgnoredApps());
    }

    const firstOption: QueryFilters<AvailableApp> = [];

    if (filters.categories?.includes(AppExtraCategory.Recommended)) {
      firstOption.push(['recommended', '=', true]);
    }

    filters.categories = filters.categories?.filter((category) => !category?.includes(AppExtraCategory.Recommended));

    if (filters.categories?.length) {
      firstOption.push(
        ['OR', filters.categories.map((category) => ['categories', 'rin', category])] as QueryFilters<AvailableApp>,
      );
    }

    const secondOption = filters.sort ? { order_by: [filters.sort] } : {};

    return this.ws.call(endPoint, [firstOption, secondOption]).pipe(filterIgnoredApps());
  }
}
