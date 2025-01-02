import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { IpmiEvent } from 'app/interfaces/ipmi.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  IpmiEventsDialogComponent,
} from 'app/pages/network/components/ipmi-card/ipmi-events-dialog/ipmi-events-dialog.component';

describe('IpmiEventsDialogComponent', () => {
  let spectator: Spectator<IpmiEventsDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: IpmiEventsDialogComponent,
    declarations: [
      FakeFormatDateTimePipe,
      EmptyComponent,
      FakeProgressBarComponent,
    ],
    providers: [
      mockApi([
        mockJob('ipmi.sel.elist', fakeSuccessfulJob([
          {
            id: 1,
            date: 'Jan-12-2023',
            time: '14:23:00',
            name: 'Sensor #1',
            event_direction: 'Assertion Event',
            event: 'Invalid Password Disable',
          },
          {
            id: 1,
            date: 'Jan-14-2023',
            time: '15:10:00',
            name: 'Sensor #2',
            event_direction: 'Assertion Event',
            event: 'Another Event',
          },
        ] as IpmiEvent[])),
        mockJob('ipmi.sel.clear', fakeSuccessfulJob()),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows list of IPMI events', () => {
    const events = spectator.queryAll('.event');
    expect(events).toHaveLength(2);
    expect(events[0].querySelector('.event-header')).toHaveText('2023-01-14 15:10:00 Sensor #2 — Assertion Event');
    expect(events[0].querySelector('.event-description')).toHaveText('Another Event');
    expect(events[1].querySelector('.event-header')).toHaveText('2023-01-12 14:23:00 Sensor #1 — Assertion Event');
    expect(events[1].querySelector('.event-description')).toHaveText('Invalid Password Disable');
  });

  it('clears IPMI events when Clear button is pressed', async () => {
    const clearButton = await loader.getHarness(MatButtonHarness.with({ text: 'Clear' }));
    await clearButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('ipmi.sel.clear');
  });

  describe('no events', () => {
    beforeEach(() => {
      const mockedApi = spectator.inject(MockApiService);
      mockedApi.mockJob('ipmi.sel.elist', fakeSuccessfulJob([] as IpmiEvent[]));

      spectator.component.ngOnInit();
      spectator.detectChanges();
    });

    it('does not show Clear button', async () => {
      const clearButton = await loader.getHarnessOrNull(MatButtonHarness.with({ text: 'Clear' }));
      expect(clearButton).toBeNull();
    });

    it('shows empty state', () => {
      expect(spectator.query('.events-container')).toHaveText('No events to display.');
    });
  });
});
