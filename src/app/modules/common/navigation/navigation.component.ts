import {
  Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import { MenuItem, SubMenuItem } from 'app/interfaces/menu-item.interface';
import { WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { NavigationService } from 'app/services/navigation/navigation.service';

@UntilDestroy()
@Component({
  selector: 'navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
})
export class NavigationComponent implements OnInit {
  hasIconTypeMenuItem: boolean;
  iconTypeMenuTitle: string;
  menuItems: MenuItem[];
  isHighlighted: string;

  @Output() menuToggled: EventEmitter<[string, SubMenuItem[]]> = new EventEmitter();
  @Output() menuClosed: EventEmitter<void> = new EventEmitter();

  constructor(
    private navService: NavigationService,
    private ws: WebSocketService,
    private core: CoreService,
  ) {}

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

        this.navService.enterpriseFeatures.forEach((targetMenu) => {
          const enterpriseItem = (_.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state: targetMenu.sub }));
          if (enterpriseItem) {
            enterpriseItem.disabled = false;
          }
        });
      }

      this.core.register({
        observerClass: this,
        eventName: 'SysInfo',
      }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
        if (evt.data.features.enclosure) {
          this.navService.hardwareFeatures.forEach((targetMenu) => {
            const found = _.find(_.find(menuItem, { state: targetMenu.menu }).sub, { state: targetMenu.sub });
            if (found) found.disabled = false;
          });
        }
      });

      this.core.emit({ name: 'SysInfoRequest', sender: this });

      this.menuItems = menuItem;
      // Checks item list has any icon type.
      this.hasIconTypeMenuItem = !!this.menuItems.filter((item) => item.type === 'icon').length;
    });
  }

  toggleMenu(state: string, sub: SubMenuItem[]): void {
    this.menuToggled.emit([state, sub]);
  }

  closeMenu(): void {
    this.menuClosed.emit();
  }

  updateHighlightedClass(state: string): void {
    this.isHighlighted = state;
  }
}
