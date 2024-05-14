import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatIconTestingModule } from '@angular/material/icon/testing';
import { Spectator } from '@ngneat/spectator';
import { mockProvider, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IxIconGroupHarness } from 'app/modules/ix-forms/components/ix-icon-group/ix-icon-group.harness';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { WidgetEditorGroupComponent } from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';
import { WidgetGroupFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-form.component';
import { WidgetGroupSlotFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-slot-form/widget-group-slot-form.component';
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { WidgetGroup, WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { SlotSize, WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('WidgetGroupFormComponent', () => {
  let spectator: Spectator<WidgetGroupFormComponent>;
  let loader: HarnessLoader;

  const chainedComponentRef: ChainedRef<WidgetGroup> = {
    close: jest.fn(),
    getData: jest.fn(() => ({ layout: WidgetGroupLayout.Full, slots: [] })),
    swap: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: WidgetGroupFormComponent,
    imports: [
      TestIdModule,
      IxFormsModule,
      ReactiveFormsModule,
      MatIconTestingModule,
    ],
    declarations: [
      MockComponent(WidgetEditorGroupComponent),
      MockComponent(WidgetGroupSlotFormComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(ChainedRef, chainedComponentRef),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SnackbarService),
      mockProvider(IxSlideInRef),
    ],
  });

  describe('check layout selector', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('checks layout selector', async () => {
      const layoutSelector = await loader.getHarness(IxIconGroupHarness.with({ label: 'Layouts' }));
      expect(await layoutSelector.getValue()).toEqual(WidgetGroupLayout.Full);

      await layoutSelector.setValue(WidgetGroupLayout.Halves);
      expect(await layoutSelector.getValue()).toEqual(WidgetGroupLayout.Halves);
    });
  });

  describe('returns group object based on form values', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: ChainedRef,
            useValue: {
              getData: () => ({
                layout: WidgetGroupLayout.Halves,
                slots: [
                  { type: WidgetType.InterfaceIp, settings: { interface: '1' } },
                  { type: WidgetType.InterfaceIp, settings: { interface: '2' } },
                ],
              }) as WidgetGroup,
              close: jest.fn(),
            } as ChainedRef<WidgetGroup>,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('returns group object in chainedRef response when form is submitted', async () => {
      const submitBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submitBtn.click();
      const chainedRef = spectator.inject(ChainedRef);
      expect(chainedRef.close).toHaveBeenCalledWith({
        error: false,
        response: {
          layout: WidgetGroupLayout.Halves,
          slots: [
            { type: WidgetType.InterfaceIp, settings: { interface: '1' } },
            { type: WidgetType.InterfaceIp, settings: { interface: '2' } },
          ],
        },
      });
    });

    it('changes slot', () => {
      spectator.component.selectedSlotChanged(1);
      expect(spectator.component.selectedSlot()).toEqual({
        type: WidgetType.InterfaceIp,
        settings: {
          interface: '2',
        },
        slotPosition: SlotPosition.Second,
        slotSize: SlotSize.Half,
      });
    });

    it('disables button when slot has validation errors', async () => {
      spectator.component.updateSlotValidation([SlotPosition.First, { interfaceIp: { required: true } }]);
      const submitBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await submitBtn.isDisabled()).toBe(true);
    });

    it('updates settings', async () => {
      spectator.component.updateSlotSettings({
        slotPosition: SlotPosition.First,
        type: WidgetType.InterfaceIp,
        settings: { interface: '5' },
        slotSize: SlotSize.Half,
      });
      const submitBtn = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await submitBtn.click();

      expect(spectator.inject(ChainedRef).close).toHaveBeenCalledWith({
        error: false,
        response: {
          layout: WidgetGroupLayout.Halves,
          slots: [
            { type: WidgetType.InterfaceIp, settings: { interface: '5' } },
            { type: WidgetType.InterfaceIp, settings: { interface: '2' } },
          ],
        } as WidgetGroup,
      });
    });
  });
});
