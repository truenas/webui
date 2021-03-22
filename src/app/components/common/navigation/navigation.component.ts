import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import { NavigationService } from "../../../services/navigation/navigation.service";
import { WebSocketService } from "../../../services/";
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { CoreEvent } from 'app/core/services/core.service';
import { DocsService } from "../../../services/docs.service";
import {Router} from "@angular/router";
import * as _ from 'lodash';
import * as Ps from 'perfect-scrollbar';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'navigation',
  templateUrl: './navigation.template.html'
})
export class NavigationComponent extends ViewControllerComponent implements OnInit {
  productType = window.localStorage.getItem('product_type');
  hasIconTypeMenuItem;
  iconTypeMenuTitle:string;
  menuItems:any[];
  menuList = document.getElementsByClassName('top-level');
  isHighlighted: string;

  @Output('onStateChange') onStateChange: EventEmitter<any> = new EventEmitter();
  @Output('onToggleMenu') onToggleMenu: EventEmitter<any> = new EventEmitter();
  @Output('onCloseMenu') onCloseMenu: EventEmitter<any> = new EventEmitter();

  constructor(private navService: NavigationService, private router: Router, private ws: WebSocketService, private docsService: DocsService) {
    super();
  }

  ngOnInit() {
    this.iconTypeMenuTitle = this.navService.iconTypeMenuTitle;
    // Loads menu items from NavigationService
    this.navService.menuItems$.subscribe(menuItem => {
      this.ws.call("failover.licensed", []).subscribe((res) => {
        _.find(_.find(menuItem, { state: "system" }).sub, {state: 'failover'}).disabled = !res;
      });
      if (window.localStorage.getItem('product_type').includes('ENTERPRISE')) {
        this.ws
          .call("system.feature_enabled", ["VM"])
          .pipe(filter(vmsEnabled => !vmsEnabled))
          .subscribe(() => {
            _.find(menuItem, { state: "vm" }).disabled = true;
          });


        for(let i = 0; i < this.navService.enterpriseFeatures.length; i++) {
          const targetMenu = this.navService.enterpriseFeatures[i];
          const enterpriseItem = (_.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state : targetMenu.sub}))
          if (enterpriseItem) {
            enterpriseItem.disabled = false;
          }
        }
      }

      this.core.register({
        observerClass: this,
        eventName: "SysInfo"
        }).subscribe((evt:CoreEvent) => {

          if (window.localStorage.getItem('product_type') !== 'CORE') {
            // hide jail and plugins section if product type is SCALE or ENTERPRISE with jail unregistered
            if ((evt.data.license && evt.data.license.features.indexOf('JAILS') === -1) || 
              window.localStorage.getItem('product_type').includes('SCALE')){
                _.find(menuItem, {state : "plugins"}).disabled = true;
                // _.find(_.find(menuItem, {state : "virtualization"}).sub, { state : 'jails' }).disabled = true; TEMPORARILY disabled
                // while there is no virtualization menu
              }                        
          }

          // set the guide url -- temporarily(?) disabled for menuing project
          // if (evt.data.version) {
          //     window.localStorage.setItem('running_version', evt.data['version']);
          //     const docUrl = this.docsService.docReplace("--docurl--");
          //     const guide = _.find(menuItem, {name: 'Guide'});
          //     guide.state = docUrl;
          // }

          if(evt.data.features.enclosure){
            for(let i = 0; i < this.navService.hardwareFeatures.length; i++) {
              const targetMenu = this.navService.hardwareFeatures[i];
              let found = _.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state : targetMenu.sub});
              if(found) found.disabled = false;
            }
          }
      });

      this.core.emit({name:"SysInfoRequest", sender:this});

      this.menuItems = menuItem;
      //Checks item list has any icon type.
      this.hasIconTypeMenuItem = !!this.menuItems.filter(item => item.type === 'icon').length;

    });
  }

  // Workaround to keep scrollbar displaying as needed
  updateScroll() {
    let navigationHold = document.getElementById('scroll-area');
    setTimeout(() => {
      Ps.update(navigationHold);
    }, 500);
  }

  toggleMenu(state, sub) {
    this.onToggleMenu.emit([state, sub]);
  }

  closeMenu() {
    this.onCloseMenu.emit();
  }

  updateHighlightedClass(state) {
    this.isHighlighted = state;
  }
 }
