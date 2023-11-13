import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { BackupCredentialsComponent } from 'app/pages/credentials/backup-credentials/backup-credentials.component';
import { CloudCredentialsCardComponent } from 'app/pages/credentials/backup-credentials/cloud-credentials-card/cloud-credentials-card.component';
import { SshConnectionCardComponent } from 'app/pages/credentials/backup-credentials/ssh-connection-card/ssh-connection-card.component';
import { SshKeypairCardComponent } from 'app/pages/credentials/backup-credentials/ssh-keypair-card/ssh-keypair-card.component';

describe('BackupCredentialsComponent', () => {
  let spectator: Spectator<BackupCredentialsComponent>;
  const createComponent = createComponentFactory({
    component: BackupCredentialsComponent,
    declarations: [
      MockComponents(
        CloudCredentialsCardComponent,
        SshConnectionCardComponent,
        SshKeypairCardComponent,
      ),
    ],
    providers: [],
    imports: [],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders Backup Credentials Cards', () => {
    expect(spectator.query(CloudCredentialsCardComponent)).toExist();
    expect(spectator.query(SshConnectionCardComponent)).toExist();
    expect(spectator.query(SshKeypairCardComponent)).toExist();
  });
});
