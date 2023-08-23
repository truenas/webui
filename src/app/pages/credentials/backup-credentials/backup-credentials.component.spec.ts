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

  it('renders ix-cloud-credentials-card', () => {
    const cloudCredentialsCard = spectator.query('ix-cloud-credentials-card');
    expect(cloudCredentialsCard).toBeTruthy();
  });

  it('renders ix-ssh-connection-card', () => {
    const sshConnectionCard = spectator.query('ix-ssh-connection-card');
    expect(sshConnectionCard).toBeTruthy();
  });

  it('renders ix-ssh-keypair-card', () => {
    const sshKeypairCard = spectator.query('ix-ssh-keypair-card');
    expect(sshKeypairCard).toBeTruthy();
  });
});
