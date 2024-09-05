import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatBadgeHarness } from '@angular/material/badge/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatIconHarness } from '@angular/material/icon/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { JobsPanelComponent } from 'app/modules/jobs/components/jobs-panel/jobs-panel.component';
import { jobPanelClosed } from 'app/modules/jobs/store/job.actions';
import { selectIsJobPanelOpen, selectRunningJobsCount } from 'app/modules/jobs/store/job.selectors';
import { JobsIndicatorComponent } from 'app/modules/layout/topbar/jobs-indicator/jobs-indicator.component';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';

describe('JobsIndicatorComponent', () => {
  let spectator: Spectator<JobsIndicatorComponent>;
  let loader: HarnessLoader;
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
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          beforeClosed: () => of(undefined),
        })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows an icon with a badge for number of running jobs', async () => {
    const iconButton = await loader.getHarness(MatButtonHarness);
    const icon = await iconButton.getHarness(MatIconHarness);
    expect(await icon.getName()).toMatch('assignment');

    const badge = await loader.getHarness(MatBadgeHarness);
    expect(await badge.getText()).toBe('4');
  });

  it('opens JobsPanelComponent when isJobPanelOpen$ changes to true.', () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectIsJobPanelOpen, true);
    spectator.component.ngOnInit();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(JobsPanelComponent, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: topbarDialogPosition,
    });
  });

  it('emits jobPanelClosed() when jobs panel is closed', () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectIsJobPanelOpen, true);
    jest.spyOn(store$, 'dispatch');
    spectator.component.ngOnInit();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(JobsPanelComponent, {
      width: '400px',
      hasBackdrop: true,
      panelClass: 'topbar-panel',
      position: topbarDialogPosition,
    });

    expect(store$.dispatch).toHaveBeenCalledWith(jobPanelClosed());
  });
});
