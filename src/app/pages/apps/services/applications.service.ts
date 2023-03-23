import { Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { AppsFiltersValues } from 'app/interfaces/apps-filters-values.interface';
import { AvailableApp } from 'app/interfaces/available-app.interfase';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
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
    const firstOption: QueryFilter<AvailableApp>[] = [
      ['name', '=', name],
      ['catalog', '=', catalog],
      ['train', '=', train],
    ];
    return this.ws.call('app.available', [firstOption]).pipe(switchMap((app) => of(app[0])));
  }

  getAvailableApps(filters?: AppsFiltersValues): Observable<AvailableApp[]> {
    if (!filters) {
      return this.ws.call('app.available');
    }

    const firstOption: QueryFilter<AvailableApp>[] = [
      ['name', 'rin', filters.search],
      ['catalog', 'in', filters.catalogs],
    ];
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
}
