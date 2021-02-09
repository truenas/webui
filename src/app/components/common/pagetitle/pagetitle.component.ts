import { Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { filter } from 'rxjs/operators';
import { RoutePartsService } from '../../../services/route-parts/route-parts.service';
import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Display } from 'app/core/components/display/display.component';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { ViewButtonComponent } from 'app/core/components/viewbutton/viewbutton.component';
import globalHelptext from '../../../helptext/global-helptext';
import { EntityTableAddActionsComponent } from 'app/pages/common/entity/entity-table/entity-table-add-actions.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { VolumesListControlsComponent } from 'app/pages/storage/volumes/volumes-list/volumes-list-controls.component';
import { ReportsGlobalControlsComponent } from 'app/pages/reportsdashboard/components/reports-global-controls/reports-global-controls.component';
import { LocaleService } from 'app/services/locale.service';

export interface GlobalAction {
  applyConfig(config:any);
}


@Component({
  selector: 'pagetitle',
  templateUrl: './pagetitle.component.html',
  styleUrls: ['./pagetitle.component.css']
})
export class PageTitleComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('viewcontroller', {static: false}) viewcontroller: ViewControllerComponent;
  @Input() breadcrumbs: boolean;
  @Input() product_type;
  public titleText: string;
  public copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  private hasInitialized: boolean = false;
  private globalActionsConfig;
  private globalActions;

  routeParts:any[];
  public isEnabled: boolean = true;
  constructor(private router: Router,
  private routePartsService: RoutePartsService, 
  private activeRoute: ActivatedRoute,
  private core: CoreService,
  private localeService: LocaleService) { 
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
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)).subscribe((routeChange) => {
        this.destroyActions();
  
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
      //this.destroyActions();
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

    this.core.register({observerClass:this, eventName:"GlobalActions"}).subscribe((evt:CoreEvent) => {
      // CONFIG OBJECT EXAMPLE: { actionType: EntityTableAddActionsComponent, actionConfig: this };
      this.globalActionsConfig = evt.data;

      if(this.hasInitialized){
        this.renderActions(this.globalActionsConfig);
      }
    });
  }

  ngAfterViewInit(){
    if(this.globalActionsConfig){
      this.renderActions(this.globalActionsConfig);
    }
    this.hasInitialized = true;
  }

  ngOnDestroy(){
    this.core.unregister({observerClass: this});
    delete this.globalActionsConfig;
  }

  createAction(){
    this.viewcontroller.layoutContainer = {layout: 'row', align: 'end center', gap:'2px'};
    this.globalActions = this.viewcontroller.create(ViewButtonComponent);
    this.globalActions.label = 'Global Action';
    this.globalActions.tooltipEnabled = true;
    this.globalActions.tooltipPlacement = 'above';
    this.globalActions.tooltipText = 'Tooltip Text Goes Here';
    this.viewcontroller.addChild(this.globalActions);
  }

  renderActions(config: any){
    if(this.globalActions){
      this.destroyActions();
    }

    this.viewcontroller.layoutContainer = {layout: 'row', align: 'end center', gap:'2px'};
    this.globalActions = this.viewcontroller.create(config.actionType);

    if(!this.globalActions.applyConfig){
      throw "Components must implement GlobalAction Interface"
    }

    this.globalActions.applyConfig(config.actionConfig); // Passes entity object
    this.viewcontroller.addChild(this.globalActions);
  }

  destroyActions(){
      if(this.globalActions){
        this.viewcontroller.removeChild(this.globalActions);
        this.globalActionsConfig = null;
      }

      this.globalActions = null;
  }

}
