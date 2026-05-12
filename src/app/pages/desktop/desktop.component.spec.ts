import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { MenuItemType } from 'app/interfaces/menu-item.interface';
import { DesktopComponent } from 'app/pages/desktop/desktop.component';
import { NavigationService } from 'app/services/navigation/navigation.service';

describe('DesktopComponent', () => {
  let spectator: Spectator<DesktopComponent>;
  const createComponent = createComponentFactory({
    component: DesktopComponent,
    providers: [
      mockProvider(Store, {
        dispatch: jest.fn(),
      }),
      mockProvider(NavigationService, {
        menuItems: [
          {
            name: 'Harbor Assistant',
            type: MenuItemType.Link,
            state: 'harbor-assistant',
            icon: 'app-desktop-harbor-assistant',
            iconActive: 'app-desktop-harbor-assistant-active',
          },
          {
            name: 'Dashboard',
            type: MenuItemType.Link,
            state: 'dashboard',
            icon: 'app-desktop-dashboard',
            iconActive: 'app-desktop-dashboard-active',
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('hides Harbor Assistant from desktop shortcuts only', () => {
    expect(spectator.component.menuItems.map((item) => item.state)).toEqual(['dashboard']);
  });
});
