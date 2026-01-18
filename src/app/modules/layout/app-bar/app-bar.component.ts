import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { AppBarItem } from 'app/interfaces/app-bar.interface';
import { MenuItem } from 'app/interfaces/menu-item.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { NavigationService } from 'app/services/navigation/navigation.service';
import { appBarOpened } from 'app/store/app-bar/app-bar.actions';
import { selectAppBarState } from 'app/store/app-bar/app-bar.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-app-bar',
  templateUrl: './app-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxIconComponent, RouterLink, AsyncPipe, NgClass],
})
export class AppBarComponent implements OnInit {
  private store = inject(Store);
  private navService = inject(NavigationService);

  readonly appBarState$ = this.store.select(selectAppBarState);
  private router = inject(Router);

  ngOnInit(): void {
    const currentUrl = this.router.url;
    const currentPath = currentUrl.split('/').find(Boolean) || 'desktop';

    this.appBarState$.pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe((items) => {
      const hasMatchingOpenItem = items.some((item) => {
        const itemPath = item.state.split('/').find(Boolean);
        return itemPath === currentPath && item.status === 'open';
      });

      if (!hasMatchingOpenItem) {
        const allMenuItems = this.getAllMenuItems(this.navService.menuItems);
        const matchedItem = allMenuItems.find((item) => {
          const itemPath = item.state.split('/').find(Boolean);
          return itemPath === currentPath;
        });

        if (matchedItem) {
          this.store.dispatch(appBarOpened({
            item: {
              name: matchedItem.name,
              icon: matchedItem.icon,
              iconActive: matchedItem.iconActive,
              state: matchedItem.state,
              status: 'open',
            },
          }));
        }
      }
    });
  }

  private getAllMenuItems(items: MenuItem[] | MenuItem['sub']): MenuItem[] {
    let result: MenuItem[] = [];
    for (const item of items) {
      if (item.state) {
        result.push(item as MenuItem);
      }
      if ('sub' in item && item.sub) {
        result = result.concat(this.getAllMenuItems(item.sub));
      }
    }
    return result;
  }

  getRouterLink(url: string): string[] {
    return ['/', ...url.split('/')];
  }

  onItemClick(item: AppBarItem): void {
    this.router.navigate(this.getRouterLink(item.state));

    setTimeout(() => {
      this.store.dispatch(appBarOpened({
        item: {
          name: item.name,
          icon: item.icon,
          iconActive: item.iconActive,
          state: item.state,
          status: 'open',
        },
      }));
    });
  }
}
