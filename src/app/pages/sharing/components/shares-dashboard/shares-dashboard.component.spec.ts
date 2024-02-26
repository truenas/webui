import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { IscsiCardComponent } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.component';
import { NfsCardComponent } from 'app/pages/sharing/components/shares-dashboard/nfs-card/nfs-card.component';
import { SharesDashboardComponent } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.component';
import { SmbCardComponent } from 'app/pages/sharing/components/shares-dashboard/smb-card/smb-card.component';

describe('SharesDashboardComponent', () => {
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
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows cards for each share type', () => {
    expect(spectator.query(SmbCardComponent)).toExist();
    expect(spectator.query(NfsCardComponent)).toExist();
    expect(spectator.query(IscsiCardComponent)).toExist();
  });
});
