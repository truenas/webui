import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { Catalog } from 'app/interfaces/catalog.interface';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { WebSocketService } from 'app/services/index';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  constructor(private ws: WebSocketService) {}

  getPoolList(): Observable<Pool[]> {
    return this.ws.call('pool.query');
  }

  getKubernetesConfig(): Observable<any> {
    return this.ws.call('kubernetes.config');
  }

  getKubernetesServiceStarted(): Observable<any> {
    return this.ws.call('service.started', ['kubernetes']);
  }

  getAllCatalogItems(): Observable<Catalog[]> {
    return this.ws.call('catalog.query', [[], { extra: { item_details: true } }]);
  }

  getBindIPChoices(): Observable<any[]> {
    return this.ws.call('kubernetes.bindip_choices');
  }

  getDockerImages(): Observable<any[]> {
    return this.ws.call('docker.images.query');
  }

  getCatItems(label: string): Observable<any> {
    return this.ws.call('catalog.items', [label]);
  }

  getChartReleases(name?: string): Observable<any[]> {
    const secondOption = { extra: { history: true } };

    if (name) {
      return this.ws.call('chart.release.query', [[['name', '=', name]]]);
    }
    return this.ws.call('chart.release.query', [[], secondOption]);
  }

  getChartReleaseNames(): Observable<any[]> {
    return this.ws.call('chart.release.query', [[], { select: ['name'] }]);
  }

  setReplicaCount(name: string, count: number): Observable<any> {
    return this.ws.call('chart.release.scale', [name, { replica_count: count }]);
  }

  getPodConsoleChoices(name: string): Observable<any[]> {
    return this.ws.call('chart.release.pod_console_choices', [name]);
  }

  getNICChoices(): Observable<any[]> {
    return this.ws.call('chart.release.nic_choices');
  }

  getInterfaces(): Observable<NetworkInterface[]> {
    return this.ws.call('interface.query');
  }

  getChartReleaseWithResources(name: string): Observable<any[]> {
    const secondOption = { extra: { retrieve_resources: true } };
    return this.ws.call('chart.release.query', [[['name', '=', name]], secondOption]);
  }

  getChartReleaseEvents(name: string): Observable<any[]> {
    return this.ws.call('chart.release.events', [name]);
  }

  getContainerConfig(): Observable<any> {
    return this.ws.call('container.config');
  }

  updateContainerConfig(enable_image_updates: boolean): Observable<any> {
    return this.ws.call('container.update', [{ enable_image_updates }]);
  }

  getUpgradeSummary(name: string): Observable<UpgradeSummary> {
    return this.ws.call('chart.release.upgrade_summary', [name]);
  }
}
