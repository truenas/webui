import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnCardComponent } from '@truenas/ui-components';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { CloudBackupScheduleComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-schedule/cloud-backup-schedule.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectTimezone } from 'app/store/system-config/system-config.selectors';

const testBackup = {
  description: 'test',
  schedule: {
    minute: '0',
    hour: '0',
    dom: '*',
    month: '*',
    dow: '0',
  },
  enabled: true,
} as CloudBackup;

describe('CloudBackupScheduleComponent', () => {
  let spectator: Spectator<CloudBackupScheduleComponent>;

  const createComponent = createComponentFactory({
    component: CloudBackupScheduleComponent,
    providers: [
      mockApi(),
      provideMockStore({
        selectors: [
          {
            selector: selectTimezone,
            value: 'America/New_York',
          },
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        backup: testBackup,
      },
    });
  });

  it('checks card title', () => {
    // Read the tn-card input rather than its internal <h3>, which is library markup.
    expect(spectator.query(TnCardComponent)!.title()).toBe('Schedule');
  });

  it('renders Details in card', () => {
    const chartExtra = spectator.queryAll('tn-card p');
    expect(chartExtra).toHaveLength(3);
    expect(chartExtra[0]).toHaveText('Task Name: test');
    expect(chartExtra[1]).toHaveText('Frequency: At 00:00 (12:00 AM), only on Sunday');
    expect(chartExtra[2]).toHaveText('Schedule: 0 0 * * 0');
  });
});
