import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CatalogApp } from 'app/interfaces/catalog.interface';
import { WebSocketService2 } from 'app/services/index';

@Injectable({ providedIn: 'root' })
export class ApplicationsService {
  constructor(private ws: WebSocketService2) {}

  getCatalogItem(name: string, catalog: string, train: string): Observable<CatalogApp> {
    return this.ws.call('catalog.get_item_details', [name, { cache: true, catalog, train }]);
  }
}
