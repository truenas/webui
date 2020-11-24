import { EventEmitter, Injectable } from '@angular/core';
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

  getAllCatalogItems() {
    return this.ws.call('catalog.query', [[], {"extra": {"item_details": true}}]);
  }
 }