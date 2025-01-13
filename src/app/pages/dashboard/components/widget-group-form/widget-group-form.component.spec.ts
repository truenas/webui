import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal, ViewContainerRef } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxIconGroupHarness } from 'app/modules/forms/ix-forms/components/ix-icon-group/ix-icon-group.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WidgetEditorGroupComponent } from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { WidgetGroupSlotFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-slot-form/widget-group-slot-form.component';
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { SlotSize, WidgetType } from 'app/pages/dashboard/types/widget.interface';

describe('WidgetGroupFormComponent', () => {
  let spectator: Spectator<WidgetGroupFormComponent>;
  let loader: HarnessLoader;

  const slideInRef: SlideInRef<WidgetGroup, unknown> = {
    close: jest.fn(),
    getData: jest.fn(() => ({ layout: WidgetGroupLayout.Full, slots: [] })),
    swap: jest.fn(),
    requireConfirmationWhen: jest.fn(),
  };

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
      mockProvider(SlideInRef, slideInRef),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
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
      const layoutSelector = await loader.getHarness(IxIconGroupHarness.with({ label: 'Layout' }));
      const editor = spectator.query(WidgetEditorGroupComponent)!;
      expect(await layoutSelector.getValue()).toEqual(WidgetGroupLayout.Full);
      expect(editor.group).toEqual({ layout: WidgetGroupLayout.Full, slots: [{ type: null }] });
      await layoutSelector.setValue(WidgetGroupLayout.Halves);
      expect(await layoutSelector.getValue()).toEqual(WidgetGroupLayout.Halves);
      expect(editor.group).toEqual({ layout: WidgetGroupLayout.Halves, slots: [{ type: null }, { type: null }] });
    });
  });

  describe('returns group object based on form values', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SlideInRef,
            useValue: {
              getData: () => ({
                layout: WidgetGroupLayout.Halves,
                slots: [
                  { type: WidgetType.Ipv4Address, settings: { interface: '1' } },
                  { type: WidgetType.Ipv4Address, settings: { interface: '2' } },
                ],
              }) as WidgetGroup,
              close: jest.fn(),
              requireConfirmationWhen: () => of(false),
            } as SlideInRef<WidgetGroup, unknown>,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('returns group object in slideInRef response when form is submitted', async () => {
      const submitBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submitBtn.click();
      const ref = spectator.inject(SlideInRef);
      expect(ref.close).toHaveBeenCalledWith({
        error: false,
        response: {
          layout: WidgetGroupLayout.Halves,
          slots: [
            { type: WidgetType.Ipv4Address, settings: { interface: '1' } },
            { type: WidgetType.Ipv4Address, settings: { interface: '2' } },
          ],
        },
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

    it('disables button when slot has validation errors', async () => {
      const slotForm = spectator.query(WidgetGroupSlotFormComponent)!;
      slotForm.validityChange.emit([SlotPosition.First, { interface: { required: true } }]);
      spectator.detectChanges();
      const submitBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await submitBtn.isDisabled()).toBe(true);
    });

    it('updates settings', async () => {
      const slotForm = spectator.query(WidgetGroupSlotFormComponent)!;
      slotForm.settingsChange.emit({
        slotPosition: SlotPosition.First,
        type: WidgetType.Ipv4Address,
        settings: { interface: '5' },
        slotSize: SlotSize.Half,
      });
      spectator.detectChanges();
      const submitBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submitBtn.click();

      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        error: false,
        response: {
          layout: WidgetGroupLayout.Halves,
          slots: [
            { type: WidgetType.Ipv4Address, settings: { interface: '5' } },
            { type: WidgetType.Ipv4Address, settings: { interface: '2' } },
          ],
        } as WidgetGroup,
      });
    });
  });
});
