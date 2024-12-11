import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { WidgetErrorComponent } from 'app/pages/dashboard/components/widget-error/widget-error.component';
import {
  runWidgetGroupTestSuite,
} from 'app/pages/dashboard/components/widget-group/tests/run-widget-group-test-suite.utils';
import { WidgetEditorGroupComponent } from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';
import { WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import {
  WidgetInterfaceIpComponent,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.component';
import { WidgetHostnameActiveComponent } from 'app/pages/dashboard/widgets/system/widget-hostname-active/widget-hostname-active.component';

runWidgetGroupTestSuite(WidgetEditorGroupComponent);

describe('WidgetEditorGroupComponent - additions', () => {
  let spectator: Spectator<WidgetEditorGroupComponent>;
  const createComponent = createComponentFactory({
    component: WidgetEditorGroupComponent,
    imports: [
      WidgetHostnameActiveComponent,
      WidgetInterfaceIpComponent,
      WidgetErrorComponent,
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        group: {
          layout: WidgetGroupLayout.Quarters,
          slots: [
            { type: WidgetType.HostnameActive },
            { type: WidgetType.Ipv4Address },
            { type: WidgetType.HostnameActive },
            { type: WidgetType.HostnameActive },
          ],
        },
        validationErrors: [{}, {}, {}, {}],
      },
    });
  });

  describe('selection', () => {
    it('shows slot as selected when [selectedSlot] input is changed', () => {
      spectator.setInput('selectedSlot', 1);

      expect(spectator.queryAll('.slot')[1]).toHaveClass('selected');
    });

    it('shows slot as selected and emits selectedSlotChange with slot number when slot is clicked', () => {
      jest.spyOn(spectator.component.selectedSlotChange, 'emit');

      spectator.click('.slot:nth-child(3)');

      expect(spectator.component.selectedSlotChange.emit).toHaveBeenCalledWith(2);
    });
  });

  it('renders "Empty" when widget slot is empty', () => {
    spectator.setInput('group', {
      layout: WidgetGroupLayout.Quarters,
      slots: [
        { type: WidgetType.HostnameActive },
        null,
        { type: WidgetType.HostnameActive },
        { type: WidgetType.HostnameActive },
      ],
    });

    const secondSlot = spectator.query('.slot:nth-child(2)');
    expect(secondSlot).toHaveText('Empty');
    expect(secondSlot).toHaveClass('empty');
  });
});
