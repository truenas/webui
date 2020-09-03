import { Injectable } from '@angular/core';
import { Router, ActivatedRoute, NavigationEnd, ActivatedRouteSnapshot, Params, PRIMARY_OUTLET } from "@angular/router";

interface IRoutePart {
  title: string,
  breadcrumb: string,
  params?: Params,
  url: string,
}

@Injectable()
export class RoutePartsService {
  public routeParts: IRoutePart[];
  constructor(private activatedRoute: ActivatedRoute, private router: Router) {}

  ngOnInit() {
  }
  generateRouteParts(snapshot: ActivatedRouteSnapshot): IRoutePart[] {
    var routeParts = <any[]>[];
    if (snapshot) {
      if (snapshot.firstChild) {
        routeParts = routeParts.concat(this.generateRouteParts(snapshot.firstChild));
      }
      if (snapshot.data['title'] && snapshot.url.length) {
        let targetUrl: any = snapshot.url[0];
        for(let i = 1; i < snapshot.url.length; i++) {
          targetUrl = targetUrl + '/' + snapshot.url[i];
        }
        let toplevel = false;
        if (snapshot.data['toplevel']){
          toplevel = snapshot.data['toplevel'];
        }
        console.log(snapshot.data);
        routeParts.push({
          title: snapshot.data['title'], 
          breadcrumb: snapshot.data['breadcrumb'] , 
          url: targetUrl,
          toplevel: toplevel
        });
      }
    }
    return routeParts;
  }
}
