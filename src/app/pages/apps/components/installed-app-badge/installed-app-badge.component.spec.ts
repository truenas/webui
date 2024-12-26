import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { InstalledAppBadgeComponent } from 'app/pages/apps/components/installed-app-badge/installed-app-badge.component';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';

describe('InstalledAppBadgeComponent', () => {
  let spectator: Spectator<InstalledAppBadgeComponent>;

  const mockInstalledApps = [
    {
      name: 'App1',
      metadata: { train: 'stable' },
    },
  ];

  const createComponent = createComponentFactory({
    component: InstalledAppBadgeComponent,
    providers: [
      mockProvider(InstalledAppsStore, {
        installedApps$: of(mockInstalledApps),
      }),
      mockProvider(Router, {
        navigate: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app: { name: 'App1', train: 'stable' } as AvailableApp,
      },
    });
  });

  it('navigates to specific app when clicked and app is found', () => {
    spectator.component.navigateToAllInstalledPage();
    spectator.fixture.detectChanges();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
      '/apps',
      'installed',
      'stable',
      'App1',
    ]);
  });

  it('navigates to installed apps overview when clicked and app is not found', () => {
    spectator.setInput('app', { name: 'NonExistentApp', train: 'stable' });
    spectator.component.navigateToAllInstalledPage();
    spectator.fixture.detectChanges();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
      '/apps',
      'installed',
    ]);
  });
});
