import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MenuItem, MenuItemType } from 'app/interfaces/menu-item.interface';
import { NavigationComponent } from 'app/modules/layout/navigation/navigation.component';
import { NavigationService } from 'app/services/navigation/navigation.service';

describe('NavigationComponent', () => {
  let spectator: Spectator<NavigationComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: NavigationComponent,
  });

  it('should show the tooltip when sidenav is open', async () => {
    spectator = createComponent({
      props: {
        isSidenavCollapsed: false,
      },
      providers: [
        mockProvider(NavigationService, {
          menuItems: [
            {
              name: 'Dashboard',
              type: MenuItemType.Link,
              tooltip: 'Dashboard',
              showTooltipAlways: true,
              icon: 'dashboard',
              state: 'dashboard',
            },
          ] as MenuItem[],
        }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const tooltipHarness = await loader.getHarness(MatTooltipHarness);
    await tooltipHarness.show();
    expect(await tooltipHarness.getTooltipText()).toBe('Dashboard');
  });

  it('should not show the tooltip when sidenav is open', async () => {
    spectator = createComponent({
      props: {
        isSidenavCollapsed: false,
      },
      providers: [
        mockProvider(NavigationService, {
          menuItems: [
            {
              name: 'Dashboard',
              type: MenuItemType.Link,
              tooltip: 'Dashboard',
              icon: 'dashboard',
              state: 'dashboard',
            },
          ] as MenuItem[],
        }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const tooltipHarness = await loader.getHarness(MatTooltipHarness);
    await tooltipHarness.show();
    expect(await tooltipHarness.getTooltipText()).toBe('');
  });

  it('should show the tooltip when sidenav is closed', async () => {
    spectator = createComponent({
      props: {
        isSidenavCollapsed: true,
      },
      providers: [
        mockProvider(NavigationService, {
          menuItems: [
            {
              name: 'Dashboard',
              type: MenuItemType.Link,
              tooltip: 'Dashboard',
              icon: 'dashboard',
              state: 'dashboard',
            },
          ] as MenuItem[],
        }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const tooltipHarness = await loader.getHarness(MatTooltipHarness);
    await tooltipHarness.show();
    expect(await tooltipHarness.getTooltipText()).toBe('Dashboard');
  });

  it('should not show the tooltip when no tooltip', async () => {
    spectator = createComponent({
      props: {
        isSidenavCollapsed: true,
      },
      providers: [
        mockProvider(NavigationService, {
          menuItems: [
            {
              name: 'Dashboard',
              type: MenuItemType.Link,
              icon: 'dashboard',
              state: 'dashboard',
            },
          ] as MenuItem[],
        }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const tooltipHarness = await loader.getHarness(MatTooltipHarness);
    await tooltipHarness.show();
    expect(await tooltipHarness.getTooltipText()).toBe('');
  });
});
