import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import {
  SubsystemDetailsComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-details/subsystem-details.component';
import {
  SubsystemHostsCardComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-details/subsystem-hosts-card/subsystem-hosts-card.component';
import {
  SubsystemPortsCardComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-details/subsystem-ports-card/subsystem-ports-card.component';

describe('SubsystemDetailsComponent', () => {
  let spectator: Spectator<SubsystemDetailsComponent>;
  const subsystem = { } as NvmeOfSubsystem;

  const createComponent = createComponentFactory({
    component: SubsystemDetailsComponent,
    imports: [
      MockComponents(
        SubsystemPortsCardComponent,
        SubsystemHostsCardComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { subsystem },
    });
  });

  it('shows ports card', () => {
    const card = spectator.query(SubsystemPortsCardComponent);
    expect(card).toBeTruthy();
    expect(card.subsystem).toBe(subsystem);
  });

  it('shows hosts card', () => {
    const card = spectator.query(SubsystemHostsCardComponent);
    expect(card).toBeTruthy();
    expect(card.subsystem).toBe(subsystem);
  });
});
