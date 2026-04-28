import {
  ChangeDetectionStrategy, Component, inject, input,
} from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { App } from 'app/interfaces/app.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { appNotesCardAnchorId } from 'app/pages/apps/components/installed-apps/installed-apps.constants';

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

  protected readonly tooltipText = T('Action required. Click to see required actions in the Notes card.');

  protected onClick(): void {
    // Click bubbles to the parent app-row, whose idempotent selection handler
    // mounts the details panel containing the notes card; the poll then highlights it.
    this.navigateAndHighlight.waitForElement(appNotesCardAnchorId, {
      block: 'start',
      inset: true,
    });
  }
}
