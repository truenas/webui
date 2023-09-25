import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, OperatorFunction, filter, map, pipe,
} from 'rxjs';
import { ixChartApp } from 'app/constants/catalog.constants';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ApiEvent } from 'app/interfaces/api-message.interface';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartReleaseEvent, ChartScaleQueryParams, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease, ChartReleaseUpgradeParams } from 'app/interfaces/chart-release.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { ContainerConfig } from 'app/interfaces/container-config.interface';
import { Job } from 'app/interfaces/job.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { KubernetesStatusData } from 'app/interfaces/kubernetes-status-data.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { QueryFilter, QueryParams } from 'app/interfaces/query-api.interface';
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

  getKubernetesStatus(): Observable<KubernetesStatusData> {
    return this.ws.call('kubernetes.status');
  }

  getKubernetesStatusUpdates(): Observable<ApiEvent<KubernetesStatusData>> {
    return this.ws.subscribe('kubernetes.state');
  }

  getKubernetesConfig(): Observable<KubernetesConfig> {
    return this.ws.call('kubernetes.config');
  }

  getPoolList(): Observable<Pool[]> {
    return this.ws.call('pool.query');
  }

  getChartReleaseNames(): Observable<{ name: string }[]> {
    return this.ws.call('chart.release.query', [[], { select: ['name'] }]);
  }

  getBindIpChoices(): Observable<Choices> {
    return this.ws.call('kubernetes.bindip_choices');
  }

  getContainerConfig(): Observable<ContainerConfig> {
    return this.ws.call('container.config');
  }

  updateContainerConfig(enableImageUpdates: boolean): Observable<ContainerConfig> {
    return this.ws.call('container.update', [{ enable_image_updates: enableImageUpdates }]);
  }

  getInterfaces(): Observable<NetworkInterface[]> {
    return this.ws.call('interface.query');
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

  getLatestApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.latest', filters).pipe(filterIgnoredApps());
  }

  getAvailableApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.available', filters).pipe(filterIgnoredApps());
  }

  getAppSimilarApps(app: AvailableApp): Observable<AvailableApp[]> {
    return this.ws.call('app.similar', [app.name, app.catalog, app.train]);
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

    if (filters.categories?.includes(AppExtraCategory.Recommended)) {
      firstOption.push(['recommended', '=', true]);
    }

    filters.categories = filters.categories?.filter((category) => !category?.includes(AppExtraCategory.Recommended));

    if (filters.categories?.length) {
      (firstOption as unknown as QueryParams<AvailableApp>[]).push(
        ['OR', filters.categories.map((category) => ['categories', 'rin', category])] as unknown as QueryParams<AvailableApp>,
      );
    }

    const secondOption = filters.sort ? { order_by: [filters.sort] } : {};

    return this.ws.call(endPoint, [firstOption, secondOption]).pipe(filterIgnoredApps());
  }

  getAllChartReleases(): Observable<ChartRelease[]> {
    const secondOption = { extra: { history: true, stats: true } };
    return this.ws.call('chart.release.query', [[], secondOption]);
  }

  getChartRelease(name: string): Observable<ChartRelease[]> {
    return this.ws.call('chart.release.query', [[['name', '=', name]], {
      extra: { include_chart_schema: true, history: true },
    }]);
  }

  getInstalledAppsUpdates(): Observable<ApiEvent> {
    return this.ws.subscribe('chart.release.query');
  }

  getInstalledAppsStatisticsUpdates(): Observable<ApiEvent> {
    return this.ws.subscribe('chart.release.statistics');
  }

  getInstalledAppsStatusUpdates(): Observable<ApiEvent<Job<ChartScaleResult, ChartScaleQueryParams>>> {
    return this.ws.subscribe('core.get_jobs').pipe(
      filter((event: ApiEvent<Job<ChartScaleResult, ChartScaleQueryParams>>) => {
        return event.fields.method === 'chart.release.scale';
      }),
    );
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
    const day = 60 * 60 * 24;

    if (diff < day) { return this.translate.instant('Last 24 hours'); }
    if (diff < day * 3) { return this.translate.instant('Last 3 days'); }
    if (diff < day * 14) { return this.translate.instant('Last week'); }
    if (diff < day * 60) { return this.translate.instant('Last month'); }
    return this.translate.instant('Long time ago');
  }
}
