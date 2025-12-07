import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store'; // 新增
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem, MenuItemType } from 'app/interfaces/menu-item.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { NavigationService } from 'app/services/navigation/navigation.service';
import { appBarOpened } from 'app/store/app-bar/app-bar.actions'; // 新增

@UntilDestroy()
@Component({
  selector: 'ix-desktop',
  templateUrl: './desktop.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxIconComponent, TranslateModule],
})
export class DesktopComponent {
  readonly isLoading = false;
  private navService = inject(NavigationService);

  menuItems = this.navService.menuItems;

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
        state: item.state,
        status: 'open',
      },
    }));
  }
}
