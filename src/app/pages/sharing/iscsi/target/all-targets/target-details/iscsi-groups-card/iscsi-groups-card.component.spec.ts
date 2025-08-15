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
    expect(group).toHaveText('Group 1Portal Group ID:11 (Test Portal)Initiator Group ID:12 (iqn.1994-05.com.redhat:123)Authentication Method:CHAPAuthentication Group Number:5');
  });

  it('displays "No groups." message when groups array is empty', () => {
    spectator.setInput('target', { groups: [] } as IscsiTarget);
    const fallback = spectator.query('p');
    expect(fallback).toHaveText('No groups.');
  });

  it('displays "-" when portal or initiator IDs are not found in maps', () => {
    spectator.setInput('target', {
      groups: [{
        portal: 99,
        initiator: 88,
        authmethod: IscsiAuthMethod.None,
        auth: null,
      }],
    } as IscsiTarget);

    const group = spectator.query('.group');
    expect(group).toHaveText(
      'Group 1Portal Group ID:-Initiator Group ID:-Authentication Method:NONEAuthentication Group Number:-',
    );
  });

  it('handles group with null initiator and auth', () => {
    spectator.setInput('target', {
      groups: [{
        portal: 11,
        initiator: null,
        authmethod: IscsiAuthMethod.None,
        auth: null,
      }],
    } as IscsiTarget);

    const group = spectator.query('.group');
    expect(group).toHaveText(
      'Group 1Portal Group ID:11 (Test Portal)Initiator Group ID:-Authentication Method:NONEAuthentication Group Number:-',
    );
  });
});
