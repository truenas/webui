import { Component, OnInit, Input } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox/checkbox';
import { MatRadioChange } from '@angular/material/radio/radio';
import { NavigationService } from '../../../services/navigation/navigation.service';

@Component({
  selector: 'app-customizer',
  templateUrl: './customizer.component.html',
  styleUrls: ['./customizer.component.scss'],
})
export class CustomizerComponent {
  isCustomizerOpen = false;
  selectedMenu = 'icon-menu';
  @Input() breadcrumb: { isEnabled: boolean };
  sidenavTypes = [{
    name: 'Default Menu',
    value: 'default-menu',
  }, {
    name: 'Separator Menu',
    value: 'separator-menu',
  }, {
    name: 'Icon Menu',
    value: 'icon-menu',
  }];
  constructor(private navService: NavigationService) { }

  changeSidenav(): void {
    this.navService.publishNavigationChange();
  }
  toggleBreadcrumb(event: MatCheckboxChange): void {
    this.breadcrumb.isEnabled = event.checked;
  }
}
