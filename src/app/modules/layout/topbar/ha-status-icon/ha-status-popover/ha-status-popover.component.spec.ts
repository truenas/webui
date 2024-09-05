import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import {
  HaStatusPopoverComponent,
} from 'app/modules/layout/topbar/ha-status-icon/ha-status-popover/ha-status-popover.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

describe('HaStatusPopoverComponent', () => {
  let spectator: Spectator<HaStatusPopoverComponent>;
  const createComponent = createComponentFactory({
    component: HaStatusPopoverComponent,
    imports: [MapValuePipe],
  });

  it('shows status when HA is enabled', () => {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: [],
        },
      ],
    });

    expect(spectator.query('.status-line')).toHaveText('HA is enabled');
  });

  it('shows status and disabled reasons when HA is disabled', () => {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: [
            FailoverDisabledReason.NoVip,
            FailoverDisabledReason.NoPong,
          ],
        },
      ],
    });

    expect(spectator.query('.status-line')).toHaveText('HA is disabled');

    const disabledReasons = spectator.queryAll('.disabled-reasons li');
    expect(disabledReasons[0]).toHaveText('No interfaces configured with Virtual IP.');
    expect(disabledReasons[1]).toHaveText('Other TrueNAS controller cannot be reached.');
  });
});
