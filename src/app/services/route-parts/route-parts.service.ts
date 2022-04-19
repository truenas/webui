import { Injectable } from '@angular/core';
import {
  ActivatedRoute, ActivatedRouteSnapshot, NavigationEnd, Params, Router,
} from '@angular/router';
import { filter } from 'rxjs/operators';

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
  private lastSuccessfullrouteParts: RoutePart[];

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    // only execute when routechange
    this.lastSuccessfullrouteParts = this.generateRouteParts(this.activatedRoute.snapshot);
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
    ).subscribe(() => {
      this.lastSuccessfullrouteParts = this.generateRouteParts(this.activatedRoute.snapshot);
    });
  }

  get routeParts(): RoutePart[] {
    return this.lastSuccessfullrouteParts;
  }

  private generateRouteParts(snapshot: ActivatedRouteSnapshot): RoutePart[] {
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
