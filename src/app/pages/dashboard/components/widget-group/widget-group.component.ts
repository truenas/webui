import {
  ChangeDetectionStrategy, Component, computed, HostBinding, input, Type,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WidgetErrorComponent } from 'app/pages/dashboard/components/widget-error/widget-error.component';
import { layoutToSlotSizes, WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';

type OutletParams = { component: Type<unknown>; inputs: Record<string, unknown> } | null;

@Component({
  selector: 'ix-widget-group',
  templateUrl: './widget-group.component.html',
  styleUrls: ['./widget-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetGroupComponent {
  group = input.required<WidgetGroup>();

  @HostBinding('class')
  protected get layout(): string {
    return this.group().layout;
  }

  protected slotSizes = computed(() => {
    return layoutToSlotSizes[this.group().layout];
  });

  protected slotRange = computed(() => {
    return [...Array(this.slotSizes().length).keys()];
  });

  protected slots = computed(() => {
    return this.slotRange().map((slotIndex) => this.getSlotComponent(slotIndex));
  });

  constructor(
    private translate: TranslateService,
  ) {}

  private getSlotComponent(index: number): OutletParams {
    const widget = (this.group().slots || [])[index];
    if (!widget?.type) {
      return null;
    }

    const slotSize = this.slotSizes()[index];
    if (!slotSize) {
      console.error(`Unexpected widget ${widget.type} in slot ${index} of layout ${this.group().layout}`);
      return null;
    }

    const definition = widgetRegistry[widget.type];
    if (!definition) {
      return {
        component: WidgetErrorComponent,
        inputs: {
          message: this.translate.instant('{type} widget is not supported.', { type: widget.type }),
        },
      };
    }

    const supportedSizes = definition.supportedSizes;
    if (!supportedSizes.includes(slotSize)) {
      return {
        component: WidgetErrorComponent,
        inputs: {
          message: this.translate.instant('{type} widget does not support {size} size.', { type: widget.type, size: slotSize }),
        },
      };
    }

    const inputs: Record<string, unknown> = { size: slotSize };

    if (definition.settingsComponent) {
      inputs.settings = {
        ...widget.settings,
        widgetName: definition.name,
      };
    }

    return {
      inputs,
      component: definition.component,
    };
  }
}
