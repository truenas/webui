import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WidgetErrorComponent } from 'app/pages/dashboard/components/widget-error/widget-error.component';
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
  standalone: true,
  imports: [
    TestDirective,
    WidgetErrorComponent,
    NgComponentOutlet,
    TranslateModule,
  ],
})
export class WidgetEditorGroupComponent extends WidgetGroupComponent {
  readonly selectedSlot = input(0);
  validationErrors = input.required<ValidationErrors[]>();

  selectedSlotChange = output<number>();

  onSlotSelected(event: Event, slotIndex: number): void {
    event.preventDefault();
    this.selectedSlotChange.emit(slotIndex);
  }

  hasErrors(index: number): boolean {
    return !!Object.keys(this.validationErrors()[index]).length;
  }
}
