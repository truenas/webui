import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import {
  SubsystemDetailsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-details-card/subsystem-details-card.component';
import {
  SubsystemDetailsComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-details.component';
import {
  SubsystemHostsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-hosts-card/subsystem-hosts-card.component';
import {
  SubsystemPortsCardComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-ports-card/subsystem-ports-card.component';

describe('SubsystemDetailsComponent', () => {
  let spectator: Spectator<SubsystemDetailsComponent>;
  const subsystem = { } as NvmeOfSubsystemDetails;

  const createComponent = createComponentFactory({
    component: SubsystemDetailsComponent,
    imports: [
      MockComponents(
        SubsystemDetailsCardComponent,
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

  it('shows details card', () => {
    const card = spectator.query(SubsystemDetailsCardComponent);
    expect(card).toBeTruthy();
    expect(card.subsystem).toBe(subsystem);
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
