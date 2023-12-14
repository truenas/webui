import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Role } from 'app/enums/role.enum';
import { IscsiCardComponent } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.component';
import { NfsCardComponent } from 'app/pages/sharing/components/shares-dashboard/nfs-card/nfs-card.component';
import { SharesDashboardComponent } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.component';
import { SmbCardComponent } from 'app/pages/sharing/components/shares-dashboard/smb-card/smb-card.component';

describe('SharesDashboardComponent', () => {
  let spectator: Spectator<SharesDashboardComponent>;
  let auth: MockAuthService;
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
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    auth = spectator.inject(MockAuthService);
  });

  it('user with privileges to see all cards', () => {
    expect(spectator.query(SmbCardComponent)).toExist();
    expect(spectator.query(NfsCardComponent)).toExist();
    expect(spectator.query(IscsiCardComponent)).toExist();
  });

  it('user with no privileges to see all cards', () => {
    auth.setRoles([Role.AlertListRead]);

    expect(spectator.query(SmbCardComponent)).not.toExist();
    expect(spectator.query(NfsCardComponent)).not.toExist();
    expect(spectator.query(IscsiCardComponent)).not.toExist();
  });

  it('user with only SMB Card privileges to see', () => {
    auth.setRoles([Role.SharingSmbRead]);

    expect(spectator.query(SmbCardComponent)).toExist();
    expect(spectator.query(NfsCardComponent)).not.toExist();
    expect(spectator.query(IscsiCardComponent)).not.toExist();
  });
});
