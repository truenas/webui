import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { HaStatusIconComponent } from 'app/modules/layout/topbar/ha-status-icon/ha-status-icon.component';
import {
  HaStatusPopoverComponent,
} from 'app/modules/layout/topbar/ha-status-icon/ha-status-popover/ha-status-popover.component';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

describe('HaStatusIconComponent', () => {
  let spectator: Spectator<HaStatusIconComponent>;
  let mockStore$: MockStore;
  const createComponent = createComponentFactory({
    component: HaStatusIconComponent,
    declarations: [
      MockComponent(IxIconComponent),
    ],
    providers: [
      mockProvider(MatDialog),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            selector: selectHaStatus,
            value: {
              hasHa: true,
              reasons: [],
            } as HaStatus,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    mockStore$ = spectator.inject(MockStore);
  });

  it('shows an icon when HA is enabled', () => {
    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'ix-ha-enabled');
  });

  it('shows a reconnecting icon when HA disabled reason is NoSystemReady', () => {
    mockStore$.overrideSelector(selectHaStatus, {
      hasHa: false,
      reasons: [FailoverDisabledReason.NoSystemReady],
    });
    mockStore$.refreshState();
    spectator.detectChanges();

    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'ix-ha-reconnecting');
  });

  it('shows an HA disabled icon when HA is disabled', () => {
    mockStore$.overrideSelector(selectHaStatus, {
      hasHa: false,
      reasons: [FailoverDisabledReason.MismatchDisks],
    });
    mockStore$.refreshState();
    spectator.detectChanges();

    expect(spectator.query('ix-icon')).toHaveAttribute('name', 'ix-ha-disabled');
  });

  it('opens status popover when icon is clicked', () => {
    spectator.click('button');

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      HaStatusPopoverComponent,
      expect.objectContaining({
        data: [],
        panelClass: 'topbar-panel',
      }),
    );
  });
});
