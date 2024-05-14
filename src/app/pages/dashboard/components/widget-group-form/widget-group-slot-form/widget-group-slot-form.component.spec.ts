import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { WidgetGroupSlotFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-slot-form/widget-group-slot-form.component';
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { WidgetCategory, widgetCategoryLabels } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetGroupSlot } from 'app/pages/dashboard/types/widget-group-slot.interface';
import { SlotSize, WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';
import { WidgetInterfaceIpSettingsComponent } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip-settings/widget-interface-ip-settings.component';
import { WidgetInterfaceIpSettings } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

describe('WidgetGroupSlotComponent', () => {
  let spectator: Spectator<WidgetGroupSlotFormComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: WidgetGroupSlotFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(WidgetInterfaceIpSettingsComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        slotConfig: {
          slotPosition: SlotPosition.First,
          slotSize: SlotSize.Half,
          type: WidgetType.InterfaceIp,
          settings: { interface: '1' },
        },
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows entered values on the form fields', async () => {
    expect(spectator.component.form.value).toEqual({
      category: WidgetCategory.Network,
      type: WidgetType.InterfaceIp,
    });
    const typeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Widget Type' }));
    expect(await typeSelect.getValue()).toBe(widgetRegistry[WidgetType.InterfaceIp].name);
    expect(spectator.component.slot()).toEqual({
      slotPosition: SlotPosition.First,
      slotSize: SlotSize.Half,
      type: WidgetType.InterfaceIp,
      settings: { interface: '1' },
    } as WidgetGroupSlot<WidgetInterfaceIpSettings>);
  });

  it('emits updated value when value changed', async () => {
    const categorySelect = await loader.getHarness(IxSelectHarness.with({ label: 'Widget Category' }));
    await categorySelect.setValue(widgetCategoryLabels.get(WidgetCategory.Memory));

    spectator.detectChanges();

    expect(
      await (await loader.getHarness(IxSelectHarness.with({ label: 'Widget Type' }))).getValue(),
    ).toBe(widgetRegistry[WidgetType.Memory].name);

    expect(spectator.component.slot()).toEqual({
      slotPosition: SlotPosition.First,
      slotSize: SlotSize.Half,
      settings: undefined,
      type: WidgetType.Memory,
    });
  });
});
