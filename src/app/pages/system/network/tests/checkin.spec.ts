import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputModule } from '@angular/material/input';
import { MatMenuHarness } from '@angular/material/menu/testing';
import {
  createComponentFactory,
  mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
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
import { SystemGeneralService } from 'app/services/system-general.service';

describe('NetworkComponent', () => {
  let spectator: Spectator<NetworkComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;

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
        mockCall('interface.cancel_rollback', () => {
          isTestingChanges = false;
          return undefined;
        }),
        mockCall('interface.rollback', () => {
          wasEditMade = false;
          isTestingChanges = false;
          return undefined;
        }),
        mockCall('interface.commit', () => {
          isTestingChanges = true;
          return undefined;
        }),
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
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SystemGeneralService, {
        getProductType$: of(ProductType.CommunityEdition),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: true })),
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

    expect(spectator.query('.pending-changes-card')).toContainText(helptextInterfaces.pendingChangesText);
  });

  it('reverts changes when user presses Revert Changes', async () => {
    await makeEdit();

    const revertButton = await loader.getHarness(MatButtonHarness.with({ text: 'Revert Changes' }));
    await revertButton.click();

    expect(api.call).toHaveBeenCalledWith('interface.rollback');

    expect(spectator.query('.pending-changes-card')).not.toExist();
  });

  it('shows testing prompt with a countdown when Test Changes is pressed', fakeAsync(async () => {
    await makeEdit();

    const testButton = await loader.getHarness(MatButtonHarness.with({ text: 'Test Changes' }));
    await testButton.click();

    expect(api.call).toHaveBeenCalledWith('interface.commit', [{ checkin_timeout: 60 }]);

    expect(spectator.query('.pending-changes-card'))
      .toContainText(helptextInterfaces.pendingCheckinText.replace('{x}', '60'));
    tick(1000);
    spectator.detectChanges();
    expect(spectator.query('.pending-changes-card'))
      .toContainText(helptextInterfaces.pendingCheckinText.replace('{x}', '59'));
    discardPeriodicTasks();
  }));

  it('saves network interface changes when user presses Save Changes in second prompt', fakeAsync(async () => {
    await makeEdit();

    const testButton = await loader.getHarness(MatButtonHarness.with({ text: 'Test Changes' }));
    await testButton.click();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save Changes' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('interface.checkin');
  }));

  it('stops testing changes and goes back to first prompt when another edit is made while the first one is being tested', fakeAsync(async () => {
    await makeEdit();

    const testButton = await loader.getHarness(MatButtonHarness.with({ text: 'Test Changes' }));
    await testButton.click();

    await makeEdit();

    expect(api.call).toHaveBeenCalledWith('interface.cancel_rollback');

    expect(spectator.query('.pending-changes-card')).toContainText(helptextInterfaces.pendingChangesText);
  }));
});
