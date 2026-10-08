import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, OperatorFunction, filter, map, pipe,
} from 'rxjs';
import { customApp } from 'app/constants/catalog.constants';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { WINDOW } from 'app/helpers/window.helper';
import {
  App, AppStartQueryParams, toApp,
} from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { AppsFiltersSort, AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp, toAvailableApp } from 'app/interfaces/available-app.interface';
import { CatalogApp, toCatalogApp } from 'app/interfaces/catalog.interface';
import { Job } from 'app/interfaces/job.interface';
import { TypedQueryFilter, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

const ignoredAppsList = [customApp];

/** An `app.query` change event, with the row read as the UI's `App`. */
export type AppQueryEvent
  = | { msg: 'added' | 'changed'; id: string; fields: App }
    | { msg: 'removed'; id: string };

/** A `core.get_jobs` change for an app being started or stopped. */
export interface AppStartStopJobEvent {
  msg: 'added' | 'changed';
  id: number;
  fields: Job<void, AppStartQueryParams>;
}

export function filterIgnoredApps(): OperatorFunction<AvailableApp[], AvailableApp[]> {
  return pipe(
    map((apps) => apps.filter((app) => !ignoredAppsList.includes(app.name))),
  );
}

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  private api = inject(TypedApiService);
  private translate = inject(TranslateService);
  private window = inject<Window>(WINDOW);


  checkIfAppIxVolumeExists(appName: string): Observable<boolean> {
    return this.api.call('app.ix_volume.exists', [appName]);
  }

  getPoolList(): Observable<WebUiQueryEntity<'pool.query'>[]> {
    return this.api.query('pool.query');
  }

  getCatalogAppDetails(name: string, train: string): Observable<CatalogApp> {
    return this.api.call('catalog.get_app_details', [name, { train }]).pipe(map(toCatalogApp));
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
    return this.api.call('app.similar', [app.name, app.train]).pipe(
      map((apps) => apps.map(toAvailableApp)),
    );
  }

  getAllApps(): Observable<App[]> {
    return this.api.query('app.query', [], {
      extra: {
        retrieve_config: true,
        host_ip: this.window.location.hostname,
      },
    }).pipe(map((apps) => apps.map(toApp)));
  }

  getApp(name: string): Observable<App[]> {
    return this.api.query('app.query', [['name', '=', name]], {
      extra: {
        include_app_schema: true,
        retrieve_config: true,
        host_ip: this.window.location.hostname,
      },
    }).pipe(map((apps) => apps.map(toApp)));
  }

  getInstalledAppsUpdates(): Observable<AppQueryEvent> {
    return this.api.subscribe('app.query').pipe(
      map((event) => (event.msg === 'removed' ? event : { ...event, fields: toApp(event.fields) })),
    );
  }

  getInstalledAppsStatusUpdates(): Observable<AppStartStopJobEvent> {
    return this.api.subscribe('core.get_jobs').pipe(
      filter((event) => event.msg !== 'removed' && ['app.start', 'app.stop'].includes(event.fields.method)),
      // The UI's `Job` narrows the generated entry's loose fields.
      map((event) => event as unknown as AppStartStopJobEvent),
    );
  }

  getAppUpgradeSummary(name: string, version?: string): Observable<AppUpgradeSummary> {
    return this.api.call('app.upgrade_summary', version ? [name, { app_version: version }] : [name]);
  }

  startApplication(name: string): Observable<Job<void>> {
    return this.api.job('app.start', [name]);
  }

  stopApplication(name: string): Observable<Job<void>> {
    return this.api.job('app.stop', [name]);
  }

  /** Nothing reads the redeployed app the job returns, so its result is left untyped. */
  restartApplication(name: string): Observable<Job> {
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
      return this.api.query(endPoint).pipe(map((apps) => apps.map(toAvailableApp)), filterIgnoredApps());
    }

    const firstOption: TypedQueryFilter<WebUiQueryEntity<'app.available'>>[] = [];

    if (filters.categories?.includes(AppExtraCategory.Recommended)) {
      firstOption.push(['recommended', '=', true]);
    }

    filters.categories = filters.categories?.filter((category) => !category?.includes(AppExtraCategory.Recommended));

    if (filters.categories?.length) {
      firstOption.push(['OR', filters.categories.map((category) => [['categories', 'rin', category]])]);
    }

    const secondOption = filters.sort && filters.sort !== AppsFiltersSort.PopularityRank
      ? { order_by: [filters.sort] }
      : {};

    return this.api.query(endPoint, firstOption, secondOption).pipe(
      map((apps) => apps.map(toAvailableApp)),
      filterIgnoredApps(),
    );
  }
}
