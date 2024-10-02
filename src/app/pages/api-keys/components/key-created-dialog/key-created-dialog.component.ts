import { Clipboard } from '@angular/cdk/clipboard';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-key-created-dialog',
  templateUrl: './key-created-dialog.component.html',
  styleUrls: ['./key-created-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    CdkScrollable,
    MatDialogContent,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    TranslateModule,
  ],
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
