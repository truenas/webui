import { Component, OnInit, Input } from '@angular/core';
import { NavigationService } from "../../../services/navigation/navigation.service";

@Component({
  selector: 'app-customizer',
  templateUrl: './customizer.component.html',
  styleUrls: ['./customizer.component.css']
})
export class CustomizerComponent implements OnInit {
  isCustomizerOpen: boolean = false;
  selectedMenu: string = 'icon-menu';
  @Input() breadcrumb;
  sidenavTypes = [{
    name: 'Default Menu',
    value: 'default-menu'
  }, {
    name: 'Separator Menu',
    value: 'separator-menu'
  }, {
    name: 'Icon Menu',
    value: 'icon-menu'
  }]
  constructor(private navService: NavigationService) { }

  ngOnInit() {}
  changeSidenav(data) {
    this.navService.publishNavigationChange(data.value)
  }
  toggleBreadcrumb(data) {
    this.breadcrumb.isEnabled = data.checked;
  }
}
