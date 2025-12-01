import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { MatNavList, MatListItem } from '@angular/material/list';
import {
  MatDrawerContainer,
  MatDrawer,
  MatDrawerContent,
} from '@angular/material/sidenav';
import { Router, RouterOutlet, RouterModule, NavigationEnd } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { SubMenuItem } from 'app/interfaces/menu-item.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { NavigationService } from 'app/services/navigation/navigation.service';

@UntilDestroy()
@Component({
  selector: 'ix-system',
  templateUrl: './system.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RouterOutlet,
    RouterModule,
    MatDrawerContainer,
    MatDrawer,
    MatDrawerContent,
    MatNavList,
    MatListItem,
    TranslateModule,
  ],
})
export class SystemComponent implements OnInit {
  private navService = inject(NavigationService);
  private router = inject(Router);

  menuItems = [] as SubMenuItem[];
  isHighlighted = 'general';

  ngOnInit(): void {
    this.buildMenuItems();
    this.setInitialHighlight();
    this.subscribeToRouteChanges();
  }

  updateHighlightedClass(state: string): void {
    this.isHighlighted = state;
  }

  private buildMenuItems(): void {
    this.menuItems = this.navService.menuItems.find((item) => item.state === 'system')?.sub;
  }

  private setInitialHighlight(): void {
    const currentUrl = this.router.url;
    const matchedState = this.getStateFromUrl(currentUrl);
    if (matchedState) {
      this.isHighlighted = matchedState;
    }
  }

  private subscribeToRouteChanges(): void {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      untilDestroyed(this),
    ).subscribe((event: NavigationEnd) => {
      const matchedState = this.getStateFromUrl(event.url);
      if (matchedState) {
        this.isHighlighted = matchedState;
      }
    });
  }

  private getStateFromUrl(url: string): string | null {
    // remove /system/ prefix
    const path = url.replace('/system/', '').split('?')[0];

    // find matching menu item
    const matchedItem = this.menuItems?.find((item) => path === item.state || path.startsWith(item.state + '/'));

    return matchedItem?.state || null;
  }
}
