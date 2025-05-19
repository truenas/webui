import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import {
  SubsystemHostsCardComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-details/subsystem-hosts-card/subsystem-hosts-card.component';
import { SubsystemWithRelations } from 'app/pages/sharing/nvme-of/utils/subsystem-with-relations.interface';

describe('SubsystemHostsCardComponent', () => {
  let spectator: Spectator<SubsystemHostsCardComponent>;
  const createComponent = createComponentFactory({
    component: SubsystemHostsCardComponent,
  });

  it('shows that all hosts are allowed for allow_any_host', () => {
    spectator = createComponent({
      props: {
        subsystem: {
          allow_any_host: true,
          hosts: [],
        } as SubsystemWithRelations,
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
        } as SubsystemWithRelations,
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
        } as SubsystemWithRelations,
      },
    });

    const allowedHosts = spectator.queryAll('.host-list li');
    expect(allowedHosts).toHaveLength(2);
    expect(allowedHosts[0].textContent).toContain('nqn.2014-01.org');
    expect(allowedHosts[1].textContent).toContain('nqn.2014-02.org');
    expect(allowedHosts[1]).toHaveDescendant('ix-icon');
    expect(allowedHosts[1].querySelector('ix-icon')).toHaveAttribute('name', 'mdi-key');
  });
});
