import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { RoutePartsService } from '../../../services/route-parts/route-parts.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.css']
})
export class BreadcrumbComponent implements OnInit {
  routeParts:any[];
  public isEnabled: boolean = true;
  constructor(private router: Router,
  private routePartsService: RoutePartsService, 
  private activeRoute: ActivatedRoute) { }

  ngOnInit() {
    this.router.events.filter(event => event instanceof NavigationEnd).subscribe((routeChange) => {
      this.routeParts = this.routePartsService.generateRouteParts(this.activeRoute.snapshot);
      // generate url from parts
      this.routeParts.reverse().map((item, i) => {
        // prepend / to first part
        if(i === 0) {
          item.url = `/${item.url}`;
          return item;
        }
        // prepend previous part to current part
        item.url = `${this.routeParts[i - 1].url}/${item.url}`;
        return item;
      });
    });
  }

}
