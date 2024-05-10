import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { WidgetGroupSlotFormComponent } from 'app/pages/dashboard/components/widget-group-form/widget-group-slot-form/widget-group-slot-form.component';
import { SlotPosition } from 'app/pages/dashboard/types/slot-position.enum';
import { WidgetCategory } from 'app/pages/dashboard/types/widget-category.enum';
import { WidgetGroupSlot } from 'app/pages/dashboard/types/widget-group-slot.interface';
import { SlotSize, WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { WidgetInterfaceIpSettingsComponent } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip-settings/widget-interface-ip-settings.component';
import { WidgetInterfaceIpSettings } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';

describe('WidgetGroupSlotComponent', () => {
  let spectator: Spectator<WidgetGroupSlotFormComponent>;

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
  });

  it('shows entered values on the form fields', () => {
    expect(spectator.component.form.value).toEqual({
      category: WidgetCategory.Network,
      type: WidgetType.InterfaceIp,
    });
    expect(spectator.component.slot()).toEqual({
      slotPosition: SlotPosition.First,
      slotSize: SlotSize.Half,
      type: WidgetType.InterfaceIp,
      settings: { interface: '1' },
    } as WidgetGroupSlot<WidgetInterfaceIpSettings>);
  });

  it('emits updated value when value changed', () => {
    spectator.component.form.controls.category.setValue(WidgetCategory.Memory);

    spectator.detectChanges();

    expect(spectator.component.slot()).toEqual({
      slotPosition: SlotPosition.First,
      slotSize: SlotSize.Half,
      settings: undefined,
      type: WidgetType.Memory,
    });
  });
});
