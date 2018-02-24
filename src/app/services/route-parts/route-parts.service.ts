import { Injectable } from '@angular/core';
import { TranslateService } from 'ng2-translate/ng2-translate';
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
  constructor(private activatedRoute: ActivatedRoute, private router: Router,
              protected translate: TranslateService) {}

  ngOnInit() {
  }
  generateRouteParts(snapshot: ActivatedRouteSnapshot): IRoutePart[] {
    var routeParts = <IRoutePart[]>[];
    if (snapshot) {
      if (snapshot.firstChild) {
        routeParts = routeParts.concat(this.generateRouteParts(snapshot.firstChild));
      }
      if (snapshot.data['title'] && snapshot.url.length) {
        let targetUrl: any = snapshot.url[0];
        for(let i = 1; i < snapshot.url.length; i++) {
          targetUrl = targetUrl + '/' + snapshot.url[i];
        }
        this.translate.get(snapshot.data['title']).subscribe((title) => {
          routeParts.push({
            title: title, 
            breadcrumb: snapshot.data['breadcrumb'] , 
            url: targetUrl
          });
        })
      }
    }
    return routeParts.reverse();
  }
}