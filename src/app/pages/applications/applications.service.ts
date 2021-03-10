import { Injectable } from '@angular/core';
import { WebSocketService } from '../../services/index';

@Injectable({ providedIn: 'root'})
export class ApplicationsService {

  constructor(private ws: WebSocketService) {}

  getPoolList() {
    return this.ws.call('pool.query');
  }

  getKubernetesConfig() {
    return this.ws.call('kubernetes.config');
  }

  getKubernetesServiceStarted() {
    return this.ws.call('service.started', ['kubernetes']);
  }

  getAllCatalogItems() {
    return this.ws.call('catalog.query', [[], {"extra": {"item_details": true}}]);
  }

  getBindIPChoices() {
    return this.ws.call('kubernetes.bindip_choices');
  }

  getDockerImages() {
    return this.ws.call('docker.images.query');
  }

  getCatItems() {
    return this.ws.call('catalog.items', ['OFFICIAL']);
  }

  getChartReleases(name?: string) {
    let secondOption = {"extra": {"history": true}};

    if (name) {
      return this.ws.call('chart.release.query', [[['name', '=', name]]]);  
    }
    return this.ws.call('chart.release.query', [[], secondOption]);
  }

  getChartReleaseNames() {
    return this.ws.call('chart.release.query', [[], {select: ['name']}]);
  }

  setReplicaCount(name: string, count: number) {
    return this.ws.call('chart.release.scale', [name, { replica_count: count}]);
  }

  getPodConsoleChoices(name: string) {
    return this.ws.call('chart.release.pod_console_choices', [name]);
  }

  getNICChoices() {
    return this.ws.call('chart.release.nic_choices');
  }

  getInterfaces() {
    return this.ws.call('interface.query');
  }

  getChartReleaseWithResources(name: string) {
    let secondOption = {"extra": {"retrieve_resources": true}};
    return this.ws.call('chart.release.query', [[['name', '=', name]], secondOption]);
  }

  getChartReleaseEvents(name: string) {
    return this.ws.call('chart.release.events', [name]);
  }
  
  getContainerConfig() {
    return this.ws.call('container.config');
  }

  updateContainerConfig(enable_image_updates: boolean) {
    return this.ws.call('container.update', [{enable_image_updates: enable_image_updates}]);
  }

 }