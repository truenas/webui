import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { NetworkInterfaceAliasType } from 'app/enums/network-interface.enum';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { WidgetDatapointComponent } from 'app/pages/dashboard/widgets/common/widget-datapoint/widget-datapoint.component';
import { WidgetInterfaceIpSettings } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip.definition';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { WidgetInterfaceIpComponent } from './widget-interface-ip.component';

describe('WidgetInterfaceIpComponent', () => {
  let spectator: Spectator<WidgetInterfaceIpComponent>;

  const createComponent = createComponentFactory({
    component: WidgetInterfaceIpComponent,
    providers: [
      provideMockStore({
        selectors: [
          { selector: selectIsHaLicensed, value: false },
        ],
      }),
      mockProvider(WidgetResourcesService, {
        networkInterfaces$: of({
          isLoading: false,
          value: [
            {
              name: 'eth0',
              aliases: [],
              failover_aliases: [],
              failover_virtual_aliases: [],
              state: {
                aliases: [
                  { type: NetworkInterfaceAliasType.Inet, address: '192.168.1.1' },
                  { type: NetworkInterfaceAliasType.Inet, address: '192.168.1.2' },
                ],
              },
            },
            {
              name: 'eth1',
              aliases: [],
              failover_aliases: [],
              failover_virtual_aliases: [],
              state: {
                aliases: [
                  { type: NetworkInterfaceAliasType.Inet6, address: 'fe80::1' },
                ],
              },
            },
            {
              name: 'eth2',
              aliases: [],
              failover_aliases: [],
              failover_virtual_aliases: [],
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
      const widget = spectator.query(WidgetDatapointComponent)!;
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('192.168.1.1\n192.168.1.2');
    });

    it('renders IPv4 addresses for the selected network interface from state', () => {
      spectator.setInput('settings', { interface: 'eth2' });

      const widget = spectator.query(WidgetDatapointComponent)!;
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('192.168.1.10\n192.168.1.11');
    });

    it('renders IPv6 addresses for the selected network interface', () => {
      spectator.setInput('settings', {
        interface: 'eth1',
        widgetName: 'IPv6 Address',
      });

      const widget = spectator.query(WidgetDatapointComponent)!;
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('fe80::1');
    });

    it('renders "interface not found" when selected interface is not available in interface data', () => {
      spectator.setInput('settings', { interface: 'eth404' });

      const widget = spectator.query(WidgetDatapointComponent)!;
      expect(widget).toBeTruthy();
      expect(widget.text()).toBe('Network interface eth404 not found.');
    });

    it('renders N/A when an interface has no IPv4 addresses', () => {
      spectator.setInput('settings', { interface: 'eth1' });

      const widget = spectator.query(WidgetDatapointComponent)!;
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
      const widget = spectator.query(WidgetDatapointComponent)!;
      expect(widget).toBeTruthy();
      expect(widget.label()).toBe('eth0 Address');
      expect(widget.text()).toBe('192.168.1.1\n192.168.1.2');
    });
  });

  describe('HA mode', () => {
    let haSpectator: Spectator<WidgetInterfaceIpComponent>;

    const createHaComponent = createComponentFactory({
      component: WidgetInterfaceIpComponent,
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsHaLicensed, value: true },
          ],
        }),
        mockProvider(WidgetResourcesService, {
          networkInterfaces$: of({
            isLoading: false,
            value: [
              {
                name: 'eth0',
                aliases: [],
                failover_aliases: [
                  { type: NetworkInterfaceAliasType.Inet, address: '10.220.16.58' },
                ],
                failover_virtual_aliases: [
                  { type: NetworkInterfaceAliasType.Inet, address: '10.220.16.60' },
                ],
                state: {
                  aliases: [
                    { type: NetworkInterfaceAliasType.Inet, address: '10.220.16.58' },
                    { type: NetworkInterfaceAliasType.Inet, address: '10.220.16.60' },
                  ],
                },
              },
            ],
          }),
        }),
      ],
    });

    beforeEach(() => {
      haSpectator = createHaComponent({
        props: {
          settings: {
            interface: 'eth0',
          },
          size: SlotSize.Quarter,
        },
      });
    });

    it('renders IP addresses with HA labels', () => {
      haSpectator.detectChanges();
      const ipLines = haSpectator.queryAll('.ip-line');
      expect(ipLines).toHaveLength(2);

      expect(ipLines[0].querySelector('.ip-address')).toHaveText('10.220.16.60');
      expect(ipLines[0].querySelector('.ip-label')).toHaveText('(Virtual IP)');

      expect(ipLines[1].querySelector('.ip-address')).toHaveText('10.220.16.58');
      expect(ipLines[1].querySelector('.ip-label')).toHaveText('(This Controller)');
    });

    it('has proper accessibility attributes', () => {
      haSpectator.detectChanges();
      const ipAddressesList = haSpectator.query('.ip-addresses');
      expect(ipAddressesList).toHaveAttribute('role', 'list');
      expect(ipAddressesList).toHaveAttribute('aria-label');

      const ipLines = haSpectator.queryAll('.ip-line');
      ipLines.forEach((line) => {
        expect(line).toHaveAttribute('role', 'listitem');

        const ipAddress = line.querySelector('.ip-address');
        expect(ipAddress).toHaveAttribute('aria-label', 'IP Address');
      });

      const ipLabels = haSpectator.queryAll('.ip-label');
      ipLabels.forEach((ipLabel) => {
        expect(ipLabel).toHaveAttribute('aria-label');
      });
    });
  });

  describe('HA mode with other controller IPs', () => {
    let haSpectatorWithOtherIp: Spectator<WidgetInterfaceIpComponent>;

    const createHaComponentWithOtherIp = createComponentFactory({
      component: WidgetInterfaceIpComponent,
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsHaLicensed, value: true },
          ],
        }),
        mockProvider(WidgetResourcesService, {
          networkInterfaces$: of({
            isLoading: false,
            value: [
              {
                name: 'eth0',
                aliases: [],
                failover_aliases: [
                  { type: NetworkInterfaceAliasType.Inet, address: '10.220.39.129' },
                ],
                failover_virtual_aliases: [
                  { type: NetworkInterfaceAliasType.Inet, address: '10.220.36.74' },
                ],
                state: {
                  aliases: [
                    { type: NetworkInterfaceAliasType.Inet, address: '10.220.36.74' },
                    { type: NetworkInterfaceAliasType.Inet, address: '10.220.39.129' },
                    { type: NetworkInterfaceAliasType.Inet, address: '10.220.39.128' },
                  ],
                },
              },
            ],
          }),
        }),
      ],
    });

    beforeEach(() => {
      haSpectatorWithOtherIp = createHaComponentWithOtherIp({
        props: {
          settings: {
            interface: 'eth0',
          },
          size: SlotSize.Quarter,
        },
      });
    });

    it('labels all IPs including those from other controller', () => {
      haSpectatorWithOtherIp.detectChanges();
      const ipLines = haSpectatorWithOtherIp.queryAll('.ip-line');
      expect(ipLines).toHaveLength(3);

      expect(ipLines[0].querySelector('.ip-address')).toHaveText('10.220.36.74');
      expect(ipLines[0].querySelector('.ip-label')).toHaveText('(Virtual IP)');

      expect(ipLines[1].querySelector('.ip-address')).toHaveText('10.220.39.129');
      expect(ipLines[1].querySelector('.ip-label')).toHaveText('(This Controller)');

      expect(ipLines[2].querySelector('.ip-address')).toHaveText('10.220.39.128');
      expect(ipLines[2].querySelector('.ip-label')).toHaveText('(Other Controller)');
    });

    it('verifies aria-label attributes match label text', () => {
      haSpectatorWithOtherIp.detectChanges();
      const ipLabels = haSpectatorWithOtherIp.queryAll('.ip-label');

      expect(ipLabels).toHaveLength(3);
      ipLabels.forEach((ipLabel) => {
        const ariaLabel = ipLabel.getAttribute('aria-label');
        const labelText = ipLabel.textContent?.trim();
        expect(ariaLabel).toBe(labelText);
      });
    });
  });

  describe('HA mode with IPv6', () => {
    let haIpv6Spectator: Spectator<WidgetInterfaceIpComponent>;

    const createHaIpv6Component = createComponentFactory({
      component: WidgetInterfaceIpComponent,
      providers: [
        provideMockStore({
          selectors: [
            { selector: selectIsHaLicensed, value: true },
          ],
        }),
        mockProvider(WidgetResourcesService, {
          networkInterfaces$: of({
            isLoading: false,
            value: [
              {
                name: 'eth0',
                aliases: [],
                failover_aliases: [
                  { type: NetworkInterfaceAliasType.Inet6, address: 'fe80::1' },
                ],
                failover_virtual_aliases: [
                  { type: NetworkInterfaceAliasType.Inet6, address: 'fe80::10' },
                ],
                state: {
                  aliases: [
                    { type: NetworkInterfaceAliasType.Inet6, address: 'fe80::1' },
                    { type: NetworkInterfaceAliasType.Inet6, address: 'fe80::10' },
                    { type: NetworkInterfaceAliasType.Inet6, address: 'fe80::2' },
                  ],
                },
              },
            ],
          }),
        }),
      ],
    });

    beforeEach(() => {
      haIpv6Spectator = createHaIpv6Component({
        props: {
          settings: {
            interface: 'eth0',
            widgetName: 'IPv6 Address',
          },
          size: SlotSize.Quarter,
        },
      });
    });

    it('renders IPv6 addresses with HA labels correctly', () => {
      haIpv6Spectator.detectChanges();
      const ipLines = haIpv6Spectator.queryAll('.ip-line');
      expect(ipLines).toHaveLength(3);

      expect(ipLines[0].querySelector('.ip-address')).toHaveText('fe80::10');
      expect(ipLines[0].querySelector('.ip-label')).toHaveText('(Virtual IP)');

      expect(ipLines[1].querySelector('.ip-address')).toHaveText('fe80::1');
      expect(ipLines[1].querySelector('.ip-label')).toHaveText('(This Controller)');

      expect(ipLines[2].querySelector('.ip-address')).toHaveText('fe80::2');
      expect(ipLines[2].querySelector('.ip-label')).toHaveText('(Other Controller)');
    });

    it('filters IPv6 addresses correctly using interfaceType', () => {
      haIpv6Spectator.detectChanges();
      const ipLines = haIpv6Spectator.queryAll('.ip-line');

      // All displayed addresses should be IPv6
      ipLines.forEach((line) => {
        const ipAddress = line.querySelector('.ip-address')?.textContent?.trim();
        expect(ipAddress).toMatch(/^fe80::/);
      });
    });
  });
});
