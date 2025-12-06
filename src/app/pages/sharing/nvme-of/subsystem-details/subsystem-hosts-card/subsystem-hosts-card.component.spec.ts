import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { NvmeOfHost, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { AddHostMenuComponent } from 'app/pages/sharing/nvme-of/hosts/add-host-menu/add-host-menu.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import {
  SubsystemHostsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-hosts-card/subsystem-hosts-card.component';

describe('SubsystemHostsCardComponent', () => {
  let spectator: Spectator<SubsystemHostsCardComponent>;
  const createComponent = createComponentFactory({
    component: SubsystemHostsCardComponent,
    imports: [
      MockComponent(AddHostMenuComponent),
    ],
    providers: [
      mockProvider(NvmeOfService, {
        associateHosts: jest.fn(() => of(undefined)),
        removeHostAssociation: jest.fn(() => of(undefined)),
        updateSubsystem: jest.fn(() => of(undefined)),
      }),
      mockProvider(NvmeOfStore, {
        initialize: jest.fn(),
      }),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
    ],
  });

  it('shows that all hosts are allowed for allow_any_host', () => {
    spectator = createComponent({
      props: {
        subsystem: {
          allow_any_host: true,
          hosts: [],
        } as NvmeOfSubsystemDetails,
      },
    });

    const allowedHosts = spectator.query('mat-card-content');
    expect(allowedHosts.textContent).toContain('All hosts are allowed');
  });

  it('shows a warning when allow_any_host is off and no hosts are allowed', () => {
    spectator = createComponent({
      props: {
        subsystem: {
          allow_any_host: false,
          hosts: [],
        } as NvmeOfSubsystemDetails,
      },
    });

    const allowedHosts = spectator.query('.no-hosts-warning');
    expect(allowedHosts.textContent).toContain('No hosts are allowed');
  });

  it('shows a list of allowed hosts', () => {
    spectator = createComponent({
      props: {
        subsystem: {
          allow_any_host: false,
          hosts: [
            { id: 1, hostnqn: 'nqn.2014-01.org' },
            { id: 2, hostnqn: 'nqn.2014-02.org', dhchap_key: 'key' },
          ],
        } as NvmeOfSubsystemDetails,
      },
    });

    const allowedHosts = spectator.queryAll('.host-list li');
    expect(allowedHosts).toHaveLength(2);
    expect(allowedHosts[0].textContent).toContain('nqn.2014-01.org');
    expect(allowedHosts[1].textContent).toContain('nqn.2014-02.org');
    expect(allowedHosts[1]).toHaveDescendant('ix-icon');
    expect(allowedHosts[1].querySelector('ix-icon')).toHaveAttribute('name', 'mdi-key');
  });

  it('adds a new host when it is selected from the Add menu', () => {
    const subsystem = {
      allow_any_host: false,
      hosts: [],
    } as NvmeOfSubsystemDetails;
    const newHost = { id: 1, hostnqn: 'nqn.2014-01.org' } as NvmeOfHost;

    spectator = createComponent({
      props: { subsystem },
    });

    const addHostMenu = spectator.query(AddHostMenuComponent);
    addHostMenu.hostSelected.emit(newHost);

    expect(spectator.inject(NvmeOfService).associateHosts).toHaveBeenCalledWith(
      subsystem,
      [newHost],
    );
    expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
  });

  it('removes the host association from the subsystem when unlink icon is pressed', async () => {
    const subsystem = {
      allow_any_host: false,
      hosts: [
        { id: 1, hostnqn: 'nqn.2014-01.org' },
        { id: 2, hostnqn: 'nqn.2014-02.org' },
      ],
    } as NvmeOfSubsystemDetails;

    spectator = createComponent({
      props: { subsystem },
    });
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const removeButton = await loader.getHarness(IxIconHarness.with({ name: 'mdi-link-variant-off' }));
    await removeButton.click();

    expect(spectator.inject(NvmeOfService).removeHostAssociation).toHaveBeenCalledWith(
      subsystem,
      subsystem.hosts[0],
    );
    expect(spectator.inject(NvmeOfStore).initialize).toHaveBeenCalled();
  });

  it('updates subsystem to allow all hosts when allowAllHostsSelected is emitted', () => {
    const subsystem = {
      allow_any_host: false,
      hosts: [{ id: 1, hostnqn: 'nqn.2014-01.org' }],
    } as NvmeOfSubsystemDetails;

    spectator = createComponent({
      props: { subsystem },
    });

    const addHostMenu = spectator.query(AddHostMenuComponent);
    addHostMenu.allowAllHostsSelected.emit();

    expect(spectator.inject(NvmeOfService).updateSubsystem).toHaveBeenCalledWith(
      subsystem,
      { allow_any_host: true },
    );

    expect(spectator.inject(NvmeOfService).removeHostAssociation).toHaveBeenCalledWith(subsystem, subsystem.hosts[0]);
  });
});
