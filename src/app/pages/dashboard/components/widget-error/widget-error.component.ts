import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Renders when there has been a fatal error with a widget, such as trying to use an unexpected widget type.
 */
@Component({
  selector: 'ix-widget-error',
  templateUrl: './widget-error.component.html',
  styleUrls: ['./widget-error.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetErrorComponent {
  message = input<string>();
}
