import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Params } from '@angular/router';

export interface RoutePart {
  title: string;
  breadcrumb: string;
  params?: Params;
  url: string;
  toplevel: boolean;
  disabled?: boolean;
}

@Injectable()
export class RoutePartsService {
  routeParts: RoutePart[];

  generateRouteParts(snapshot: ActivatedRouteSnapshot): RoutePart[] {
    let routeParts: RoutePart[] = [];
    if (snapshot) {
      if (snapshot.firstChild) {
        routeParts = routeParts.concat(this.generateRouteParts(snapshot.firstChild));
      }
      if (snapshot.data['title'] && snapshot.url.length) {
        let targetUrl: any = snapshot.url[0];
        for (let i = 1; i < snapshot.url.length; i++) {
          targetUrl = targetUrl + '/' + snapshot.url[i];
        }
        let toplevel = false;
        if (snapshot.data['toplevel']) {
          toplevel = snapshot.data['toplevel'];
        }
        routeParts.push({
          title: snapshot.data['title'],
          breadcrumb: snapshot.data['breadcrumb'],
          url: targetUrl,
          toplevel,
        });
      }
    }
    return routeParts;
  }
}
