import { Overlay } from '@angular/cdk/overlay';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatBadgeHarness } from '@angular/material/badge/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnDialog, TnIconHarness, TnSpriteLoaderService } from '@truenas/ui-components';
import { of } from 'rxjs';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { jobPanelClosed } from 'app/modules/jobs/store/job.actions';
import { selectIsJobPanelOpen, selectRunningJobsCount } from 'app/modules/jobs/store/job.selectors';
import { JobsIndicatorComponent } from 'app/modules/layout/topbar/jobs-indicator/jobs-indicator.component';

describe('JobsIndicatorComponent', () => {
  let spectator: Spectator<JobsIndicatorComponent>;
  let loader: HarnessLoader;
  const positionStrategy = { top: jest.fn().mockReturnThis(), right: jest.fn().mockReturnThis() };
  const createComponent = createComponentFactory({
    component: JobsIndicatorComponent,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectRunningJobsCount,
            value: 4,
          },
          {
            selector: selectIsJobPanelOpen,
            value: false,
          },
        ],
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of(undefined),
        })),
      }),
      mockProvider(Overlay, {
        position: jest.fn(() => ({ global: () => positionStrategy })),
      }),
      mockProvider(TnSpriteLoaderService, {
        ensureSpriteLoaded: jest.fn(() => Promise.resolve(true)),
        getIconUrl: jest.fn(),
        getSafeIconUrl: jest.fn(),
        isSpriteLoaded: jest.fn(() => true),
        getSpriteConfig: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows an icon with a badge for number of running jobs', async () => {
    const iconButton = await loader.getHarness(MatButtonHarness);
    const icon = await iconButton.getHarness(TnIconHarness);
    expect(await icon.getName()).toBe('clipboard-text');

    const badge = await loader.getHarness(MatBadgeHarness);
    expect(await badge.getText()).toBe('4');
  });

  it('opens JobsPanelComponent when isJobPanelOpen$ changes to true.', () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectIsJobPanelOpen, true);
    spectator.component.ngOnInit();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(JobsPanelComponent, expect.objectContaining({
      width: '420px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
    }));
  });

  it('emits jobPanelClosed() when jobs panel is closed', () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectIsJobPanelOpen, true);
    jest.spyOn(store$, 'dispatch');
    spectator.component.ngOnInit();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(JobsPanelComponent, expect.objectContaining({
      width: '420px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
    }));

    expect(store$.dispatch).toHaveBeenCalledWith(jobPanelClosed());
  });
});
