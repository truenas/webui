import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScrubAction } from 'app/enums/pool-scrub-action.enum';
import { Pool, PoolScanUpdate } from 'app/interfaces/pool.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ActivePoolScanComponent } from './active-pool-scan.component';

describe('ActivePoolScanComponent', () => {
  let spectator: Spectator<ActivePoolScanComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ActivePoolScanComponent,
    providers: [
      mockProvider(ApiService, {
        startJob: jest.fn(() => of(undefined)),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  function setupTest(scan: PoolScanUpdate): void {
    spectator = createComponent({
      props: {
        scan,
        pool: {
          id: 1,
        } as Pool,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('scrub is running', () => {
    beforeEach(() => {
      setupTest({
        function: PoolScanFunction.Scrub,
        state: PoolScanState.Scanning,
        percentage: 50,
        total_secs_left: 1000,
      } as PoolScanUpdate);
    });

    it('shows current progress', async () => {
      const description = spectator.query('.scan-description');
      expect(description).toHaveText('Scrub In Progress:  50.00%');

      const progressBar = await loader.getHarness(MatProgressBarHarness);
      expect(await progressBar.getValue()).toBe(50);
    });

    it('shows time left', () => {
      const timeLeft = spectator.query('.time-left');
      expect(timeLeft).toHaveText('16 minutes 40 seconds remaining');
    });

    it('stops scrub when Stop Scrub is pressed', async () => {
      const stopButton = await loader.getHarness(MatButtonHarness.with({ text: 'Stop Scrub' }));
      await stopButton.click();

      expect(spectator.inject(ApiService).startJob).toHaveBeenCalledWith('pool.scrub', [1, PoolScrubAction.Stop]);
    });

    it('pauses scrub when Pause Scrub is pressed', async () => {
      const pauseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Pause Scrub' }));
      await pauseButton.click();

      expect(spectator.inject(ApiService).startJob).toHaveBeenCalledWith('pool.scrub', [1, PoolScrubAction.Pause]);
    });
  });

  describe('scrub is paused', () => {
    beforeEach(() => {
      setupTest({
        function: PoolScanFunction.Scrub,
        state: PoolScanState.Scanning,
        pause: {
          $date: 123456789,
        },
        percentage: 50,
        total_secs_left: 1000,
      } as PoolScanUpdate);
    });

    it('shows current progress', async () => {
      const description = spectator.query('.scan-description');
      expect(description).toHaveText('Scrub Paused  50.00%');

      const progressBar = await loader.getHarness(MatProgressBarHarness);
      expect(await progressBar.getValue()).toBe(50);
    });

    it('resumes scrub when Resume Scrub is pressed', async () => {
      const resumeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Resume Scrub' }));
      await resumeButton.click();

      expect(spectator.inject(ApiService).startJob).toHaveBeenCalledWith('pool.scrub', [1, PoolScrubAction.Start]);
    });
  });

  describe('resilvering is running', () => {
    beforeEach(() => {
      setupTest({
        function: PoolScanFunction.Resilver,
        state: PoolScanState.Scanning,
        percentage: 50,
        total_secs_left: 1000,
      } as PoolScanUpdate);
    });

    it('shows current progress', async () => {
      const description = spectator.query('.scan-description');
      expect(description).toHaveText('Resilvering:  50.00%');

      const progressBar = await loader.getHarness(MatProgressBarHarness);
      expect(await progressBar.getValue()).toBe(50);
    });

    it('shows time left', () => {
      const timeLeft = spectator.query('.time-left');
      expect(timeLeft).toHaveText('16 minutes 40 seconds remaining');
    });

    it('does not show buttons to controls scrub', async () => {
      const buttons = await loader.getAllHarnesses(MatButtonHarness);
      expect(buttons).toHaveLength(0);
    });
  });
});
