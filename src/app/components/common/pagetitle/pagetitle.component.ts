import { Component, OnInit, AfterViewInit, Input, ViewChild } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { RoutePartsService } from '../../../services/route-parts/route-parts.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Display } from 'app/core/components/display/display.component';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { ViewButtonComponent } from 'app/core/components/viewbutton/viewbutton.component';
import globalHelptext from '../../../helptext/global-helptext';

@Component({
  selector: 'pagetitle',
  templateUrl: './pagetitle.component.html',
  styleUrls: ['./pagetitle.component.css']
})
export class PageTitleComponent implements OnInit, AfterViewInit {
  @ViewChild('viewcontroller', {static: false}) viewcontroller: ViewControllerComponent;
  @Input() breadcrumbs: boolean;
  @Input() product_type;
  public titleText: string;
  public copyrightYear = globalHelptext.copyright_year;

  routeParts:any[];
  public isEnabled: boolean = true;
  constructor(private router: Router,
  private routePartsService: RoutePartsService, 
  private activeRoute: ActivatedRoute,
  private core: CoreService) { 
  }

  ngOnInit() {
  // must be running once to get breadcrumbs
    this.routeParts = this.routePartsService.generateRouteParts(this.activeRoute.snapshot);
    this.titleText = this.routeParts && this.routeParts[0].title ? this.routeParts[0].title : '';

    // generate url from parts
    this.routeParts.reverse().map((item, i) => {
      // prepend / to first part
      if(i === 0) {
        item.url = `/${item.url}`;
        if (!item['toplevel']) {
          item.disabled = true;
        }
        return item;
      }
      // prepend previous part to current part
      item.url = `${this.routeParts[i - 1].url}/${item.url}`;
      return item;
    });

  // only execute when routechange
    this.router.events.filter(event => event instanceof NavigationEnd).subscribe((routeChange) => {
      this.routeParts = this.routePartsService.generateRouteParts(this.activeRoute.snapshot);
      this.titleText = this.routeParts && this.routeParts[0].title ? this.routeParts[0].title : '';

      // generate url from parts
      this.routeParts.reverse().map((item, i) => {
        // prepend / to first part
        if(i === 0) {
          item.url = `/${item.url}`;
          if (!item['toplevel']) {
            item.disabled = true;
          }
          return item;
        }
        // prepend previous part to current part
        item.url = `${this.routeParts[i - 1].url}/${item.url}`;
        return item;
      });
    });

  // Pseudo routing events (for reports page)
    this.core.register({observerClass:this, eventName:"PseudoRouteChange"}).subscribe((evt:CoreEvent) => {
      let routeChange = evt.data;
      //this.routeParts = this.routePartsService.generateRouteParts(this.activeRoute.snapshot);
      this.routeParts = evt.data;
      // generate url from parts
      this.routeParts.map((item, i) => {
        // prepend / to first part
        if(i === 0) {
          item.url = `/${item.url}`;
          item.disabled = true;
          return item;
        }
        // prepend previous part to current part
        item.url = `${this.routeParts[i - 1].url}/${item.url}`;
        return item;
      });
    });
  }

  ngAfterViewInit(){
    //setTimeout(() =>{
      this.createActions();
    //}, 2000);
  }

  createActions(){
    console.log(this.viewcontroller);
    this.viewcontroller.layoutContainer = {layout: 'row', align: 'end center', gap:'2px'};
    let btn = this.viewcontroller.create(ViewButtonComponent);
    btn.label = "Global Action";
    this.viewcontroller.addChild(btn);
  }

}
