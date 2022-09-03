import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { T } from 'app/translate-marker';

interface BatchResults {
  arguments: [ string, [string][], string ];
  result: { error?: string; result?: boolean }[];
  [key: string]: any;
}

@Component({
  templateUrl: './snapshots-batch-delete-results-dialog.component.html',
  styleUrls: ['./snapshots-batch-delete-results-dialog.component.scss'],
})
export class SnapshotsBatchDeleteResultsDialogComponent {
  snapshotNamesWithErrors: { snapshot: string; error: string }[] = [];
  snapshotsDeleted: string[] = [];
  snapshotsFailedToDelete: string[] = [];
  constructor(@Inject(MAT_DIALOG_DATA) public data: { results: BatchResults }) {
    this.data.results.result.forEach((operationResponse, index) => {
      const snapshotName = this.data.results.arguments[1][index][0];
      if (operationResponse.error) {
        this.snapshotNamesWithErrors.push({
          snapshot: snapshotName,
          error: operationResponse.error.replace('[EFAULT] ', ''),
        });
      } else if (operationResponse.result) {
        this.snapshotsDeleted.push(snapshotName);
      } else {
        this.snapshotsFailedToDelete.push(snapshotName);
      }
    });
  }

  get errorsTitle(): string {
    return T('Error when deleting ' + this.errorsCount + ' snapshots');
  }

  get errorsCount(): number {
    return Object.keys(this.snapshotNamesWithErrors).length;
  }

  get successMsg(): string {
    return T('Successfully deleted ' + this.snapshotsDeleted.length + ' snapshots');
  }

  get failureMsg(): string {
    return T('Failed to delete ' + this.snapshotsFailedToDelete.length + ' snapshots');
  }
}
