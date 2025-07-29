import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { IscsiService } from 'app/services/iscsi.service';
import { IscsiGroupsCardComponent } from './iscsi-groups-card.component';

describe('IscsiGroupsCardComponent', () => {
  let spectator: Spectator<IscsiGroupsCardComponent>;

  const mockIscsiService = {
    listPortals: () => of([
      { id: 11, comment: 'Test Portal' },
    ]),
    getInitiators: () => of([
      { id: 12, initiators: ['iqn.1994-05.com.redhat:123'] },
    ]),
  };

  const createComponent = createComponentFactory({
    component: IscsiGroupsCardComponent,
    providers: [
      { provide: IscsiService, useValue: mockIscsiService },
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        target: {
          groups: [{
            portal: 11,
            initiator: 12,
            authmethod: IscsiAuthMethod.Chap,
            auth: 5,
          }],
        } as IscsiTarget,
      },
    });
  });

  it('shows group information with labels', async () => {
    const group = await spectator.fixture.whenStable().then(() => spectator.query('.group'));
    expect(group).toHaveText('Portal Group ID: 11 (Test Portal) | Initiator Group ID: 12 (iqn.1994-05.com.redhat:123) | Authentication Method: CHAP | Authentication Group Number: 5');
  });
});
