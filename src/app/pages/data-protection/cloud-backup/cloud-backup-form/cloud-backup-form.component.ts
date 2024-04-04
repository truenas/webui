import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';

@Component({
  selector: 'ix-cloud-backup-form',
  templateUrl: './cloud-backup-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupFormComponent {
  editingTask: CloudBackup;

  constructor(
    private chainedRef: ChainedRef<CloudBackup>,
  ) {
    this.editingTask = chainedRef.getData();
  }
}
