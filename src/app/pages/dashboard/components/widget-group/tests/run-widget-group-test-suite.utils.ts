import { Type } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { WidgetErrorComponent } from 'app/pages/dashboard/components/widget-error/widget-error.component';
import { WidgetGroupComponent } from 'app/pages/dashboard/components/widget-group/widget-group.component';
import { WidgetGroupLayout } from 'app/pages/dashboard/types/widget-group.interface';
import { SlotSize, WidgetType } from 'app/pages/dashboard/types/widget.interface';
import { WidgetHelpComponent } from 'app/pages/dashboard/widgets/help/widget-help/widget-help.component';
import { WidgetHostnameComponent } from 'app/pages/dashboard/widgets/network/widget-hostname/widget-hostname.component';
import {
  WidgetInterfaceIpComponent,
} from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.component';

export function runWidgetGroupTestSuite<T extends WidgetGroupComponent>(component: Type<T>): void {
  describe(component.name, () => {
    let spectator: Spectator<WidgetGroupComponent>;
    const createComponent = createComponentFactory({
      component: WidgetGroupComponent,
      declarations: [
        MockComponents(
          WidgetHostnameComponent,
          WidgetInterfaceIpComponent,
          WidgetHelpComponent,
          WidgetErrorComponent,
        ),
      ],
    });

    it('renders correct group layout based on group layout field', () => {
      spectator = createComponent({
        props: {
          group: { layout: WidgetGroupLayout.Full, slots: [null] },
        },
      });

      expect(spectator.queryAll('.slot')).toHaveLength(1);
      expect(spectator.fixture.nativeElement).toHaveClass('full');

      spectator.setInput('group', { layout: WidgetGroupLayout.Quarters, slots: [] });

      expect(spectator.queryAll('.slot')).toHaveLength(4);
      expect(spectator.fixture.nativeElement).toHaveClass('quarters');
    });

    it('renders widgets in correct slots and assigns their settings', () => {
      spectator = createComponent({
        props: {
          group: {
            layout: WidgetGroupLayout.HalfAndQuarters,
            slots: [
              { type: WidgetType.InterfaceIp, settings: { interface: 'eno1' } },
              { type: WidgetType.Hostname },
              { type: WidgetType.InterfaceIp, settings: { interface: 'eno2' } },
              null,
            ],
          },
        },
      });

      const widget1 = spectator.query(WidgetInterfaceIpComponent, { parentSelector: '.slot:nth-child(1)' });
      expect(widget1).toExist();
      expect(widget1.size).toBe(SlotSize.Half);
      expect(widget1.settings).toMatchObject({ interface: 'eno1' });

      const widget2 = spectator.query(WidgetHostnameComponent, { parentSelector: '.slot:nth-child(2)' });
      expect(widget2).toExist();
      expect(widget2.size).toBe(SlotSize.Quarter);

      const widget3 = spectator.query(WidgetInterfaceIpComponent, { parentSelector: '.slot:nth-child(3)' });
      expect(widget3).toExist();
      expect(widget3.size).toBe(SlotSize.Quarter);
      expect(widget3.settings).toMatchObject({ interface: 'eno2' });
    });

    it('leaves a slot empty when widget for that slot is null', () => {
      spectator = createComponent({
        props: {
          group: {
            layout: WidgetGroupLayout.Halves,
            slots: [
              null,
              { type: WidgetType.Hostname },
            ],
          },
        },
      });

      const slots = spectator.queryAll('.slot');
      expect(slots).toHaveLength(2);
      expect(slots[0].children).toHaveLength(0);
      expect(slots[1].children).not.toHaveLength(0);
    });

    it('renders error when widget is not recognized', () => {
      spectator = createComponent({
        props: {
          group: {
            layout: WidgetGroupLayout.Full,
            slots: [
              { type: 'Borked' as unknown as WidgetType },
            ],
          },
        },
      });

      const slots = spectator.queryAll('.slot');
      expect(slots).toHaveLength(1);

      const errorComponent = spectator.query(WidgetErrorComponent, { parentSelector: '.slot' });
      expect(errorComponent).toExist();
      expect(errorComponent.message).toBe('Borked widget is not supported.');
    });

    it('renders error when widget does not support slot size', () => {
      spectator = createComponent({
        props: {
          group: {
            layout: WidgetGroupLayout.Quarters,
            slots: [
              { type: WidgetType.Help },
              null,
              null,
              null,
            ],
          },
        },
      });

      const errorComponent = spectator.query(WidgetErrorComponent, { parentSelector: '.slot:nth-child(1)' });
      expect(errorComponent).toExist();
      expect(errorComponent.message).toBe('help widget does not support quarter size.');
    });
  });
}
