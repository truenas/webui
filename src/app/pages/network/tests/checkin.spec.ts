import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputModule } from '@angular/material/input';
import {
  createHostFactory,
  mockProvider, SpectatorHost,
} from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { PhysicalNetworkInterface } from 'app/interfaces/network-interface.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { SlideInComponent } from 'app/modules/slide-ins/slide-in.component';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import { InterfacesCardComponent } from 'app/pages/network/components/interfaces-card/interfaces-card.component';
import { IpmiCardComponent } from 'app/pages/network/components/ipmi-card/ipmi-card.component';
import {
  NetworkConfigurationCardComponent,
} from 'app/pages/network/components/network-configuration-card/network-configuration-card.component';
import {
  StaticRoutesCardComponent,
} from 'app/pages/network/components/static-routes-card/static-routes-card.component';
import { NetworkComponent } from 'app/pages/network/network.component';
import { InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import { NetworkService } from 'app/services/network.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('NetworkComponent', () => {
  let spectator: SpectatorHost<NetworkComponent>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;
  let websocket: MockWebSocketService;

  let isTestingChanges = false;
  let wasEditMade = false;
  const createHost = createHostFactory({
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
      SlideInComponent,
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
      mockWebSocket([
        mockCall('interface.checkin_waiting', () => (isTestingChanges ? 60 : null)),
        mockCall('interface.has_pending_changes', () => wasEditMade),
        mockCall('interface.services_restarted_on_sync', []),
        mockCall('interface.checkin'),
        mockCall('interface.cancel_rollback', () => {
          isTestingChanges = false;
          return undefined;
        }),
        mockCall('interface.rollback', () => {
          wasEditMade = false;
          isTestingChanges = false;
          return undefined;
        }),
        mockCall('interface.update', () => {
          wasEditMade = true;
          return undefined;
        }),
        mockCall('interface.commit', () => {
          isTestingChanges = true;
          return undefined;
        }),
        mockCall('interface.query', () => [
          {
            id: '1',
            type: NetworkInterfaceType.Physical,
            name: 'eno1',
            aliases: [
              {
                address: '192.168.238.12',
                netmask: 24,
                type: NetworkInterfaceAliasType.Inet,
              },
            ],
          } as PhysicalNetworkInterface,
        ]),
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
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SystemGeneralService, {
        getProductType$: of(ProductType.Scale),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createHost(`
      <ix-network></ix-network>
      <ix-slide-in id="ix-slide-in-form"></ix-slide-in>
    `);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(spectator.fixture);
    websocket = spectator.inject(MockWebSocketService);

    isTestingChanges = false;
    wasEditMade = false;
  });

  async function makeEdit(): Promise<void> {
    const table = await loader.getHarness(IxTableHarness);
    const editIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'eno1');
    await editIcon.click();

    const input = await rootLoader.getHarness(IxInputHarness.with({ label: 'Description' }));
    await input.setValue('test');

    const saveButton = await rootLoader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    spectator.detectComponentChanges();
  }

  it('shows prompt to test network changes when interface is edited', async () => {
    await makeEdit();

    expect(websocket.call).toHaveBeenCalledWith('interface.has_pending_changes');
    expect(websocket.call).toHaveBeenCalledWith('interface.checkin_waiting');

    expect(spectator.query('.pending-changes-card')).toContainText(helptextInterfaces.pending_changes_text);
  });

  it('reverts changes when user presses Revert Changes', async () => {
    await makeEdit();

    const revertButton = await loader.getHarness(MatButtonHarness.with({ text: 'Revert Changes' }));
    await revertButton.click();

    expect(websocket.call).toHaveBeenCalledWith('interface.rollback');

    expect(spectator.query('.pending-changes-card')).not.toExist();
  });

  it('shows testing prompt with a countdown when Test Changes is pressed', fakeAsync(async () => {
    await makeEdit();

    const testButton = await loader.getHarness(MatButtonHarness.with({ text: 'Test Changes' }));
    await testButton.click();

    expect(websocket.call).toHaveBeenCalledWith('interface.commit', [{ checkin_timeout: 60 }]);

    expect(spectator.query('.pending-changes-card'))
      .toContainText(helptextInterfaces.pending_checkin_text.replace('{x}', '60'));
    tick(1000);
    spectator.detectChanges();
    expect(spectator.query('.pending-changes-card'))
      .toContainText(helptextInterfaces.pending_checkin_text.replace('{x}', '59'));
    discardPeriodicTasks();
  }));

  it('saves network interface changes when user presses Save Changes in second prompt', fakeAsync(async () => {
    await makeEdit();

    const testButton = await loader.getHarness(MatButtonHarness.with({ text: 'Test Changes' }));
    await testButton.click();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Changes' }));
    await saveButton.click();

    expect(websocket.call).toHaveBeenCalledWith('interface.checkin');
  }));

  it('stops testing changes and goes back to first prompt when another edit is made while the first one is being tested', fakeAsync(async () => {
    await makeEdit();

    const testButton = await loader.getHarness(MatButtonHarness.with({ text: 'Test Changes' }));
    await testButton.click();

    await makeEdit();

    expect(websocket.call).toHaveBeenCalledWith('interface.cancel_rollback');

    expect(spectator.query('.pending-changes-card')).toContainText(helptextInterfaces.pending_changes_text);
  }));
});
