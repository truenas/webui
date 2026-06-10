import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialog } from '@truenas/ui-components';
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
  private tnDialog = inject(TnDialog);

  readonly customBadgeTitle = input<string>();

  leaveFeedbackPressed(): void {
    this.tnDialog.open(FeedbackDialog);
  }
}
