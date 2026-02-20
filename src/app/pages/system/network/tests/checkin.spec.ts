import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputModule } from '@angular/material/input';
import { MatMenuHarness } from '@angular/material/menu/testing';
import {
  createComponentFactory,
  mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { NetworkInterface, PhysicalNetworkInterface } from 'app/interfaces/network-interface.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { InterfaceFormComponent } from 'app/pages/system/network/components/interface-form/interface-form.component';
import { InterfacesCardComponent } from 'app/pages/system/network/components/interfaces-card/interfaces-card.component';
import { IpmiCardComponent } from 'app/pages/system/network/components/ipmi-card/ipmi-card.component';
import {
  NetworkConfigurationCardComponent,
} from 'app/pages/system/network/components/network-configuration-card/network-configuration-card.component';
import {
  StaticRoutesCardComponent,
} from 'app/pages/system/network/components/static-routes-card/static-routes-card.component';
import { NetworkComponent } from 'app/pages/system/network/network.component';
import { InterfacesStore } from 'app/pages/system/network/stores/interfaces.store';
import { NetworkService } from 'app/services/network.service';
import { selectGeneralConfig } from 'app/store/system-config/system-config.selectors';

describe('NetworkComponent', () => {
  let spectator: Spectator<NetworkComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;
  const isHaEnabled$ = new BehaviorSubject(false);

  const existingInterface = {
    id: '1',
    type: NetworkInterfaceType.Physical,
    name: 'eno1',
    state: {
      permanent_link_address: 'ac:1f:6b:ca:32:24',
    },
    aliases: [
      {
        address: '192.168.238.12',
        netmask: 24,
        type: NetworkInterfaceAliasType.Inet,
      },
    ],
  } as PhysicalNetworkInterface;

  const slideInRef: SlideInRef<NetworkInterface | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => existingInterface),
  };

  let isTestingChanges = false;
  let wasEditMade = false;
  const createComponent = createComponentFactory({
    component: NetworkComponent,
    imports: [
      ReactiveFormsModule,
      FormsModule,
      MatInputModule,
      IxIpInputWithNetmaskComponent,
      IxTableCellDirective,
    ],
    declarations: [
      InterfacesCardComponent,
      InterfaceFormComponent,
      MockComponents(
        NetworkConfigurationCardComponent,
        StaticRoutesCardComponent,
        IpmiCardComponent,
        InterfaceStatusIconComponent,
      ),
    ],
    providers: [
      InterfacesStore,
      mockAuth(),
      mockApi([
        mockCall('interface.checkin_waiting', () => (isTestingChanges ? 60 : null)),
        mockCall('interface.has_pending_changes', () => wasEditMade),
        mockCall('interface.services_restarted_on_sync', []),
        mockCall('interface.checkin'),
        mockCall('interface.cancel_rollback', (): undefined => {
          isTestingChanges = false;
          return undefined;
        }),
        mockCall('interface.rollback', (): undefined => {
          wasEditMade = false;
          isTestingChanges = false;
          return undefined;
        }),
        mockCall('interface.commit', (): undefined => {
          isTestingChanges = true;
          return undefined;
        }),
        mockCall('failover.config', {
          disabled: true,
        } as FailoverConfig),
        mockCall('interface.query', () => [existingInterface]),
        mockCall('interface.xmit_hash_policy_choices'),
        mockCall('interface.lacpdu_rate_choices'),
        mockCall('interface.default_route_will_be_removed'),
      ]),
      mockProvider(NetworkService, {
        subscribeToInOutUpdates: jest.fn(() => of(undefined)),
        getBridgeMembersChoices: () => of({}),
        getLaggProtocolChoices: () => of({}),
        getLaggPortsChoices: () => of({}),
        getVlanParentInterfaceChoices: () => of({}),
        getIsHaEnabled: jest.fn(() => isHaEnabled$),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectGeneralConfig,
            value: { ui_address: ['0.0.0.0'], ui_v6address: ['::'] },
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(MockApiService);

    isTestingChanges = false;
    wasEditMade = false;
  });

  async function makeEdit(): Promise<void> {
    wasEditMade = true;

    const [menu] = await loader.getAllHarnesses(MatMenuHarness.with({ selector: '[mat-icon-button]' }));
    await menu.open();
    await menu.clickItem({ text: 'Edit' });
    spectator.detectComponentChanges();
  }

  it('shows prompt to test network changes when interface is edited', async () => {
    await makeEdit();

    expect(api.call).toHaveBeenCalledWith('interface.has_pending_changes');
    expect(api.call).toHaveBeenCalledWith('interface.checkin_waiting');

    expect(spectator.query('.pending-changes')).toContainText(helptextInterfaces.pendingChangesText);
  });

  it('reverts changes when user presses Revert Changes', async () => {
    await makeEdit();

    const revertButton = await loader.getHarness(MatButtonHarness.with({ text: 'Revert Changes' }));
    await revertButton.click();

    expect(api.call).toHaveBeenCalledWith('interface.rollback');

    expect(spectator.query('.pending-changes')).not.toExist();
  });

  it('shows testing prompt with a countdown when Test Changes is pressed', async () => {
    await makeEdit();

    // Click Test Changes button using native click to avoid harness zone issues
    const testChangesButton = spectator.query<HTMLButtonElement>('button[ixTest="test-changes"]');
    testChangesButton!.click();
    spectator.detectChanges();
    // Small delay to allow async operations to complete without waiting for zone stability
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    spectator.detectChanges();

    expect(api.call).toHaveBeenCalledWith('interface.commit', [{ checkin_timeout: 60 }]);

    expect(spectator.query('.pending-changes'))
      .toContainText(helptextInterfaces.pendingCheckinText.replace('{x}', '60'));

    // Wait a bit and verify countdown decreases
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1100);
    });
    spectator.detectChanges();
    expect(spectator.query('.pending-changes'))
      .toContainText(helptextInterfaces.pendingCheckinText.replace('{x}', '59'));
  });

  it('saves network interface changes when user presses Save Changes in second prompt', async () => {
    await makeEdit();

    // Click Test Changes button using native click
    const testChangesButton = spectator.query<HTMLButtonElement>('button[ixTest="test-changes"]');
    testChangesButton!.click();
    spectator.detectChanges();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    spectator.detectChanges();

    // Click Save Changes button using native click
    const saveChangesButton = spectator.query<HTMLButtonElement>('button[ixTest="save-changes"]');
    saveChangesButton!.click();
    spectator.detectChanges();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    spectator.detectChanges();

    expect(api.call).toHaveBeenCalledWith('interface.checkin');
  });

  it('stops testing changes and goes back to first prompt when another edit is made while the first one is being tested', async () => {
    await makeEdit();

    // Click Test Changes button using native click
    const testChangesButton = spectator.query<HTMLButtonElement>('button[ixTest="test-changes"]');
    testChangesButton!.click();
    spectator.detectChanges();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    spectator.detectChanges();

    // Trigger second edit by calling the component method directly (avoiding harness zone issues)
    wasEditMade = true;
    spectator.component.loadCheckinStatusAfterChange();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    spectator.detectChanges();

    expect(api.call).toHaveBeenCalledWith('interface.cancel_rollback');

    expect(spectator.query('.pending-changes')).toContainText(helptextInterfaces.pendingChangesText);
  });

  describe('IP change detection', () => {
    const changedInterface = {
      id: '1',
      type: NetworkInterfaceType.Physical,
      name: 'eth0',
      state: {
        aliases: [{ address: '192.168.1.3', netmask: 24, type: NetworkInterfaceAliasType.Inet }],
      },
      aliases: [{ address: '192.168.1.4', netmask: 24, type: NetworkInterfaceAliasType.Inet }],
    } as PhysicalNetworkInterface;

    const unchangedInterface = {
      id: '2',
      type: NetworkInterfaceType.Physical,
      name: 'eth1',
      state: {
        aliases: [{ address: '10.0.0.1', netmask: 24, type: NetworkInterfaceAliasType.Inet }],
      },
      aliases: [{ address: '10.0.0.1', netmask: 24, type: NetworkInterfaceAliasType.Inet }],
    } as PhysicalNetworkInterface;

    let windowMock: Record<string, unknown>;

    beforeEach(() => {
      windowMock = spectator.inject<Record<string, unknown>>(WINDOW);
      (windowMock as { location: { hostname: string; protocol: string; port: string } }).location.hostname = '192.168.1.3';
      (windowMock as { location: { protocol: string } }).location.protocol = 'http:';
      (windowMock as { location: { port: string } }).location.port = '4200';

      api.mockCall('interface.query', () => [changedInterface, unchangedInterface]);
    });

    async function triggerIpChangeDetection(): Promise<void> {
      wasEditMade = true;
      await spectator.component.loadCheckinStatusAfterChange();
      spectator.detectComponentChanges();
    }

    it('only shows IPs from interfaces that actually changed', async () => {
      await triggerIpChangeDetection();

      expect(spectator.component.newSystemUrls).toEqual(['http://192.168.1.4:4200/ui/network']);
    });

    it('shows confirmation dialog when Test and Open UI is clicked', async () => {
      await triggerIpChangeDetection();

      (spectator.component as unknown as { commitAndOpenNewUi(): void }).commitAndOpenNewUi();
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });

      expect(api.call).toHaveBeenCalledWith('interface.services_restarted_on_sync');
      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          title: helptextInterfaces.commitChangesTitle,
          message: helptextInterfaces.commitChangesWarning,
        }),
      );
    });

    it('shows UI access loss warning when all ui_address bindings would be orphaned', async () => {
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectGeneralConfig, {
        ui_address: ['192.168.1.3'],
        ui_v6address: ['fe80::1'],
      });
      store$.refreshState();

      await triggerIpChangeDetection();

      expect(spectator.component.willLoseUiAccess).toBe(true);
    });

    it('does not show UI access loss warning when 0.0.0.0 is in ui_address', async () => {
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectGeneralConfig, {
        ui_address: ['0.0.0.0'],
        ui_v6address: [],
      });
      store$.refreshState();

      await triggerIpChangeDetection();

      expect(spectator.component.willLoseUiAccess).toBe(false);
    });

    it('does not show UI access loss warning when a ui_address still exists in pending aliases', async () => {
      const store$ = spectator.inject(MockStore);
      store$.overrideSelector(selectGeneralConfig, {
        ui_address: ['10.0.0.1'],
        ui_v6address: [],
      });
      store$.refreshState();

      await triggerIpChangeDetection();

      expect(spectator.component.willLoseUiAccess).toBe(false);
    });

    it('opens new tabs and starts checkin countdown when confirmation is accepted', async () => {
      await triggerIpChangeDetection();

      (spectator.component as unknown as { commitAndOpenNewUi(): void }).commitAndOpenNewUi();
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 50);
      });
      spectator.detectComponentChanges();

      expect((windowMock as { open: jest.Mock }).open).toHaveBeenCalledWith(
        'http://192.168.1.4:4200/ui/network',
        '_blank',
      );
      expect(api.call).toHaveBeenCalledWith('interface.commit', [{ checkin_timeout: 60 }]);
      expect(spectator.component.checkinWaiting).toBe(true);
      expect(spectator.component.checkinRemaining).toBe(60);
    });
  });
});
