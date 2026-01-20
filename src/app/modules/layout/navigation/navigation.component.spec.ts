import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { MatNavListItemHarness } from '@angular/material/list/testing';
import { provideRouter, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MenuItemType } from 'app/interfaces/menu-item.interface';
import { NavigationComponent } from 'app/modules/layout/navigation/navigation.component';
import { SidenavService } from 'app/modules/layout/sidenav.service';
import { NavigationService } from 'app/services/navigation/navigation.service';

describe('NavigationComponent', () => {
  let spectator: Spectator<NavigationComponent>;
  let loader: HarnessLoader;
  let router: Router;

  const createComponent = createComponentFactory({
    component: NavigationComponent,
    providers: [
      provideRouter([
        { path: 'dashboard', children: [] },
        {
          path: 'credentials',
          children: [
            { path: 'users', children: [] },
            { path: 'groups', children: [] },
          ],
        },
      ]),
      mockProvider(NavigationService, {
        menuItems: [
          {
            name: 'Dashboard',
            type: MenuItemType.Link,
            tooltip: 'Dashboard',
            icon: 'dashboard',
            state: 'dashboard',
          },
          {
            name: 'Credentials',
            type: MenuItemType.SlideOut,
            tooltip: 'Credentials',
            icon: 'vpn_key',
            state: 'credentials',
            sub: [
              { name: 'Users', state: 'users' },
              { name: 'Groups', state: 'groups' },
            ],
          },
        ],
      }),
      mockProvider(SidenavService, {
        isOpenSecondaryMenu: false,
        menuName: '',
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    router = spectator.inject(Router);
  });

  async function isNavItemHighlighted(text: string): Promise<boolean> {
    const item = await loader.getHarness(MatNavListItemHarness.with({ text: new RegExp(text) }));
    const host = await item.host();
    return host.hasClass('highlighted');
  }

  describe('SlideOut item highlighting', () => {
    it('highlights Credentials when user navigates to a route under that section', fakeAsync(async () => {
      router.navigate(['/credentials/users']);
      tick();
      spectator.detectChanges();

      expect(await isNavItemHighlighted('Credentials')).toBe(true);
    }));

    it('does not highlight Credentials when user navigates elsewhere', fakeAsync(async () => {
      router.navigate(['/dashboard']);
      tick();
      spectator.detectChanges();

      expect(await isNavItemHighlighted('Credentials')).toBe(false);
    }));
  });

  describe('Link item highlighting', () => {
    it('highlights Dashboard when user navigates to dashboard', fakeAsync(async () => {
      router.navigate(['/dashboard']);
      tick();
      spectator.detectChanges();

      expect(await isNavItemHighlighted('Dashboard')).toBe(true);
    }));

    it('does not highlight Dashboard when user navigates elsewhere', fakeAsync(async () => {
      router.navigate(['/credentials/users']);
      tick();
      spectator.detectChanges();

      expect(await isNavItemHighlighted('Dashboard')).toBe(false);
    }));
  });
});
