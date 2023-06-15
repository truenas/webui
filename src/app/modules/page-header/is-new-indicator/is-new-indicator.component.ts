import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FeedbackDialogComponent } from 'app/modules/ix-feedback/feedback-dialog/feedback-dialog.component';

@Component({
  selector: 'ix-is-new-indicator',
  templateUrl: './is-new-indicator.component.html',
  styleUrls: ['./is-new-indicator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IsNewIndicatorComponent {
  constructor(private dialog: MatDialog) {}

  leaveFeedbackPressed(): void {
    this.dialog.open(FeedbackDialogComponent);
  }
}
