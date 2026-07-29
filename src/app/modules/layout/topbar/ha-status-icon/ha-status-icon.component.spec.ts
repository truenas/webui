import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnDialog, TnIconButtonHarness } from '@truenas/ui-components';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { HaStatus } from 'app/interfaces/events/ha-status-event.interface';
import { HaStatusIconComponent } from 'app/modules/layout/topbar/ha-status-icon/ha-status-icon.component';
import {
  HaStatusPopoverComponent,
} from 'app/modules/layout/topbar/ha-status-icon/ha-status-popover/ha-status-popover.component';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

describe('HaStatusIconComponent', () => {
  let spectator: Spectator<HaStatusIconComponent>;
  let loader: HarnessLoader;
  let mockStore$: MockStore;
  const createComponent = createComponentFactory({
    component: HaStatusIconComponent,
    providers: [
      mockProvider(TnDialog),
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
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    mockStore$ = spectator.inject(MockStore);
  });

  it('shows an icon when HA is enabled', async () => {
    const button = await loader.getHarness(TnIconButtonHarness);
    expect(await button.getName()).toBe('tn-ha-enabled');
  });

  it('shows a reconnecting icon when HA disabled reason is NoSystemReady', async () => {
    mockStore$.overrideSelector(selectHaStatus, {
      hasHa: false,
      reasons: [FailoverDisabledReason.NoSystemReady],
    });
    mockStore$.refreshState();
    spectator.detectChanges();

    const button = await loader.getHarness(TnIconButtonHarness);
    expect(await button.getName()).toBe('tn-ha-reconnecting');
  });

  it('shows an HA disabled icon when HA is disabled', async () => {
    mockStore$.overrideSelector(selectHaStatus, {
      hasHa: false,
      reasons: [FailoverDisabledReason.MismatchDisks],
    });
    mockStore$.refreshState();
    spectator.detectChanges();

    const button = await loader.getHarness(TnIconButtonHarness);
    expect(await button.getName()).toBe('tn-ha-disabled');
  });

  it('opens status popover when icon is clicked', async () => {
    const button = await loader.getHarness(TnIconButtonHarness);
    await button.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
      HaStatusPopoverComponent,
      expect.objectContaining({
        data: [],
        panelClass: 'topbar-panel',
      }),
    );
  });
});
