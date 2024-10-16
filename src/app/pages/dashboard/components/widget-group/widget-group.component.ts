import { NgComponentOutlet, AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EnvironmentInjector,
  HostBinding,
  inject,
  input,
  runInInjectionContext,
  Type,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { WidgetErrorComponent } from 'app/pages/dashboard/components/widget-error/widget-error.component';
import { WidgetVisibilityDepsType } from 'app/pages/dashboard/types/widget-component.interface';
import { layoutToSlotSizes, WidgetGroup } from 'app/pages/dashboard/types/widget-group.interface';
import { widgetRegistry } from 'app/pages/dashboard/widgets/all-widgets.constant';

type OutletParams = {
  component: Type<unknown>;
  inputs: Record<string, unknown>;
  isVisible$: Observable<boolean>;
} | null;

@Component({
  selector: 'ix-widget-group',
  templateUrl: './widget-group.component.html',
  styleUrls: ['./widget-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgComponentOutlet, AsyncPipe],
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

  private environmentInjector = inject(EnvironmentInjector);

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

    let isVisible$ = of(true);
    const definition = widgetRegistry[widget.type];
    if (!definition) {
      return {
        component: WidgetErrorComponent,
        inputs: {
          message: this.translate.instant('{type} widget is not supported.', {
            type: definition?.name || widget.type,
          }),
        },
        isVisible$,
      };
    }

    if (definition.visibility) {
      const deps: WidgetVisibilityDepsType = new Map();
      runInInjectionContext(this.environmentInjector, () => {
        definition.visibility.deps.forEach((service) => deps.set(service, inject(service)));
      });
      isVisible$ = definition.visibility.isVisible$(deps);
    }

    const supportedSizes = definition.supportedSizes;

    if (!supportedSizes.includes(slotSize)) {
      return {
        component: WidgetErrorComponent,
        inputs: {
          message: this.translate.instant('{type} widget does not support {size} size.', {
            type: definition?.name || widget.type,
            size: slotSize,
          }),
        },
        isVisible$,
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
      isVisible$,
    };
  }
}
