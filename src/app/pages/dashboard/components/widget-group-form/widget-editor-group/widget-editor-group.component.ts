import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { WidgetGroupComponent } from 'app/pages/dashboard/components/widget-group/widget-group.component';

/**
 * Similar to WidgetGroupComponent, but with slightly different behaviour:
 * - slots can be selected.
 * - empty slots are explicitly shown as empty.
 * - widgets in slots of incorrect sizes are ignored and shown as empty.
 */
@Component({
  selector: 'ix-widget-editor-group',
  styleUrls: ['./widget-editor-group.component.scss'],
  templateUrl: './widget-editor-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetEditorGroupComponent extends WidgetGroupComponent {
  readonly selectedSlot = input(0);

  selectedSlotChange = output<number>();

  onSlotSelected(event: Event, slotIndex: number): void {
    event.preventDefault();
    this.selectedSlotChange.emit(slotIndex);
  }
}
