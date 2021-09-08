import {
  Component, ViewChild, OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import { LayoutContainer, LayoutChild } from 'app/core/classes/layouts';
import { ViewController } from 'app/core/classes/view-controller';
import { Display } from 'app/core/components/display/display.component';
import { CoreServiceInjector } from 'app/core/services/core-service-injector';
import { CoreService } from 'app/core/services/core-service/core.service';
import { CoreEvent } from 'app/interfaces/events';

@Component({
  selector: 'viewcontroller',
  templateUrl: './view-controller.component.html',
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
