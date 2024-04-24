import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { WidgetGroupComponent } from 'app/pages/dashboard/components/widget-group/widget-group.component';
import { WidgetGroupLayout, widgetGroupIcons } from 'app/pages/dashboard/types/widget-group.interface';

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

  protected form = this.formBuilder.group({
    template: [''],
    layout: [WidgetGroupLayout.Full],
  });
  readonly layoutsMap = widgetGroupIcons;

  // TODO: Implement template options
  templateOptions$ = of([]);

  constructor(
    private formBuilder: FormBuilder,
    translate: TranslateService,
  ) {
    super(translate);
  }
}
