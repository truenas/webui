import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';

@Component({
  selector: 'ix-widget-group',
  templateUrl: './widget-group.component.html',
  styleUrls: ['./widget-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupComponent {
  @Input() group: WidgetGroup;

  // TODO: See tests first.
  // TODO: Use `widgetRegistry` to figure out component that needs to be rendered for a widget.

  // TODO: Provide size and settings properties to widgets.
  protected readonly SlotSize = SlotSize;
}
