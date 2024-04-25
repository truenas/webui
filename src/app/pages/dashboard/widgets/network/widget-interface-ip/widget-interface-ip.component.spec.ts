import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
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
              aliases: [
                { type: NetworkInterfaceAliasType.Inet, address: '192.168.1.1' },
                { type: NetworkInterfaceAliasType.Inet, address: '192.168.1.2' },
              ],
            },
            {
              name: 'eth1',
              aliases: [
                { type: NetworkInterfaceAliasType.Inet6, address: 'fe80::1' },
              ],
            },
          ],
        }),
      }),
    ],
    declarations: [
      MockComponent(WidgetDatapointComponent),
    ],
  });

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
    const widget = spectator.query(MockComponent(WidgetDatapointComponent));
    expect(widget).toBeTruthy();
    expect(widget.text).toBe('192.168.1.1\n192.168.1.2');
  });

  it('renders "interface not found" when selected interface is not available in interface data', () => {
    spectator.setInput('settings', { interface: 'eth404' });

    const widget = spectator.query(MockComponent(WidgetDatapointComponent));
    expect(widget).toBeTruthy();
    expect(widget.text).toBe('Network interface eth404 not found.');
  });

  it('renders N/A when an interface has no IPv4 addresses', () => {
    spectator.setInput('settings', { interface: 'eth1' });

    const widget = spectator.query(MockComponent(WidgetDatapointComponent));
    expect(widget).toBeTruthy();
    expect(widget.text).toBe('N/A');
  });
});
