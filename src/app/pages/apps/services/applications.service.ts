import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartReleaseEvent, ChartScaleResult } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease, ChartReleaseUpgradeParams } from 'app/interfaces/chart-release.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { Job } from 'app/interfaces/job.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { QueryFilter } from 'app/interfaces/query-api.interface';
import { WebSocketService } from 'app/services';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  constructor(private ws: WebSocketService) {}

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
    return this.ws.call('app.available', [queryFilters]).pipe(switchMap((app) => of(app[0])));
  }

  getLatestApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.latest', filters);
  }

  getAvailableApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    return this.getAppsFetchCall('app.available', filters);
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
      return this.ws.call(endPoint);
    }

    const firstOption: QueryFilter<AvailableApp>[] = [];
    if (filters.catalogs?.length) {
      firstOption.push(['catalog', 'in', filters.catalogs]);
    }
    filters.categories?.forEach((category) => {
      if (category === 'recommended') {
        firstOption.push(['recommended', '=', true]);
      } else {
        firstOption.push(['categories', 'rin', category]);
      }
    });
    const secondOption = filters.sort ? { order_by: [filters.sort] } : {};

    return this.ws.call(endPoint, [firstOption, secondOption]);
  }

  getChartReleases(name?: string): Observable<ChartRelease[]> {
    const secondOption = { extra: { history: true } };

    if (name) {
      return this.ws.call('chart.release.query', [[['name', '=', name]]]);
    }
    return this.ws.call('chart.release.query', [[], secondOption]);
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
}
