import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TnCardComponent, TnIconComponent } from '@truenas/ui-components';

/**
 * Renders when there has been a fatal error with a widget, such as trying to use an unexpected widget type.
 */
@Component({
  selector: 'ix-widget-error',
  templateUrl: './widget-error.component.html',
  styleUrls: ['./widget-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnCardComponent, TnIconComponent],
})
export class WidgetErrorComponent {
  message = input<string>();
}
