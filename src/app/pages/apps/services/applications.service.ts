import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, OperatorFunction, map, pipe,
} from 'rxjs';
import { ixChartApp } from 'app/constants/catalog.constants';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartReleaseEvent, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease, ChartReleaseUpgradeParams } from 'app/interfaces/chart-release.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { Job } from 'app/interfaces/job.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
import { WebSocketService } from 'app/services';

const ignoredAppsList = [ixChartApp];

export function filterIgnoredApps(): OperatorFunction<AvailableApp[], AvailableApp[]> {
  return pipe(
    map((apps) => apps.filter((app) => !ignoredAppsList.includes(app.name))),
  );
}

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  constructor(private ws: WebSocketService, private translate: TranslateService) {}

  getKubernetesConfig(): Observable<KubernetesConfig> {
    return this.ws.call('kubernetes.config');
  }

  getKubernetesServiceStarted(): Observable<boolean> {
    return this.ws.call('service.started', [ServiceName.Kubernetes]);
  }

  getCatalogItem(name: string, catalog: string, train: string): Observable<CatalogApp> {
    return this.ws.call('catalog.get_item_details', [name, { cache: true, catalog, train }]);
  }

  getAllAppsCategories(): Observable<string[]> {
    return this.ws.call('app.categories');
  }

  getAvailableItem(name: string, catalog: string, train: string): Observable<AvailableApp> {
    const queryFilters: QueryFilter<AvailableApp>[] = [
      ['name', '=', name],
      ['catalog', '=', catalog],
      ['train', '=', train],
    ];
    return this.ws.call('app.available', [queryFilters]).pipe(map((app) => app[0]));
  }

  getLatestApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.latest', filters).pipe(filterIgnoredApps());
  }

  getAvailableApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.available', filters).pipe(filterIgnoredApps());
  }

  private getAppsFetchCall(
    endPoint: 'app.available' | 'app.latest',
    filters?: AppsFiltersValues,
  ): Observable<AvailableApp[]> {
    if (filters && !filters.categories?.length) {
      delete filters.categories;
    }
    if (filters && !filters.catalogs?.length) {
      delete filters.catalogs;
    }
    if (filters && !filters.sort?.length) {
      delete filters.sort;
    }
    if (!filters || (filters && !Object.keys(filters).length)) {
      return this.ws.call(endPoint).pipe(filterIgnoredApps());
    }

    const firstOption: QueryFilter<AvailableApp>[] = [];
    if (filters.catalogs?.length) {
      firstOption.push(['catalog', 'in', filters.catalogs]);
    }
    if (filters.categories?.length) {
      (firstOption as unknown as QueryParams<AvailableApp>[]).push(
        ['OR', filters.categories.map((category) => ['categories', 'rin', category])] as unknown as QueryParams<AvailableApp>,
      );
    }
    if (filters.categories?.includes(AppExtraCategory.Recommended)) {
      firstOption.push(['recommended', '=', true]);
    }

    const secondOption = filters.sort ? { order_by: [filters.sort] } : {};

    return this.ws.call(endPoint, [firstOption, secondOption]).pipe(filterIgnoredApps());
  }

  getAllChartReleases(): Observable<ChartRelease[]> {
    const secondOption = { extra: { history: true } };
    return this.ws.call('chart.release.query', [[], secondOption]);
  }

  getChartRelease(name: string): Observable<ChartRelease[]> {
    return this.ws.call('chart.release.query', [[['name', '=', name]]]);
  }

  subscribeToAllChartReleases(): Observable<ApiEvent<ChartRelease>> {
    return this.ws.subscribe('chart.release.query');
  }

  getChartReleaseWithResources(name: string): Observable<ChartRelease[]> {
    const secondOption = { extra: { retrieve_resources: true } };
    return this.ws.call('chart.release.query', [[['name', '=', name]], secondOption]);
  }

  getChartReleaseEvents(name: string): Observable<ChartReleaseEvent[]> {
    return this.ws.call('chart.release.events', [name]);
  }

  getChartUpgradeSummary(name: string, version?: string): Observable<UpgradeSummary> {
    const payload: ChartReleaseUpgradeParams = [name];
    if (version) {
      payload.push({ item_version: version });
    }
    return this.ws.call('chart.release.upgrade_summary', payload);
  }

  getChartReleaesUsingChartReleaseImages(name: string): Observable<Choices> {
    return this.ws.call(
      'chart.release.get_chart_releases_using_chart_release_images',
      [name],
    );
  }

  startApplication(name: string): Observable<Job<ChartScaleResult>> {
    return this.ws.job('chart.release.scale', [name, { replica_count: 1 }]);
  }

  stopApplication(name: string): Observable<Job<ChartScaleResult>> {
    return this.ws.job('chart.release.scale', [name, { replica_count: 0 }]);
  }

  convertDateToRelativeDate(date: Date): string {
    const diff = Math.round(((new Date() as unknown as number) - (date as unknown as number)) / 1000);

    const minute = 60;
    const hour = minute * 60;
    const day = hour * 24;
    const week = day * 7;
    const month = day * 30;
    const year = month * 12;

    if (diff < hour) {
      return this.translate.instant('Recently');
    }
    if (Math.floor(diff / hour) === 1) {
      return this.translate.instant('1 hour ago');
    }
    if (diff < day) {
      return this.translate.instant('{timeAmount} hours ago', { timeAmount: Math.floor(diff / hour) || '' });
    }
    if (diff < day * 2) {
      return this.translate.instant('Yesterday');
    }
    if (diff < week) {
      return this.translate.instant('{timeAmount} days ago', { timeAmount: week || '' });
    }
    if ((diff < month) && Math.floor(diff / week) === 1) {
      return this.translate.instant('Last week');
    }
    if (diff < month) {
      return this.translate.instant('{timeAmount} weeks ago', { timeAmount: Math.floor(diff / week) || '' });
    }
    if ((diff < year) && Math.floor(diff / month) === 1) {
      return this.translate.instant('Last month');
    }
    if ((diff < year) && Math.floor(diff / month) > 1) {
      return this.translate.instant('{timeAmount} months ago', { timeAmount: Math.floor(diff / month) || '' });
    }
    if (Math.floor(diff / year) === 1) {
      return this.translate.instant('Last year');
    }
    return this.translate.instant('{timeAmount} years ago', { timeAmount: Math.floor(diff / year) || '' });
  }
}
