import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ServiceName } from 'app/enums/service-name.enum';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { Catalog, CatalogApp } from 'app/interfaces/catalog.interface';
import { ChartReleaseEvent } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { Choices } from 'app/interfaces/choices.interface';
import { ContainerConfig } from 'app/interfaces/container-config.interface';
import { KubernetesConfig } from 'app/interfaces/kubernetes-config.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { WebSocketService } from 'app/services/index';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  constructor(private ws: WebSocketService) {}

  getPoolList(): Observable<Pool[]> {
    return this.ws.call('pool.query');
  }

  getKubernetesConfig(): Observable<KubernetesConfig> {
    return this.ws.call('kubernetes.config');
  }

  getKubernetesServiceStarted(): Observable<boolean> {
    return this.ws.call('service.started', [ServiceName.Kubernetes]);
  }

  getAllCatalogItems(): Observable<Catalog[]> {
    return this.ws.call('catalog.query', [[], { extra: { cache: true, item_details: true } }]);
  }

  getCatalogItem(name: string, catalog: string, train: string): Observable<CatalogApp> {
    return this.ws.call('catalog.get_item_details', [name, { cache: true, catalog, train }]);
  }

  getBindIpChoices(): Observable<Choices> {
    return this.ws.call('kubernetes.bindip_choices');
  }

  getChartReleases(name?: string): Observable<ChartRelease[]> {
    const secondOption = { extra: { history: true } };

    if (name) {
      return this.ws.call('chart.release.query', [[['name', '=', name]]]);
    }
    return this.ws.call('chart.release.query', [[], secondOption]);
  }

  getChartReleaseNames(): Observable<{ name: string }[]> {
    return this.ws.call('chart.release.query', [[], { select: ['name'] }]);
  }

  getInterfaces(): Observable<NetworkInterface[]> {
    return this.ws.call('interface.query');
  }

  getChartReleaseWithResources(name: string): Observable<ChartRelease[]> {
    const secondOption = { extra: { retrieve_resources: true } };
    return this.ws.call('chart.release.query', [[['name', '=', name]], secondOption]);
  }

  getChartReleaseEvents(name: string): Observable<ChartReleaseEvent[]> {
    return this.ws.call('chart.release.events', [name]);
  }

  getContainerConfig(): Observable<ContainerConfig> {
    return this.ws.call('container.config');
  }

  updateContainerConfig(enableImageUpdates: boolean): Observable<ContainerConfig> {
    return this.ws.call('container.update', [{ enable_image_updates: enableImageUpdates }]);
  }

  getUpgradeSummary(name: string, version?: string): Observable<UpgradeSummary> {
    const payload: [name: string, params?: { item_version: string }] = [name];
    if (version) {
      payload.push({ item_version: version });
    }
    return this.ws.call('chart.release.upgrade_summary', payload);
  }

  getPorts(chart: ChartRelease): string {
    const ports: string[] = [];
    chart.used_ports.forEach((item) => {
      ports.push(`${item.port}\\${item.protocol}`);
    });
    return ports.join(', ');
  }
}
