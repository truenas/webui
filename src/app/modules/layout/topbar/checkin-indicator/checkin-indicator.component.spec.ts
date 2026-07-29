import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { TnIconButtonHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  CheckinIndicatorComponent,
} from 'app/modules/layout/topbar/checkin-indicator/checkin-indicator.component';
import { checkinIndicatorPressed } from 'app/store/network-interfaces/network-interfaces.actions';
import {
  selectHasPendingNetworkChanges,
  selectNetworkInterfacesCheckinWaiting,
} from 'app/store/network-interfaces/network-interfaces.selectors';

describe('CheckinIndicatorComponent', () => {
  let spectator: Spectator<CheckinIndicatorComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CheckinIndicatorComponent,
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectHasPendingNetworkChanges,
            value: true,
          },
          {
            selector: selectNetworkInterfacesCheckinWaiting,
            value: null,
          },
        ],
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows checkin indicator when there are pending network changes', async () => {
    const button = await loader.getHarness(TnIconButtonHarness);

    expect(await button.getName()).toBe('hub');
  });

  it('shows pending changes prompt when indicator is pressed', async () => {
    const button = await loader.getHarness(TnIconButtonHarness);
    await button.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Pending Network Changes',
      }),
    );
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system/network']);
  });

  it('dispatches checkinIndicatorPressed when indicator is pressed and checkin is waiting', async () => {
    const store$ = spectator.inject(MockStore);
    store$.overrideSelector(selectNetworkInterfacesCheckinWaiting, 50);
    store$.refreshState();
    jest.spyOn(store$, 'dispatch');

    const button = await loader.getHarness(TnIconButtonHarness);
    await button.click();

    expect(store$.dispatch).toHaveBeenCalledWith(checkinIndicatorPressed());
  });
});
