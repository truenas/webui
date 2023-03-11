import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { Catalog, CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartReleaseEvent } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { WebSocketService } from 'app/services/index';

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

  getAllCatalogs(): Observable<Catalog[]> {
    return this.ws.call('catalog.query', [[], { extra: { cache: true, item_details: true } }]);
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

  getPorts(chart: ChartRelease): string {
    const ports: string[] = [];
    chart.used_ports.forEach((item) => {
      ports.push(`${item.port}\\${item.protocol}`);
    });
    return ports.join(', ');
  }
}
