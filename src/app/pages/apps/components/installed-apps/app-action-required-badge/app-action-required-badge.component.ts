import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { WINDOW } from 'app/helpers/window.helper';
import { App } from 'app/interfaces/app.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

export const appNotesCardAnchorId = 'app-notes-card';

@Component({
  selector: 'ix-app-action-required-badge',
  templateUrl: './app-action-required-badge.component.html',
  styleUrls: ['./app-action-required-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, MatTooltipModule, TnIconComponent, TnTooltipDirective, TestDirective],
})
export class AppActionRequiredBadgeComponent {
  private window = inject<Window>(WINDOW);

  readonly app = input.required<App>();

  protected readonly isVisible = computed(() => !!this.app()?.action_required);

  protected scrollToNotes(): void {
    // Defer so a containing row click that triggers app selection
    // (and renders the Notes card) finishes before we scroll.
    this.window.setTimeout(() => {
      this.window.document.getElementById(appNotesCardAnchorId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }
}
