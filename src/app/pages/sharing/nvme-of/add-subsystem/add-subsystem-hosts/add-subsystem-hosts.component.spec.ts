import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { AddHostMenuComponent } from 'app/pages/sharing/nvme-of/hosts/add-host-menu/add-host-menu.component';
import { AddSubsystemHostsComponent } from './add-subsystem-hosts.component';

describe('AddSubsystemHostsComponent', () => {
  let spectator: Spectator<AddSubsystemHostsComponent>;
  let loader: HarnessLoader;

  const hostsControl = new FormControl<NvmeOfHost[]>([]);

  const createComponent = createComponentFactory({
    component: AddSubsystemHostsComponent,
    imports: [
      MockComponent(AddHostMenuComponent),
    ],
  });

  beforeEach(() => {
    hostsControl.setValue([]);
    spectator = createComponent({
      props: {
        hostsControl,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows empty state when no hosts are added', () => {
    const prompt = spectator.query('.no-hosts');
    expect(prompt).toBeVisible();
    expect(prompt).toHaveText(helptextNvmeOf.addHost);
  });

  it('shows a list of added hosts', () => {
    const hosts = [
      { id: 1, hostnqn: 'nqn.2014-01.org' },
      { id: 2, hostnqn: 'nqn.2014-02.org', dhchap_key: 'key' },
    ] as NvmeOfHost[];
    hostsControl.setValue(hosts);
    spectator.detectComponentChanges();

    const hostItems = spectator.queryAll('.host-list li');
    expect(hostItems).toHaveLength(2);
    expect(hostItems[0]).toHaveText('nqn.2014-01.org');
    expect(hostItems[1]).toHaveText('nqn.2014-02.org');
    expect(hostItems[1]).toHaveDescendant('ix-icon[name="mdi-key"]');
  });

  it('adds a host when host is added via the menu is called', () => {
    const newHost = { id: 1, hostnqn: 'nqn.2014-01.org' } as NvmeOfHost;
    const addHostMenu = spectator.query(AddHostMenuComponent);
    addHostMenu.hostSelected.emit(newHost);
    spectator.detectComponentChanges();

    expect(hostsControl.value).toEqual([newHost]);

    const hostItems = spectator.queryAll('.host-list li');

    expect(hostItems).toHaveLength(1);
    expect(hostItems[0]).toHaveText('nqn.2014-01.org');
  });

  it('removes a host when remove button is clicked', async () => {
    const hosts = [
      { id: 1, hostnqn: 'nqn.2014-01.org' },
      { id: 2, hostnqn: 'nqn.2014-02.org' },
    ] as NvmeOfHost[];
    hostsControl.setValue(hosts);
    spectator.detectComponentChanges();

    const removeButton = await loader.getHarness(IxIconHarness.with({ name: 'clear' }));
    await removeButton.click();

    expect(hostsControl.value).toEqual([hosts[1]]);

    const hostItems = spectator.queryAll('.host-list li');
    expect(hostItems).toHaveLength(1);
    expect(hostItems[0]).toHaveText('nqn.2014-02.org');
  });
});
