import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { App } from 'app/interfaces/app.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { appNotesCardAnchorId } from 'app/pages/apps/components/installed-apps/app-notes-card/app-notes-card.component';

@Component({
  selector: 'ix-app-action-required-badge',
  templateUrl: './app-action-required-badge.component.html',
  styleUrls: ['./app-action-required-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, TnIconComponent, TnTooltipDirective, TestDirective],
})
export class AppActionRequiredBadgeComponent {
  private navigateAndHighlight = inject(NavigateAndHighlightService);

  readonly app = input.required<App>();

  protected readonly isVisible = computed(() => this.app().action_required);

  // Click intentionally bubbles to the parent row so it triggers viewDetails().
  // The 5s polling in waitForElement covers the navigation delay before the Notes card mounts.
  protected highlightNotes(): void {
    this.navigateAndHighlight.waitForElement(appNotesCardAnchorId, {
      block: 'start',
      inset: true,
    });
  }
}
