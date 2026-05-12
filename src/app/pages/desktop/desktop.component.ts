import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem, MenuItemType } from 'app/interfaces/menu-item.interface';
import { HarborIconComponent } from 'app/modules/harbor-icon/harbor-icon.component';
import { NavigationService } from 'app/services/navigation/navigation.service';
import { appBarOpened } from 'app/store/app-bar/app-bar.actions';

@Component({
  selector: 'ix-desktop',
  templateUrl: './desktop.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HarborIconComponent, TranslateModule],
})
export class DesktopComponent {
  readonly isLoading = false;
  private navService = inject(NavigationService);

  menuItems = this.navService.menuItems.filter((item) => item.state !== 'harbor-assistant');

  readonly MenuItemType = MenuItemType;

  private store = inject(Store);

  getItemName(item: MenuItem): string {
    return `${item.name.replace(' ', '_')}-menu`;
  }

  getRouterLink(url: string): string[] {
    return ['/', ...url.split('/')];
  }

  open(item: MenuItem): void {
    this.store.dispatch(appBarOpened({
      item: {
        name: item.name,
        icon: item.icon,
        iconActive: item.iconActive,
        state: item.state,
        status: 'open',
      },
    }));
  }
}
