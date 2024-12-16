import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { IfNightlyDirective } from 'app/directives/if-nightly/if-nightly.directive';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-header-badge',
  templateUrl: './header-badge.component.html',
  styleUrls: ['./header-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IfNightlyDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class HeaderBadgeComponent {
  readonly customBadgeTitle = input<string>();

  constructor(private matDialog: MatDialog) {}

  leaveFeedbackPressed(): void {
    this.matDialog.open(FeedbackDialogComponent);
  }
}
