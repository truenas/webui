import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, ViewContainerRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { TnButtonComponent, TnButtonToggleGroupHarness } from '@truenas/ui-components';
import { MockComponent, MockInstance, ngMocks } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WidgetEditorGroupComponent } from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { WidgetGroupSlotFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-slot-form/widget-group-slot-form.component';
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { SlotSize, WidgetType } from 'app/pages/dashboard/types/widget.interface';

// Mocking WidgetEditorGroupComponent would otherwise mock its transitive
// TnButtonComponent import, which trips the ng-mocks signal-viewChild bug
// (https://github.com/help-me-mom/ng-mocks/issues/8634). Keep it real.
ngMocks.globalKeep(TnButtonComponent, true);

describe('WidgetGroupFormComponent', () => {
  let spectator: Spectator<WidgetGroupFormComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: WidgetGroupFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(WidgetEditorGroupComponent),
      MockComponent(WidgetGroupSlotFormComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(FormErrorHandlerService),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    // TODO: Workaround for https://github.com/help-me-mom/ng-mocks/issues/8634
    MockInstance(WidgetGroupSlotFormComponent, 'settingsContainer', signal({} as ViewContainerRef));
  });

  describe('check layout selector', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('checks layout selector', async () => {
      const layoutSelector = await loader.getHarness(TnButtonToggleGroupHarness);
      const editor = spectator.query(WidgetEditorGroupComponent)!;

      const toggles = await layoutSelector.getToggles();
      expect(toggles).toHaveLength(5);
      expect(await toggles[0].isChecked()).toBe(true);
      expect(editor.group).toEqual({ layout: WidgetGroupLayout.Full, slots: [{ type: null }] });

      await toggles[1].check();

      expect(await toggles[1].isChecked()).toBe(true);
      expect(editor.group).toEqual({ layout: WidgetGroupLayout.Halves, slots: [{ type: null }, { type: null }] });
    });
  });

  describe('returns group object based on form values', () => {
    let savedSpy: jest.Mock;

    beforeEach(() => {
      spectator = createComponent({
        props: {
          initialGroup: {
            layout: WidgetGroupLayout.Halves,
            slots: [
              { type: WidgetType.Ipv4Address, settings: { interface: '1' } },
              { type: WidgetType.Ipv4Address, settings: { interface: '2' } },
            ],
          } as WidgetGroup,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      savedSpy = jest.fn();
      spectator.component.saved.subscribe(savedSpy);
    });

    it('emits saved with the group object when the form is submitted', () => {
      spectator.component.submit();

      expect(savedSpy).toHaveBeenCalledWith({
        layout: WidgetGroupLayout.Halves,
        slots: [
          { type: WidgetType.Ipv4Address, settings: { interface: '1' } },
          { type: WidgetType.Ipv4Address, settings: { interface: '2' } },
        ],
      });
    });

    it('changes slot', () => {
      const editor = spectator.query(WidgetEditorGroupComponent)!;
      editor.selectedSlotChange.emit(1);

      spectator.detectChanges();
      const slotForm = spectator.query(WidgetGroupSlotFormComponent)!;
      expect(slotForm.slotConfig).toEqual({
        type: WidgetType.Ipv4Address,
        settings: {
          interface: '2',
        },
        slotPosition: SlotPosition.Second,
        slotSize: SlotSize.Half,
      });
    });

    it('blocks submission when slot has validation errors', () => {
      const slotForm = spectator.query(WidgetGroupSlotFormComponent)!;
      slotForm.validityChange.emit([SlotPosition.First, { interface: { required: true } }]);
      spectator.detectChanges();

      expect(spectator.component.canSubmit()).toBe(false);

      spectator.component.submit();
      expect(savedSpy).not.toHaveBeenCalled();
    });

    it('updates settings', () => {
      const slotForm = spectator.query(WidgetGroupSlotFormComponent)!;
      slotForm.settingsChange.emit({
        slotPosition: SlotPosition.First,
        type: WidgetType.Ipv4Address,
        settings: { interface: '5' },
        slotSize: SlotSize.Half,
      });
      spectator.detectChanges();
      spectator.component.submit();

      expect(savedSpy).toHaveBeenCalledWith({
        layout: WidgetGroupLayout.Halves,
        slots: [
          { type: WidgetType.Ipv4Address, settings: { interface: '5' } },
          { type: WidgetType.Ipv4Address, settings: { interface: '2' } },
        ] as WidgetGroup['slots'],
      });
    });
  });
});
