import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';

/**
 * Similar to WidgetGroupComponent, but with slightly different behaviour:
 * - slots can be selected.
 * - empty slots are explicitly shown as empty.
 * - widgets in slots of incorrect sizes are ignored and shown as empty.
 */
@Component({
  selector: 'ix-widget-editor-group',
  templateUrl: './widget-editor-group.component.html',
  styleUrls: ['./widget-editor-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetEditorGroupComponent {
  @Input() group: WidgetGroup;
  @Input() selection = 0;
  @Output() selectionChange = new EventEmitter<number>();
}
