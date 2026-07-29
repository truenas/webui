import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnDialog } from '@truenas/ui-components';
import { MockComponents, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AdvancedConfig } from 'app/interfaces/advanced-config.interface';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { AllTargetsComponent } from 'app/pages/sharing/iscsi/target/all-targets/all-targets.component';
import { TargetDetailsComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/target-details.component';
import { TargetListComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-list/target-list.component';
import { DeleteTargetDialog } from 'app/pages/sharing/iscsi/target/delete-target-dialog/delete-target-dialog.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { IscsiService } from 'app/services/iscsi.service';
import { selectAdvancedConfig } from 'app/store/system-config/system-config.selectors';

// this test suite is pretty minimal, since this component doesn't have a lot of user-facing
// functionality we need to test. regardless, since we introduced `onMobileDetailsClosed`,
// we need to test it to prevent regressions.
describe('AllTargetsComponent', () => {
  let spectator: Spectator<AllTargetsComponent>;
  const createComponent = createComponentFactory({
    component: AllTargetsComponent,
    declarations: [
      MockComponents(
        TargetListComponent,
        TargetDetailsComponent,
      ),
    ],
    providers: [
      mockAuth(),
      mockProvider(IscsiService, {
        getTargets: jest.fn(() => of([])),
        // Never emits: a synchronous emission would run the refresh handler
        // before ngOnInit assigns dataProvider.
        listenForDataRefresh: jest.fn(() => of()),
      }),
      mockProvider(TnDialog),
      mockProvider(FormSidePanelService),
      // ixDetailsHeight (in ix-master-detail-view) reads the systemConfig slice.
      provideMockStore({
        selectors: [
          {
            selector: selectAdvancedConfig,
            value: {} as AdvancedConfig,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    // ng-mocks doesn't auto-stub signal members; the template reads masterList.searchQuery().
    MockInstance(TargetListComponent, 'searchQuery', signal(''));
    spectator = createComponent();
  });

  afterEach(() => {
    MockInstance(TargetListComponent);
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should not be in mobile view by default', () => {
    expect(spectator.component.isMobileView()).toBe(false);
  });

  describe('detail-header actions', () => {
    const mockTarget = { id: 1, name: 'iSCSI-1' } as IscsiTarget;

    beforeEach(() => {
      // Expand a row so the detail header (and its Edit/Delete buttons) renders.
      // detectComponentChanges: expandedRow is a plain property, so the OnPush
      // root view must be refreshed unconditionally.
      spectator.component.dataProvider.expandedRow = mockTarget;
      spectator.detectComponentChanges();
    });

    it('opens the target form when "Edit" is pressed', async () => {
      const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
      await editButton.click();

      expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(TargetFormComponent, {
        title: 'Edit ISCSI Target',
        wide: true,
        inputs: { targetData: mockTarget },
      });
    });

    it('opens the delete dialog when "Delete" is pressed', async () => {
      const tnDialog = spectator.inject(TnDialog);
      jest.spyOn(tnDialog, 'open').mockReturnValue({ closed: of(false) } as ReturnType<TnDialog['open']>);

      const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
      await deleteButton.click();

      expect(tnDialog.open).toHaveBeenCalledWith(DeleteTargetDialog, { data: mockTarget, width: '600px' });
    });
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
