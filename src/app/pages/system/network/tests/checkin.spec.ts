import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  createComponentFactory,
  mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import {
  TnButtonComponent,
  TnButtonHarness,
  TnCardComponent,
  TnCellDefDirective,
  TnHeaderCellDefDirective,
  TnInputComponent,
  TnTableColumnDirective,
  TnTableComponent,
} from '@truenas/ui-components';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { PhysicalNetworkInterface } from 'app/interfaces/network-interface.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { InterfaceStatusIconComponent } from 'app/modules/interface-status-icon/interface-status-icon.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { openRowActionsMenu } from 'app/modules/tn-table/testing/table-row-actions.utils';
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

  let isTestingChanges = false;
  let wasEditMade = false;
  const createComponent = createComponentFactory({
    component: NetworkComponent,
    imports: [
      ReactiveFormsModule,
      FormsModule,
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

  /**
   * The pending-changes buttons, by the label a user reads. `TnButtonHarness` cannot be used
   * for these: pressing Test Changes starts a 1s checkin countdown interval, and a harness
   * never stabilizes against a running timer (see NAS-141040) — so they are clicked natively.
   */
  function getPendingChangesButton(label: string): HTMLButtonElement | null {
    return Array.from(spectator.queryAll<HTMLButtonElement>('tn-button button'))
      .find((element) => element.textContent?.trim() === label) ?? null;
  }

  async function makeEdit(): Promise<void> {
    wasEditMade = true;

    const menu = await openRowActionsMenu(spectator.fixture);
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

    const testChangesButton = getPendingChangesButton('Test Changes');
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

    const testChangesButton = getPendingChangesButton('Test Changes');
    testChangesButton!.click();
    spectator.detectChanges();
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 50);
    });
    spectator.detectChanges();

    const saveChangesButton = getPendingChangesButton('Save Changes');
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

    const testChangesButton = getPendingChangesButton('Test Changes');
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
