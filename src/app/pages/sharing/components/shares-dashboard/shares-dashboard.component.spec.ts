import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Role } from 'app/enums/role.enum';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { IscsiCardComponent } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.component';
import { NfsCardComponent } from 'app/pages/sharing/components/shares-dashboard/nfs-card/nfs-card.component';
import { SharesDashboardComponent } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.component';
import { SmbCardComponent } from 'app/pages/sharing/components/shares-dashboard/smb-card/smb-card.component';
import { AuthService } from 'app/services/auth/auth.service';

// TODO: Rework how we check for user permissions.
describe.skip('SharesDashboardComponent', () => {
  let spectator: Spectator<SharesDashboardComponent>;
  const createComponent = createComponentFactory({
    component: SharesDashboardComponent,
    declarations: [
      MockComponents(
        SmbCardComponent,
        NfsCardComponent,
        IscsiCardComponent,
      ),
    ],
    providers: [
      mockWebsocket([
        mockCall('cluster.utils.is_clustered', true),
      ]),
    ],
  });

  describe('user with privileges to see all cards', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(AuthService, {
            user$: of({
              privilege: {
                roles: {
                  $set: [Role.FullAdmin],
                },
              },
            } as LoggedInUser),
          }),
        ],
      });
    });

    it('renders Shares Dashboard Cards for privileged user', () => {
      expect(spectator.query(SmbCardComponent)).toExist();
      expect(spectator.query(NfsCardComponent)).toExist();
      expect(spectator.query(IscsiCardComponent)).toExist();
    });
  });

  describe('user with no privileges to see all cards', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(AuthService, {
            user$: of({
              privilege: {
                roles: {
                  $set: [Role.Readonly],
                },
              },
            } as LoggedInUser),
          }),
        ],
      });
    });

    it('renders Shares Dashboard Cards for privileged user', () => {
      expect(spectator.query(SmbCardComponent)).not.toExist();
      expect(spectator.query(NfsCardComponent)).not.toExist();
      expect(spectator.query(IscsiCardComponent)).not.toExist();
    });
  });

  describe('user with only SMB Card privileges to see', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(AuthService, {
            user$: of({
              privilege: {
                roles: {
                  $set: [Role.SharingSmbRead],
                },
              },
            } as LoggedInUser),
          }),
        ],
      });
    });

    it('renders Shares Dashboard Cards for privileged user', () => {
      expect(spectator.query(SmbCardComponent)).toExist();
      expect(spectator.query(NfsCardComponent)).not.toExist();
      expect(spectator.query(IscsiCardComponent)).not.toExist();
    });
  });
});
