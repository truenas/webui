import {
  Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { ViewControllerComponent } from 'app/core/components/viewcontroller/viewcontroller.component';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { WebSocketService } from '../../../services';
import { DocsService } from '../../../services/docs.service';
import { NavigationService } from '../../../services/navigation/navigation.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'navigation',
  templateUrl: './navigation.template.html',
})
export class NavigationComponent extends ViewControllerComponent implements OnInit {
  hasIconTypeMenuItem: boolean;
  iconTypeMenuTitle: string;
  menuItems: any[];
  menuList = document.getElementsByClassName('top-level');
  isHighlighted: string;

  @Output('onStateChange') onStateChange: EventEmitter<any> = new EventEmitter();
  @Output('onToggleMenu') onToggleMenu: EventEmitter<any> = new EventEmitter();
  @Output('onCloseMenu') onCloseMenu: EventEmitter<any> = new EventEmitter();

  constructor(private navService: NavigationService, private router: Router, private ws: WebSocketService, private docsService: DocsService) {
    super();
  }

  ngOnInit(): void {
    this.iconTypeMenuTitle = this.navService.iconTypeMenuTitle;
    // Loads menu items from NavigationService
    this.navService.menuItems$.pipe(untilDestroyed(this)).subscribe((menuItem) => {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((hasFailover) => {
        _.find(_.find(menuItem, { state: 'system' }).sub, { state: 'failover' }).disabled = !hasFailover;
      });
      if (window.localStorage.getItem('product_type') === ProductType.Enterprise) {
        this.ws
          .call('system.feature_enabled', ['VM'])
          .pipe(filter((vmsEnabled) => !vmsEnabled))
          .pipe(untilDestroyed(this)).subscribe(() => {
            _.find(menuItem, { state: 'vm' }).disabled = true;
          });

        for (let i = 0; i < this.navService.enterpriseFeatures.length; i++) {
          const targetMenu = this.navService.enterpriseFeatures[i];
          const enterpriseItem = (_.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state: targetMenu.sub }));
          if (enterpriseItem) {
            enterpriseItem.disabled = false;
          }
        }
      }

      this.core.register({
        observerClass: this,
        eventName: 'SysInfo',
      }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
        if (window.localStorage.getItem('product_type') !== ProductType.Core) {
          // hide jail and plugins section if product type is SCALE or ENTERPRISE with jail unregistered
          if ((evt.data.license && evt.data.license.features.indexOf(LicenseFeature.Jails) === -1)
              || window.localStorage.getItem('product_type').includes(ProductType.Scale)) {
            _.find(menuItem, { state: 'plugins' }).disabled = true;
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

        if (evt.data.features.enclosure) {
          for (let i = 0; i < this.navService.hardwareFeatures.length; i++) {
            const targetMenu = this.navService.hardwareFeatures[i];
            const found = _.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state: targetMenu.sub });
            if (found) found.disabled = false;
          }
        }
      });

      this.core.emit({ name: 'SysInfoRequest', sender: this });

      this.menuItems = menuItem;
      // Checks item list has any icon type.
      this.hasIconTypeMenuItem = !!this.menuItems.filter((item) => item.type === 'icon').length;
    });
  }

  toggleMenu(state: any, sub: any): void {
    this.onToggleMenu.emit([state, sub]);
  }

  closeMenu(): void {
    this.onCloseMenu.emit();
  }

  updateHighlightedClass(state: any): void {
    this.isHighlighted = state;
  }
}
