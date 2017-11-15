import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NavigationService } from "../../../services/navigation/navigation.service";
import { Router } from "@angular/router";

@Component({
  selector: 'navigation',
  templateUrl: './navigation.template.html'
})
export class NavigationComponent {
  hasIconTypeMenuItem;
  iconTypeMenuTitle:string;
  menuItems:any[];
  @Output('onStateChange') onStateChange: EventEmitter<any> = new EventEmitter();

  constructor(private navService: NavigationService, private router: Router) {}

  ngOnInit() {
    this.iconTypeMenuTitle = this.navService.iconTypeMenuTitle;
    // Loads menu items from NavigationService
    this.navService.menuItems$.subscribe(menuItem => {
      this.menuItems = menuItem;
      //Checks item list has any icon type.
      this.hasIconTypeMenuItem = !!this.menuItems.filter(item => item.type === 'icon').length;
    });
  }

  transferToState(state, subState?): void {
    subState ? this.router.navigate(['/', state, subState]) : this.router.navigate(['/', state])
    this.onStateChange.emit({transfer: true});
  }
}
