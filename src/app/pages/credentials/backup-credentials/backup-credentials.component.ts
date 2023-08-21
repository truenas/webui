import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  templateUrl: './backup-credentials.component.html',
  styleUrls: ['./backup-credentials.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupCredentialsComponent {}
