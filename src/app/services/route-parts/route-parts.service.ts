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
    var routeParts = <IRoutePart[]>[];
    if (snapshot) {
      if (snapshot.firstChild) {
        routeParts = routeParts.concat(this.generateRouteParts(snapshot.firstChild));
      }
      if (snapshot.data['title'] && snapshot.url.length) {
        // console.log(snapshot.data['title'], snapshot.url)
        routeParts.push({
          title: snapshot.data['title'], 
          breadcrumb: snapshot.data['breadcrumb'] , 
          url: snapshot.url[0].path});
      }
    }
    return routeParts.reverse();
  }
}