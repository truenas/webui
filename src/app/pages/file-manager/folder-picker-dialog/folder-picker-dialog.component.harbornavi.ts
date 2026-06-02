import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

export interface FolderPickerDialogData {
  title: string;
  currentPath?: string;
  excludePaths?: string[];
  confirmLabel?: string;
  currentSelectionLabel?: string;
  disabledSelectionTooltip?: string;
  allowDatasetRootSelection?: boolean;
  itemSelectLabel?: string;
}

export interface FolderPickerDialogResult {
  path: string;
}

@Component({
  selector: 'ix-folder-picker-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    TranslateModule,
  ],
  template: `
    <h1 mat-dialog-title>{{ data.title }}</h1>

    <div mat-dialog-content>
      <p>
        Folder browsing is unavailable in the HarborNavi K3 Assistant build.
      </p>
      @if (data.currentPath) {
        <p class="current-path">{{ data.currentPath }}</p>
      }
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">Close</button>
    </div>
  `,
  styles: [
    `
      .current-path {
        font-family: monospace;
        word-break: break-all;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderPickerDialogComponent {
  readonly dialogRef = inject(MatDialogRef<FolderPickerDialogComponent, FolderPickerDialogResult>);
  readonly data = inject<FolderPickerDialogData>(MAT_DIALOG_DATA);

  cancel(): void {
    this.dialogRef.close();
  }
}
