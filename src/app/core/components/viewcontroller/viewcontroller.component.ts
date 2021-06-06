import {
  Component, ViewChild, OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import { LayoutContainer, LayoutChild } from 'app/core/classes/layouts';
import { ViewController } from 'app/core/classes/viewcontroller';
import { Display } from 'app/core/components/display/display.component';
import { CoreService } from 'app/core/services/core.service';
import { CoreServiceInjector } from 'app/core/services/coreserviceinjector';
import { CoreEvent } from 'app/interfaces/events';

export interface ViewConfig {
  componentName: any;
  componentData: any;
  controller?: Subject<any>;
}

@Component({
  selector: 'viewcontroller',
  template: `
    <div
    [fxLayout]="layoutContainer.layout"
    [fxLayoutAlign]="layoutContainer.align"
    [fxLayoutGap]="layoutContainer.gap"
    >
      <display style="display:none;" #display></display>
    </div>
  `,
  styles: [':host {display:block;}'],
})
export class ViewControllerComponent extends ViewController implements OnDestroy {
  readonly componentName = ViewControllerComponent;
  @ViewChild('display', { static: true }) display: Display;
  protected core: CoreService;
  controlEvents: Subject<CoreEvent> = new Subject();

  layoutContainer: LayoutContainer = { layout: 'row', align: 'space-between center', gap: '2%' };
  layoutChild?: LayoutChild;

  constructor() {
    super();
    this.core = CoreServiceInjector.get(CoreService);
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  create(component: any, container?: string): any {
    if (!container) { container = 'display'; }
    return (this as any)[container].create(component);
  }

  addChild(instance: any, container?: string): void {
    if (!container) { container = 'display'; }
    (this as any)[container].addChild(instance);
  }

  removeChild(instance: any, container?: string): void {
    if (!container) { container = 'display'; }
    (this as any)[container].removeChild(instance);
  }
}
