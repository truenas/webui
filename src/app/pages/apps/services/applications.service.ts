import { Injectable } from '@angular/core';
import { format } from 'date-fns-tz';
import { Observable, of, switchMap } from 'rxjs';
import { AppExtraCategory } from 'app/enums/app-extra-category.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartReleaseEvent } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease, ChartReleaseUpgradeParams } from 'app/interfaces/chart-release.interface';
import { Choices } from 'app/interfaces/choices.interface';
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

  getLatestApps(amount = 20): Observable<AvailableApp[]> {
    return this.ws.call('app.latest', [amount]);
  }

  getAvailableApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    if (!filters) {
      return this.ws.call('app.available');
    }

    const firstOption: QueryFilter<AvailableApp>[] = [['catalog', 'in', filters.catalogs]];
    const datetime = format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd HH-mm-ss');
    filters.categories.forEach((category) => {
      switch (category) {
        case AppExtraCategory.Recommended:
          firstOption.push(['recommended', '=', true]);
          break;
        case AppExtraCategory.NewAndUpdated:
          firstOption.push(['last_update', '>', datetime]);
          break;
        default:
          firstOption.push(['categories', 'rin', category]);
      }
    });
    const secondOption = filters.sort ? { order_by: [filters.sort] } : {};

    return this.ws.call('app.available', [firstOption, secondOption]);
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
}
