import { Component, OnInit } from '@angular/core';
import { NavigationService } from "../../../services/navigation/navigation.service";

@Component({
  selector: 'navigation',
  templateUrl: './navigation.template.html'
})
export class NavigationComponent {
  hasIconTypeMenuItem;
  iconTypeMenuTitle:string;
  menuItems:any[];

  constructor(private navService: NavigationService) {}
  ngOnInit() {
    this.iconTypeMenuTitle = this.navService.iconTypeMenuTitle;
    // Loads menu items from NavigationService
    this.navService.menuItems$.subscribe(menuItem => {
      this.menuItems = menuItem;
      //Checks item list has any icon type.
      this.hasIconTypeMenuItem = !!this.menuItems.filter(item => item.type === 'icon').length;
    });
  }

  // Only for demo purpose
  addMenuItem() {
    this.menuItems.push({
      name: 'ITEM',
      type: 'dropDown',
      tooltip: 'Item',
      icon: 'done',
      state: 'material',
      sub: [
        {name: 'SUBITEM', state: 'cards'},
        {name: 'SUBITEM', state: 'buttons'}
      ]
    });
  }
}