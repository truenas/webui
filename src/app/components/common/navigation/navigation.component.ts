import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import { NavigationService } from "../../../services/navigation/navigation.service";
import { WebSocketService } from "../../../services/";
import { DocsService } from "../../../services/docs.service";
import {Router} from "@angular/router";
import * as _ from 'lodash';
import * as Ps from 'perfect-scrollbar';

@Component({
  selector: 'navigation',
  templateUrl: './navigation.template.html'
})
export class NavigationComponent implements OnInit {
  hasIconTypeMenuItem;
  iconTypeMenuTitle:string;
  menuItems:any[];
  @Output('onStateChange') onStateChange: EventEmitter<any> = new EventEmitter();

  constructor(private navService: NavigationService, private router: Router, private ws: WebSocketService, private docsService: DocsService) {}

  ngOnInit() {
    this.iconTypeMenuTitle = this.navService.iconTypeMenuTitle;
    // Loads menu items from NavigationService
    this.navService.menuItems$.subscribe(menuItem => {
      this.ws.call('ipmi.is_loaded').subscribe((res)=>{
        if(!res){
           _.find(_.find(menuItem,
            {name : "Network"}).sub,
            {name : "IPMI"}).disabled = true;
        }
      });
      this.ws.call('multipath.query').subscribe((res)=>{
        if (!res || res.length === 0) {
          _.find(_.find(menuItem, {state : "storage"}).sub, {state : "multipaths"}).disabled = true;
        }
      });
      if (window.localStorage.getItem('is_freenas') === 'false') {
        this.ws.call('failover.licensed').subscribe((is_ha) => {
          if (is_ha) {
            _.find(_.find(menuItem,
              {name : "System"}).sub,
              {name : "Failover"}).disabled = false;
          }
        });
      }
      this.menuItems = menuItem;
      //Checks item list has any icon type.
      this.hasIconTypeMenuItem = !!this.menuItems.filter(item => item.type === 'icon').length;

      // set the guide url
      this.ws.call('system.info').subscribe((res) => {
        if (res.version) {
            window.localStorage.setItem('running_version', res['version']);
            const docUrl = this.docsService.docReplace("%%docurl%%" + "/" + "%%webversion%%");
            const guide = _.find(menuItem, {name: 'Guide'});
            guide.state = docUrl;
        }
      });
    });
  }

  // Workaround to keep scrollbar displaying as needed
  updateScroll() {
    let navigationHold = document.getElementById('scroll-area');
    setTimeout(() => {
      Ps.update(navigationHold);
    }, 500);
  }
}
