import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { IfNightlyDirective } from 'app/directives/if-nightly/if-nightly.directive';
import { FeedbackDialog } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-header-badge',
  templateUrl: './header-badge.component.html',
  styleUrls: ['./header-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IfNightlyDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class HeaderBadgeComponent {
  private matDialog = inject(MatDialog);

  readonly customBadgeTitle = input<string>();

  leaveFeedbackPressed(): void {
    this.matDialog.open(FeedbackDialog);
  }
}
