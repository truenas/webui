import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetInterfaceIpSettings } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';
import { WidgetInterfaceIpComponent } from './widget-interface-ip.component';

describe('WidgetInterfaceIpComponent', () => {
  let spectator: Spectator<WidgetInterfaceIpComponent>;
  const createComponent = createComponentFactory({
    component: WidgetInterfaceIpComponent,
    providers: [
      mockProvider(WidgetResourcesService, {
        networkInterfaces$: of({
          isLoading: false,
          value: [
            {
              name: 'eth0',
              state: {
                aliases: [
                  { type: NetworkInterfaceAliasType.Inet, address: '192.168.1.1' },
                  { type: NetworkInterfaceAliasType.Inet, address: '192.168.1.2' },
                ],
              },
            },
            {
              name: 'eth1',
              state: {
                aliases: [
                  { type: NetworkInterfaceAliasType.Inet6, address: 'fe80::1' },
                ],
              },
            },
            {
              name: 'eth2',
              aliases: [],
              state: {
                aliases: [
                  { type: NetworkInterfaceAliasType.Inet, address: '192.168.1.10' },
                  { type: NetworkInterfaceAliasType.Inet, address: '192.168.1.11' },
                  { type: NetworkInterfaceAliasType.Inet6, address: 'fe80::1' },
                ],
              },
            },
          ],
        }),
      }),
    ],
  });

  describe('have settings', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          settings: {
            interface: 'eth0',
          },
          size: SlotSize.Quarter,
        },
      });
    });

    it('renders IPv4 addresses for the selected network interface', () => {
      const widget = spectator.query(WidgetDatapointComponent);
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('192.168.1.1\n192.168.1.2');
    });

    it('renders IPv4 addresses for the selected network interface from state', () => {
      spectator.setInput('settings', { interface: 'eth2' });

      const widget = spectator.query(WidgetDatapointComponent);
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('192.168.1.10\n192.168.1.11');
    });

    it('renders IPv6 addresses for the selected network interface', () => {
      spectator.setInput('settings', {
        interface: 'eth1',
        widgetName: 'IPv6 Address',
      });

      const widget = spectator.query(WidgetDatapointComponent);
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('fe80::1');
    });

    it('renders "interface not found" when selected interface is not available in interface data', () => {
      spectator.setInput('settings', { interface: 'eth404' });

      const widget = spectator.query(WidgetDatapointComponent);
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('Network interface eth404 not found.');
    });

    it('renders N/A when an interface has no IPv4 addresses', () => {
      spectator.setInput('settings', { interface: 'eth1' });

      const widget = spectator.query(WidgetDatapointComponent);
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('N/A');
    });
  });

  describe('have no settings', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          settings: {} as WidgetInterfaceIpSettings,
          size: SlotSize.Quarter,
        },
      });
    });

    it('renders IPv4 addresses for the first picked network interface', () => {
      const widget = spectator.query(WidgetDatapointComponent);
      expect(widget).toBeTruthy();
      expect(widget.label()).toBe('eth0 Address');
      expect(widget.text()).toBe('192.168.1.1\n192.168.1.2');
    });
  });
});
