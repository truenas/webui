import { BreakpointObserver } from '@angular/cdk/layout';
import { SpectatorService, createServiceFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject } from 'rxjs';
import { VirtualizationViewStore } from 'app/pages/virtualization/stores/virtualization-view.store';

describe('VirtualizationViewStore', () => {
  let spectator: SpectatorService<VirtualizationViewStore>;
  const breakpointObserve$ = new BehaviorSubject({ matches: true });
  const createService = createServiceFactory({
    service: VirtualizationViewStore,
    providers: [
      mockProvider(BreakpointObserver, {
        observe: jest.fn(() => breakpointObserve$),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  it('should have default empty state', () => {
    spectator.service.initialize();

    expect(spectator.service.stateAsSignal()).toEqual({
      showMobileDetails: false,
      isMobileView: true,
    });
  });

  describe('initialize', () => {
    beforeEach(() => spectator.service.initialize());

    it('listens for screen size changes and sets isMobile accordingly', () => {
      expect(spectator.service.isMobileView()).toBeTruthy();

      breakpointObserve$.next({ matches: false });
      expect(spectator.service.isMobileView()).toBeFalsy();
    });
  });
});
