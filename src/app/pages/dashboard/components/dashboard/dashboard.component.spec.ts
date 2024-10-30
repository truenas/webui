import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NgTemplateOutlet } from '@angular/common';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent, MockDirective } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { BehaviorSubject, of } from 'rxjs';
import {
  DisableFocusableElementsDirective,
} from 'app/directives/disable-focusable-elements/disable-focusable-elements.directive';
import { NewFeatureIndicatorDirective } from 'app/directives/new-feature-indicator/new-feature-indicator.directive';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxDragHandleDirective } from 'app/modules/ix-drop-grid/ix-drag-handle.directive';
import { IxDragDirective } from 'app/modules/ix-drop-grid/ix-drag.directive';
import { IxDropGridItemDirective } from 'app/modules/ix-drop-grid/ix-drop-grid-item.directive';
import { IxDropGridDirective } from 'app/modules/ix-drop-grid/ix-drop-grid.directive';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DashboardComponent } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import {
  WidgetGroupControlsComponent,
} from 'app/pages/dashboard/components/dashboard/widget-group-controls/widget-group-controls.component';
import { WidgetGroupComponent } from 'app/pages/dashboard/components/widget-group/widget-group.component';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { DashboardStore } from 'app/pages/dashboard/services/dashboard.store';
import { getDefaultWidgets } from 'app/pages/dashboard/services/get-default-widgets';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { ChainedComponentResponse, ChainedSlideInService } from 'app/services/chained-slide-in.service';

describe('DashboardComponent', () => {
  const groupA: WidgetGroup = { layout: WidgetGroupLayout.Full, slots: [] };
  const groupB: WidgetGroup = { layout: WidgetGroupLayout.Halves, slots: [] };
  const groupC: WidgetGroup = { layout: WidgetGroupLayout.QuartersAndHalf, slots: [] };
  const groupD: WidgetGroup = { layout: WidgetGroupLayout.HalfAndQuarters, slots: [] };
  const defaultGroups = [groupA, groupB, groupC, groupD];
  const groups$ = new BehaviorSubject(defaultGroups);
  const isLoading$ = new BehaviorSubject(false);

  let spectator: Spectator<DashboardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DashboardComponent,
    imports: [
      NgTemplateOutlet,
      WidgetGroupControlsComponent,
      MockComponent(PageHeaderComponent),
      MockComponent(WidgetGroupComponent),
      MockDirective(IxDropGridDirective),
      MockDirective(IxDropGridItemDirective),
      MockDirective(IxDragDirective),
      MockDirective(IxDragHandleDirective),
      NewFeatureIndicatorDirective,
      DisableFocusableElementsDirective,
    ],
    componentProviders: [
      mockProvider(WidgetResourcesService),
      mockProvider(DashboardStore, {
        groups$,
        isLoading$,
        entered: jest.fn(),
        save: jest.fn(() => of(undefined)),
      }),
    ],
    providers: [
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({ error: false, response: groupA })),
      }),
      mockProvider(SnackbarService),
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  async function enterConfiguration(): Promise<void> {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();
  }

  describe('loading', () => {
    it('initializes store when user enters the dashboard', () => {
      expect(spectator.inject(DashboardStore, true).entered).toHaveBeenCalled();
    });

    it('shows skeleton loader when loading for first time', () => {
      isLoading$.next(true);
      groups$.next(null);
      spectator.detectChanges();
      expect(spectator.query(NgxSkeletonLoaderComponent)).toExist();

      groups$.next(defaultGroups);
      isLoading$.next(false);
      spectator.detectChanges();
      expect(spectator.query(NgxSkeletonLoaderComponent)).not.toExist();
    });

    it('renders widgets that were loaded', () => {
      const groups = spectator.queryAll(WidgetGroupComponent);
      expect(groups).toHaveLength(4);
      expect(groups[0].group).toEqual(groupA);
      expect(groups[1].group).toEqual(groupB);
      expect(groups[2].group).toEqual(groupC);
      expect(groups[3].group).toEqual(groupD);
    });
  });

  describe('configuration - editing', () => {
    beforeEach(async () => {
      await enterConfiguration();
    });

    it('enters configuration mode when Configure is pressed', () => {
      const containers = spectator.queryAll('.group-container');
      expect(containers[0]).toHaveClass('editing');
    });

    it('opens slide in to edit a widget when edit icon is pressed', async () => {
      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      expect(spectator.inject(ChainedSlideInService).open)
        .toHaveBeenCalledWith(WidgetGroupFormComponent, true, groupA);
    });

    it('updates a widget group after group is edited in WidgetGroupComponent', async () => {
      const updatedGroup = { ...groupA, layout: WidgetGroupLayout.Halves };

      jest.spyOn(spectator.inject(ChainedSlideInService), 'open')
        .mockReturnValue(of({ response: updatedGroup } as ChainedComponentResponse));

      const editIcon = await loader.getHarness(IxIconHarness.with({ name: 'edit' }));
      await editIcon.click();

      const groups = spectator.queryAll(WidgetGroupComponent);
      expect(groups).toHaveLength(4);
      expect(groups[0].group).toEqual(updatedGroup);
      expect(groups[1].group).toEqual(groupB);
      expect(groups[2].group).toEqual(groupC);
      expect(groups[3].group).toEqual(groupD);
    });

    it('removes a widget when delete button is pressed', async () => {
      const deleteIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-delete' }));
      await deleteIcon.click();

      const groups = spectator.queryAll(WidgetGroupComponent);
      expect(groups).toHaveLength(3);
      expect(groups[0].group).toEqual(groupB);
      expect(groups[1].group).toEqual(groupC);
      expect(groups[2].group).toEqual(groupD);
    });

    it('adds a new widget and opens a slide in when Add is pressed', async () => {
      const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
      await addButton.click();

      expect(spectator.inject(ChainedSlideInService).open)
        .toHaveBeenCalledWith(WidgetGroupFormComponent, true);
    });

    it('resets configuration to defaults with confirmation when Reset is pressed', async () => {
      const resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Reset' }));
      await resetButton.click();

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Default widgets restored');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(DashboardStore, true).save).toHaveBeenCalledWith(getDefaultWidgets());
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Dashboard settings saved');
    });

    it('saves new configuration when Save is pressed', async () => {
      const deleteIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-delete' }));
      await deleteIcon.click();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(DashboardStore, true).save).toHaveBeenCalledWith([groupB, groupC, groupD]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Dashboard settings saved');
    });

    it('reverts to loaded configuration when Cancel button is pressed', async () => {
      const deleteIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-delete' }));
      await deleteIcon.click();

      const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
      await cancelButton.click();

      const groups = spectator.queryAll(WidgetGroupComponent);
      expect(groups).toHaveLength(4);
      expect(groups[0].group).toEqual(groupA);
    });

    it('reverts to loaded configuration when Escape is pressed', async () => {
      const deleteIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-delete' }));
      await deleteIcon.click();

      spectator.dispatchKeyboardEvent(spectator.debugElement, 'keydown', 'Escape');

      const groups = spectator.queryAll(WidgetGroupComponent);
      expect(groups).toHaveLength(4);
      expect(groups[0].group).toEqual(groupA);
    });
  });

  describe('configuration - moving', () => {
    beforeEach(async () => {
      await enterConfiguration();
    });

    it('moves widget up when widget is moved down via button on mobile', async () => {
      const moveIcons = await loader.getAllHarnesses(IxIconHarness.with({ name: 'mdi-menu-up' }));
      await moveIcons[1].click();

      const groups = spectator.queryAll(WidgetGroupComponent);
      expect(groups[0].group).toEqual(groupB);
      expect(groups[1].group).toEqual(groupA);
      expect(groups[2].group).toEqual(groupC);
      expect(groups[3].group).toEqual(groupD);
    });

    it('moves widget down when widget is moved down via button on mobile', async () => {
      const moveIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-menu-down' }));
      await moveIcon.click();

      const groups = spectator.queryAll(WidgetGroupComponent);
      expect(groups[0].group).toEqual(groupB);
      expect(groups[1].group).toEqual(groupA);
      expect(groups[2].group).toEqual(groupC);
      expect(groups[3].group).toEqual(groupD);
    });

    it('updates order when widgets are reordered via drag and drop', () => {
      const dropGrid = spectator.query(IxDropGridDirective);
      dropGrid.ixDropGridModelChange.emit([groupB, groupC, groupD, groupA]);
      spectator.detectChanges();

      const groups = spectator.queryAll(WidgetGroupComponent);
      expect(groups[0].group).toEqual(groupB);
      expect(groups[1].group).toEqual(groupC);
      expect(groups[2].group).toEqual(groupD);
      expect(groups[3].group).toEqual(groupA);
    });
  });
});
