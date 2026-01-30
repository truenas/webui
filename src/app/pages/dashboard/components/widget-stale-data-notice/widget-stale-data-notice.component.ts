import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';

/**
 * Renders a notice when widget data hasn't been received within expected timeframe.
 */
@Component({
  selector: 'ix-widget-stale-data-notice',
  templateUrl: './widget-stale-data-notice.component.html',
  styleUrls: ['./widget-stale-data-notice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnIconComponent, TranslateModule],
})
export class WidgetStaleDataNoticeComponent {}
