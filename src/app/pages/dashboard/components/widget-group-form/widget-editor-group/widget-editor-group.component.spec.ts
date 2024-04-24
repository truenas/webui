import { HarnessLoader } from '@angular/cdk/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { IxIconGroupHarness } from 'app/modules/ix-forms/components/ix-icon-group/ix-icon-group.harness';
import { WidgetErrorComponent } from 'app/pages/dashboard/components/widget-error/widget-error.component';
import {
  runWidgetGroupTestSuite,
} from 'app/pages/dashboard/components/widget-group/tests/run-widget-group-test-suite.utils';
import { WidgetEditorGroupComponent } from 'app/pages/dashboard/components/widget-group-form/widget-editor-group/widget-editor-group.component';
import { WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { WidgetHostnameComponent } from 'app/pages/dashboard/widgets/network/widget-hostname/widget-hostname.component';
import {
  WidgetInterfaceIpComponent,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.component';

runWidgetGroupTestSuite(WidgetEditorGroupComponent);

describe('WidgetEditorGroupComponent - additions', () => {
  let spectator: Spectator<WidgetEditorGroupComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: WidgetEditorGroupComponent,
    declarations: [
      MockComponents(
        WidgetHostnameComponent,
        WidgetInterfaceIpComponent,
        WidgetErrorComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        group: {
          layout: WidgetGroupLayout.Quarters,
          slots: [
            { type: WidgetType.Hostname },
            { type: WidgetType.InterfaceIp },
            { type: WidgetType.Hostname },
            { type: WidgetType.Hostname },
          ],
        },
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
        { type: WidgetType.Hostname },
        null,
        { type: WidgetType.Hostname },
        { type: WidgetType.Hostname },
      ],
    });

    const secondSlot = spectator.query('.slot:nth-child(2)');
    expect(secondSlot).toHaveText('Empty');
    expect(secondSlot).toHaveClass('empty');
  });

  it('checks layout selector', async () => {
    const layoutSelector = await loader.getHarness(IxIconGroupHarness.with({ label: 'Layouts' }));
    await layoutSelector.setValue(WidgetGroupLayout.Halves);

    expect(await layoutSelector.getValue()).toEqual(WidgetGroupLayout.Halves);
  });
});
