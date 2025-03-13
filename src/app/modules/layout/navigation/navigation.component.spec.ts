import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MenuItemType } from 'app/interfaces/menu-item.interface';
import { NavigationComponent } from 'app/modules/layout/navigation/navigation.component';
import { NavigationService } from 'app/services/navigation/navigation.service';

describe('NavigationComponent', () => {
  let spectator: Spectator<NavigationComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: NavigationComponent,
    providers: [
      mockProvider(NavigationService, {
        menuItems: [
          {
            name: 'Dashboard',
            type: MenuItemType.Link,
            tooltip: 'Dashboard',
            hideTooltipOnSidebarCollapsed: false,
            icon: 'dashboard',
            state: 'dashboard',
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        isSidenavCollapsed: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should show the tooltip', async () => {
    const tooltipHarness = await loader.getHarness(MatTooltipHarness);
    await tooltipHarness.show();
    expect(await tooltipHarness.getTooltipText()).toBe('Dashboard');
  });
});
