import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnEmptyHarness } from '@truenas/ui-components';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi, mockTypedJob } from 'app/core/testing/utils/mock-typed-api.utils';
import { JobState } from 'app/enums/job-state.enum';
import { IpmiEvent } from 'app/interfaces/ipmi.interface';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  IpmiEventsDialog,
} from 'app/pages/system/network/components/ipmi-card/ipmi-events-dialog/ipmi-events-dialog.component';

describe('IpmiEventsDialogComponent', () => {
  let spectator: Spectator<IpmiEventsDialog>;
  let loader: HarnessLoader;
  const sampleEvents = [
    {
      id: '1',
      date: 'Jan-12-2023',
      time: '14:23:00',
      name: 'Sensor #1',
      event_direction: 'Assertion Event',
      event: 'Invalid Password Disable',
    },
    {
      id: '2',
      date: 'Jan-14-2023',
      time: '15:10:00',
      name: 'Sensor #2',
      event_direction: 'Assertion Event',
      event: 'Another Event',
    },
  ] as IpmiEvent[];

  const createComponent = createComponentFactory({
    component: IpmiEventsDialog,
    declarations: [
      FakeFormatDateTimePipe,
      FakeProgressBarComponent,
    ],
    providers: [
      mockProvider(DialogRef),
      mockTypedApi([
        mockTypedJob('ipmi.sel.clear', { state: JobState.Success }),
      ]),
    ],
    detectChanges: false,
  });

  async function setupTest(listedEvents: IpmiEvent[]): Promise<void> {
    spectator = createComponent();
    spectator.inject(MockTypedApiService).mockJob('ipmi.sel.elist', { state: JobState.Success, result: listedEvents });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.detectChanges();
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  describe('with events', () => {
    beforeEach(async () => {
      await setupTest(sampleEvents);
    });

    it('shows list of IPMI events', () => {
      expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('ipmi.sel.elist');

      const events = spectator.queryAll('.event');
      expect(events).toHaveLength(2);
      expect(events[0].querySelector('.event-header')).toHaveText('2023-01-14 15:10:00 Sensor #2 — Assertion Event');
      expect(events[0].querySelector('.event-description')).toHaveText('Another Event');
      expect(events[1].querySelector('.event-header')).toHaveText('2023-01-12 14:23:00 Sensor #1 — Assertion Event');
      expect(events[1].querySelector('.event-description')).toHaveText('Invalid Password Disable');
    });

    it('clears IPMI events when Clear button is pressed', async () => {
      const clearButton = await loader.getHarness(TnButtonHarness.with({ label: 'Clear' }));
      await clearButton.click();

      expect(spectator.inject(TypedApiService).job).toHaveBeenCalledWith('ipmi.sel.clear');
    });
  });

  describe('no events', () => {
    beforeEach(async () => {
      await setupTest([]);
    });

    it('does not show Clear button', async () => {
      const clearButton = await loader.getHarnessOrNull(TnButtonHarness.with({ label: 'Clear' }));
      expect(clearButton).toBeNull();
    });

    it('shows empty state', async () => {
      const empty = await loader.getHarness(TnEmptyHarness);
      expect(await empty.getTitle()).toBe('No events to display.');
    });
  });
});
