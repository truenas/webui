import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';
import { App } from 'app/interfaces/app.interface';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';

@Component({
  selector: 'ix-app-action-required-badge',
  templateUrl: './app-action-required-badge.component.html',
  styleUrls: ['./app-action-required-badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, TnIconComponent, TnTooltipDirective, TnTestIdDirective],
})
export class AppActionRequiredBadgeComponent {
  readonly app = input.required<App>();

  readonly actionRequiredClicked = output();

  /**
   * App names carry digits (`n8n`, `netbox3`), and the library's kebab-casing does not split a
   * letter→digit boundary the way lodash does — so the name is pre-normalized here to keep
   * `button-n-8-n-action-required` byte-identical. See {@link normalizeTestIdParts}.
   */
  protected testId = computed(() => normalizeTestIdParts([this.app().name, 'action-required']));

  protected onClick(event: MouseEvent): void {
    event.stopPropagation();
    this.actionRequiredClicked.emit();
  }
}
