import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { NvmeOfTransportType } from 'app/enums/nvme-of.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfPort, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AddPortMenuComponent } from 'app/pages/sharing/nvme-of/ports/add-port-menu/add-port-menu.component';
import { PortDescriptionComponent } from 'app/pages/sharing/nvme-of/ports/port-description/port-description.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import {
  SubsystemPortsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-ports-card/subsystem-ports-card.component';

describe('SubsystemPortsCardComponent', () => {
  let spectator: Spectator<SubsystemPortsCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SubsystemPortsCardComponent,
    imports: [
      MockComponent(AddPortMenuComponent),
      PortDescriptionComponent,
    ],
    providers: [
      mockProvider(NvmeOfService, {
        associatePorts: jest.fn(() => of(undefined)),
        removePortAssociation: jest.fn(() => of(undefined)),
      }),
      mockProvider(SnackbarService),
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
      }),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
    ],
  });

  function setupTest(subsystem: NvmeOfSubsystemDetails): void {
    spectator = createComponent({
      props: {
        subsystem,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  it('shows a warning when subsystem has no ports', () => {
    setupTest({
      id: 1,
      ports: [],
    } as NvmeOfSubsystemDetails);

    const warning = spectator.query('.no-ports-warning');
    expect(warning).toBeTruthy();
    expect(warning.textContent).toContain(helptextNvmeOf.noPortsWarning);
    expect(warning).toHaveDescendant('ix-icon');
  });

  it('has a menu-button to add new ports', () => {
    const ports = [] as NvmeOfPort[];

    setupTest({
      id: 1,
      ports,
    } as NvmeOfSubsystemDetails);

    const addPortMenu = spectator.query(AddPortMenuComponent);
    expect(addPortMenu).toBeTruthy();
    expect(addPortMenu.subsystemPorts).toEqual(ports);
  });

  it('reloads the list of ports when new port is added', () => {
    setupTest({
      id: 1,
      ports: [],
    } as NvmeOfSubsystemDetails);

    const addPortMenu = spectator.query(AddPortMenuComponent);
    addPortMenu.portSelected.emit({} as NvmeOfPort);

    expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
  });

  describe('has ports', () => {
    const subsystem = {
      id: 1,
      ports: [
        {
          id: 10,
          addr_trsvcid: 7000,
          addr_trtype: NvmeOfTransportType.Tcp,
          addr_traddr: '10.23.23.12',
        },
        {
          id: 11,
          addr_trsvcid: 6000,
          addr_trtype: NvmeOfTransportType.Rdma,
          addr_traddr: '192.168.1.5',
        },
        {
          id: 12,
          addr_trtype: NvmeOfTransportType.FibreChannel,
          addr_traddr: 'nn-0x20000025b500a123',
        },
      ],
    } as NvmeOfSubsystemDetails;

    beforeEach(() => {
      setupTest(subsystem);
    });

    it('lists ports associated with the subsystem', () => {
      const portList = spectator.queryAll('.port-list li');
      expect(portList).toHaveLength(3);
      expect(portList[0].textContent).toContain('TCP\n—\n10.23.23.12:7000');
      expect(portList[1].textContent).toContain('RDMA\n—\n192.168.1.5:6000');
      expect(portList[2].textContent).toContain('Fibre Channel\n—\nnn-0x20000025b500a123');
    });

    it('deletes a port association when delete icon is pressed', async () => {
      const deleteIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-link-variant-off' }));
      await deleteIcon.click();

      expect(spectator.inject(NvmeOfService).removePortAssociation).toHaveBeenCalledWith(subsystem, subsystem.ports[0]);
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();

      expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
    });
  });
});
