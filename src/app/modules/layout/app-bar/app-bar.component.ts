import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, DestroyRef, Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppBarItem } from 'app/interfaces/app-bar.interface';
import { MenuItem } from 'app/interfaces/menu-item.interface';
import { HarborIconComponent } from 'app/modules/harbor-icon/harbor-icon.component';
import { NavigationService } from 'app/services/navigation/navigation.service';
import { appBarOpened } from 'app/store/app-bar/app-bar.actions';
import { selectAppBarState } from 'app/store/app-bar/app-bar.selectors';

@Component({
  selector: 'ix-app-bar',
  templateUrl: './app-bar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HarborIconComponent, RouterLink, AsyncPipe, NgClass],
})
export class AppBarComponent implements OnInit {
  private store = inject(Store);
  private navService = inject(NavigationService);
  private destroyRef = inject(DestroyRef);

  readonly appBarState$ = this.store.select(selectAppBarState);
  readonly sortedAppBarState$ = this.appBarState$.pipe(
    map((items) => {
      const cleanedItems = items.map((item) => ({
        ...item,
        icon: this.formatIcon(item.icon),
        iconActive: this.formatIcon(item.iconActive),
      }));
      const desktopItem = cleanedItems.find((item) => item.state === 'desktop');
      if (!desktopItem) {
        return cleanedItems;
      }

      return [desktopItem, ...cleanedItems.filter((item) => item.state !== 'desktop')];
    }),
  );

  private router = inject(Router);

  ngOnInit(): void {
    const currentUrl = this.router.url;
    const currentPath = currentUrl.split('/').find(Boolean) || 'desktop';

    this.appBarState$.pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
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
              icon: this.formatIcon(matchedItem.icon),
              iconActive: this.formatIcon(matchedItem.iconActive),
              state: matchedItem.state,
              status: 'open',
            },
          }));
        }
      }
    });
  }

  private formatIcon(icon: string): string {
    return icon?.replace('mdi-monitor', 'desktop');
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
          icon: this.formatIcon(item.icon),
          iconActive: this.formatIcon(item.iconActive),
          state: item.state,
          status: 'open',
        },
      }));
    });
  }
}
