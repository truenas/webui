import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatNavList, MatListItem } from '@angular/material/list';
import { MatTooltip } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLinkActive, RouterLink } from '@angular/router';
import { TnIconComponent } from '@ixsystems/truenas-ui';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { MenuItem, MenuItemType, SubMenuItem } from 'app/interfaces/menu-item.interface';
import { SidenavService } from 'app/modules/layout/sidenav.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { NavigationService } from 'app/services/navigation/navigation.service';

@Component({
  selector: 'ix-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatNavList,
    MatListItem,
    RouterLinkActive,
    RouterLink,
    MatTooltip,
    TnIconComponent,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class NavigationComponent {
  private navService = inject(NavigationService);
  private sidenavService = inject(SidenavService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly isSidenavCollapsed = input(false);

  readonly menuToggled = output<[string, SubMenuItem[]]>();
  readonly menuClosed = output();

  menuItems = this.navService.menuItems;

  readonly MenuItemType = MenuItemType;

  constructor() {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  toggleMenu(state: string, sub: SubMenuItem[]): void {
    this.menuToggled.emit([state, sub]);
  }

  closeMenu(): void {
    this.menuClosed.emit();
  }

  protected isSlideOutActive(state: string): boolean {
    return this.router.isActive(state, {
      paths: 'subset',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  protected isMenuExpanded(state: string): boolean {
    return this.sidenavService.isOpenSecondaryMenu && this.sidenavService.menuName === state;
  }

  getItemName(item: MenuItem): string {
    return `${item.name.replace(' ', '_')}-menu`;
  }

  getRouterLink(url: string): string[] {
    return ['/', ...url.split('/')];
  }
}
