import { Clipboard } from '@angular/cdk/clipboard';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  templateUrl: './key-created-dialog.component.html',
  styleUrls: ['./key-created-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeyCreatedDialogComponent {
  constructor(
    private clipboard: Clipboard,
    @Inject(MAT_DIALOG_DATA) public key: string,
  ) {}

  onCopyPressed(): void {
    this.clipboard.copy(this.key);
  }
}
