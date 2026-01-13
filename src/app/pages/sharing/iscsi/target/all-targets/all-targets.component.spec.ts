import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { AllTargetsComponent } from 'app/pages/sharing/iscsi/target/all-targets/all-targets.component';
import { IscsiService } from 'app/services/iscsi.service';

// this test suite is pretty minimal, since this component doesn't have a lot of user-facing
// functionality we need to test. regardless, since we introduced `onMobileDetailsClosed`,
// we need to test it to prevent regressions.
describe('AllTargetsComponent', () => {
  let spectator: Spectator<AllTargetsComponent>;
  const createComponent = createComponentFactory({
    component: AllTargetsComponent,
    providers: [
      mockProvider(IscsiService, {
        getTargets: jest.fn(() => of([])),
        listenForDataRefresh: jest.fn(() => of(null)),
      }),
      mockProvider(MatDialog),
      mockProvider(SlideIn),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should not be in mobile view by default', () => {
    expect(spectator.component.isMobileView()).toBe(false);
  });

  describe('onMobileDetailsClosed', () => {
    it('clears the selected target when in mobile view', () => {
      // pretend we're in mobile view
      jest.spyOn(spectator.component, 'isMobileView').mockReturnValue(true);

      // create a mock data provider and rig it to the component
      // we have to use `Object.defineProperty` here since they're protected values, and we don't
      // have a way to mock them otherwise. this is generally ill-advised, but in such a small case it's permissible.
      const mockTarget = { id: 1, name: 'iSCSI-1' } as IscsiTarget;
      const dataProvider = new AsyncDataProvider(of([mockTarget]));
      dataProvider.expandedRow = mockTarget;
      Object.defineProperty(spectator.component, 'dataProvider', {
        value: dataProvider,
      });

      // ensure the component nullifies the expanded row when we're in the mobile view
      spectator.component.onMobileDetailsClosed();
      expect(dataProvider.expandedRow).toBeNull();
    });

    it('keeps the selected target when not in mobile view', () => {
      jest.spyOn(spectator.component, 'isMobileView').mockReturnValue(false);

      const mockTarget = { id: 1, name: 'iSCSI-1' } as IscsiTarget;
      const dataProvider = new AsyncDataProvider(of([mockTarget]));
      dataProvider.expandedRow = mockTarget;
      Object.defineProperty(spectator.component, 'dataProvider', {
        value: dataProvider,
      });

      spectator.component.onMobileDetailsClosed();
      expect(dataProvider.expandedRow).not.toBeNull();
      expect(dataProvider.expandedRow).toBe(mockTarget);
    });
  });
});
