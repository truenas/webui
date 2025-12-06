import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

/**
 * Renders a notice when widget data hasn't been received within expected timeframe.
 */
@Component({
  selector: 'ix-widget-stale-data-notice',
  templateUrl: './widget-stale-data-notice.component.html',
  styleUrls: ['./widget-stale-data-notice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxIconComponent, TranslateModule],
})
export class WidgetStaleDataNoticeComponent {}
