import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { backupCredentialsElements } from 'app/pages/credentials/backup-credentials/backup-credentials.elements';
import { CloudCredentialsCardComponent } from './cloud-credentials-card/cloud-credentials-card.component';
import { SshConnectionCardComponent } from './ssh-connection-card/ssh-connection-card.component';
import { SshKeypairCardComponent } from './ssh-keypair-card/ssh-keypair-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-backup-credentials',
  templateUrl: './backup-credentials.component.html',
  styleUrls: ['./backup-credentials.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    UiSearchDirective,
    CloudCredentialsCardComponent,
    SshConnectionCardComponent,
    SshKeypairCardComponent,
  ],
})
export class BackupCredentialsComponent {
  protected readonly searchableElements = backupCredentialsElements;
}
