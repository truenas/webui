import { Inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, OperatorFunction, filter, map, pipe,
} from 'rxjs';
import { customApp } from 'app/constants/catalog.constants';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import {
  App, AppStartQueryParams, AppUpgradeParams,
} from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { Job } from 'app/interfaces/job.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { ApiService } from 'app/modules/websocket/api.service';

const ignoredAppsList = [customApp];

export function filterIgnoredApps(): OperatorFunction<AvailableApp[], AvailableApp[]> {
  return pipe(
    map((apps) => apps.filter((app) => !ignoredAppsList.includes(app.name))),
  );
}

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  constructor(
    private api: ApiService,
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) {}

  checkIfAppIxVolumeExists(appName: string): Observable<boolean> {
    return this.api.call('app.ix_volume.exists', [appName]);
  }

  getPoolList(): Observable<Pool[]> {
    return this.api.call('pool.query');
  }

  getCatalogAppDetails(name: string, train: string): Observable<CatalogApp> {
    return this.api.call('catalog.get_app_details', [name, { train }]);
  }

  getAllAppsCategories(): Observable<string[]> {
    return this.api.call('app.categories');
  }

  getLatestApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.latest', filters).pipe(filterIgnoredApps());
  }

  getAvailableApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.available', filters).pipe(filterIgnoredApps());
  }

  getSimilarApps(app: AvailableApp): Observable<AvailableApp[]> {
    return this.api.call('app.similar', [app.name, app.train]);
  }

  getAllApps(): Observable<App[]> {
    return this.api.call('app.query', [[], {
      extra: {
        retrieve_config: true,
        host_ip: this.window.location.hostname,
      },
    }]);
  }

  getApp(name: string): Observable<App[]> {
    return this.api.call('app.query', [[['name', '=', name]], {
      extra: {
        include_app_schema: true,
        retrieve_config: true,
        host_ip: this.window.location.hostname,
      },
    }]);
  }

  getInstalledAppsUpdates(): Observable<ApiEvent<App>> {
    return this.api.subscribe('app.query');
  }

  getInstalledAppsStatusUpdates(): Observable<ApiEvent<Job<void, AppStartQueryParams>>> {
    return this.api.subscribe('core.get_jobs').pipe(
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
    return this.api.call('app.upgrade_summary', payload);
  }

  startApplication(name: string): Observable<Job<void>> {
    return this.api.job('app.start', [name]);
  }

  stopApplication(name: string): Observable<Job<void>> {
    return this.api.job('app.stop', [name]);
  }

  restartApplication(name: string): Observable<Job<void>> {
    return this.api.job('app.redeploy', [name]);
  }

  convertDateToRelativeDate(date: Date): string {
    const diff = Math.round((Number(new Date()) - Number(date)) / 1000);
    const day = 60 * 60 * 24;

    switch (true) {
      case diff < day: return this.translate.instant('Last 24 hours');
      case diff < day * 3: return this.translate.instant('Last 3 days');
      case diff < day * 14: return this.translate.instant('Last week');
      case diff < day * 60: return this.translate.instant('Last month');
      default: return this.translate.instant('Long time ago');
    }
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
      return this.api.call(endPoint).pipe(filterIgnoredApps());
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

    return this.api.call(endPoint, [firstOption, secondOption]).pipe(filterIgnoredApps());
  }
}
