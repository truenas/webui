import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { backupCredentialsElements } from 'app/pages/credentials/backup-credentials/backup-credentials.elements';

@UntilDestroy()
@Component({
  templateUrl: './backup-credentials.component.html',
  styleUrls: ['./backup-credentials.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupCredentialsComponent {
  protected readonly searchableElements = backupCredentialsElements;
}
