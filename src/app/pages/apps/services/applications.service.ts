import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  EMPTY,
  Observable, OperatorFunction, filter, map, pipe,
  switchMap,
} from 'rxjs';
import { ixChartApp } from 'app/constants/catalog.constants';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { CatalogAppState } from 'app/enums/chart-release-status.enum';
import { JobState } from 'app/enums/job-state.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { AppStartQueryParams } from 'app/interfaces/chart-release-event.interface';
import { App, AppUpgradeParams } from 'app/interfaces/chart-release.interface';
import { Job } from 'app/interfaces/job.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { WebSocketService } from 'app/services/ws.service';

const ignoredAppsList = [ixChartApp];

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

  getChartReleaseNames(): Observable<{ name: string }[]> {
    return this.ws.call('app.query', [[], { select: ['name'] }]);
  }

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130379
  // getContainerConfig(): Observable<ContainerConfig> {
  //   return this.ws.call('container.config');
  // }

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130379
  // updateContainerConfig(enableImageUpdates: boolean): Observable<ContainerConfig> {
  //   return this.ws.call('container.update', [{ enable_image_updates: enableImageUpdates }]);
  // }

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

  getAppSimilarApps(app: AvailableApp): Observable<AvailableApp[]> {
    return this.ws.call('app.similar', [app.name, app.train]);
  }

  getAllApps(): Observable<App[]> {
    const secondOption = { extra: { retrieve_config: true, stats: true } };
    return this.ws.call('app.query', [[], secondOption]);
  }

  getApp(name: string): Observable<App[]> {
    return this.ws.call('app.query', [[['name', '=', name]], {
      extra: { include_chart_schema: true, history: true },
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

  getChartUpgradeSummary(name: string, version?: string): Observable<AppUpgradeSummary> {
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
      case CatalogAppState.Active:
        return this.stopApplication(app.name).pipe(
          filter((job) => job.state === JobState.Success),
          switchMap(() => this.startApplication(app.name)),
        );
      case CatalogAppState.Stopped:
        return this.startApplication(app.name).pipe();
      case CatalogAppState.Deploying:
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
