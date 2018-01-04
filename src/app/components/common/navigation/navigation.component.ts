import {Component, OnInit, Output, EventEmitter} from '@angular/core';
import { NavigationService } from "../../../services/navigation/navigation.service";
import { WebSocketService } from "../../../services/";
import {Router} from "@angular/router";
import * as _ from 'lodash';

@Component({
  selector: 'navigation',
  templateUrl: './navigation.template.html'
})
export class NavigationComponent {
  hasIconTypeMenuItem;
  iconTypeMenuTitle:string;
  menuItems:any[];
  @Output('onStateChange') onStateChange: EventEmitter<any> = new EventEmitter();

  constructor(private navService: NavigationService, private router: Router, private ws: WebSocketService) {}

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
      this.menuItems = menuItem;
      //Checks item list has any icon type.
      this.hasIconTypeMenuItem = !!this.menuItems.filter(item => item.type === 'icon').length;
    });
  }
}
