import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import {
  createComponentFactory,
  mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import {
  TnButtonComponent, TnButtonHarness, TnCardComponent, TnCellDefDirective, TnHeaderCellDefDirective,
  TnInputComponent, TnMenuHarness, TnMenuTesting, TnTableColumnDirective, TnTableComponent,
} from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { NetworkInterface, PhysicalNetworkInterface } from 'app/interfaces/network-interface.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
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
      TnButtonComponent,
      TnCardComponent,
      TnInputComponent,
      TnTableComponent,
      TnTableColumnDirective,
      TnHeaderCellDefDirective,
      TnCellDefDirective,
      TableActionsCellComponent,
      IxIpInputWithNetmaskComponent,
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
        open: jest.fn(() => SlideInResult.success(true)),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success(true)),
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

    spectator.click('[data-test="button-interface-eno1-more-action"]');
    const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
    await menu.clickItem({ label: 'Edit' });
    await spectator.fixture.whenStable();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 0);
    });
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

    const revertButton = await loader.getHarness(TnButtonHarness.with({ label: 'Revert Changes' }));
    await revertButton.click();

    expect(api.call).toHaveBeenCalledWith('interface.rollback');

    expect(spectator.query('.pending-changes-card')).not.toExist();
  });

  it('shows testing prompt with a countdown when Test Changes is pressed', async () => {
    await makeEdit();

    // Native click: pressing Test Changes starts a 1s checkin countdown interval, and
    // TnButtonHarness cannot stabilize against the running timer. data-test is the preserved
    // test contract (tn-button [testId]). Do not switch this back to the harness. See NAS-141040.
    const testChangesButton = spectator.query<HTMLButtonElement>('[data-test="button-test-changes"]');
    testChangesButton!.click();
    spectator.detectChanges();
    // Small delay to allow async operations to complete without waiting for zone stability
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    spectator.detectChanges();

    expect(api.call).toHaveBeenCalledWith('interface.commit', [{ checkin_timeout: 60 }]);

    expect(spectator.query('.pending-changes-card'))
      .toContainText(helptextInterfaces.pendingCheckinText.replace('{x}', '60'));

    // Wait a bit and verify countdown decreases
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 1100);
    });
    spectator.detectChanges();
    expect(spectator.query('.pending-changes-card'))
      .toContainText(helptextInterfaces.pendingCheckinText.replace('{x}', '59'));
  });

  it('saves network interface changes when user presses Save Changes in second prompt', async () => {
    await makeEdit();

    // Native click: Test Changes starts a 1s checkin countdown interval that prevents
    // TnButtonHarness from stabilizing. data-test is the preserved test contract. See NAS-141040.
    const testChangesButton = spectator.query<HTMLButtonElement>('[data-test="button-test-changes"]');
    testChangesButton!.click();
    spectator.detectChanges();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    spectator.detectChanges();

    // Native click: Save Changes is rendered during the running countdown, so the harness
    // cannot stabilize. data-test is the preserved test contract. See NAS-141040.
    const saveChangesButton = spectator.query<HTMLButtonElement>('[data-test="button-save-changes"]');
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

    // Native click: Test Changes starts a 1s checkin countdown interval that prevents
    // TnButtonHarness from stabilizing. data-test is the preserved test contract. See NAS-141040.
    const testChangesButton = spectator.query<HTMLButtonElement>('[data-test="button-test-changes"]');
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

    expect(spectator.query('.pending-changes-card')).toContainText(helptextInterfaces.pendingChangesText);
  });
});
