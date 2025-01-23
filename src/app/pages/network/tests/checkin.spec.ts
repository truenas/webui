import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatInputModule } from '@angular/material/input';
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
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { SlideInComponent } from 'app/modules/slide-ins/components/slide-in/slide-in.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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
  let spectator: Spectator<NetworkComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;

  const existingInterface = {
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
        popComponent: jest.fn(),
        isTopComponentWide$: of(false),
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
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

    const table = await loader.getHarness(IxTableHarness);
    const editIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'eno1');
    await editIcon.click();
    spectator.detectComponentChanges();
  }

  it('shows prompt to test network changes when interface is edited', async () => {
    await makeEdit();

    expect(api.call).toHaveBeenCalledWith('interface.has_pending_changes');
    expect(api.call).toHaveBeenCalledWith('interface.checkin_waiting');

    expect(spectator.query('.pending-changes-card')).toContainText(helptextInterfaces.pending_changes_text);
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

    expect(api.call).toHaveBeenCalledWith('interface.checkin');
  }));

  it('stops testing changes and goes back to first prompt when another edit is made while the first one is being tested', fakeAsync(async () => {
    await makeEdit();

    const testButton = await loader.getHarness(MatButtonHarness.with({ text: 'Test Changes' }));
    await testButton.click();

    await makeEdit();

    expect(api.call).toHaveBeenCalledWith('interface.cancel_rollback');

    expect(spectator.query('.pending-changes-card')).toContainText(helptextInterfaces.pending_changes_text);
  }));
});
