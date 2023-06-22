import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FeedbackDialogComponent } from 'app/modules/ix-feedback/feedback-dialog/feedback-dialog.component';

@Component({
  selector: 'ix-new-page-badge',
  templateUrl: './new-page-badge.component.html',
  styleUrls: ['./new-page-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPageBadgeComponent {
  constructor(private dialog: MatDialog) {}

  leaveFeedbackPressed(): void {
    this.dialog.open(FeedbackDialogComponent);
  }
}
