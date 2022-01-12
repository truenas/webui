import {
  Component, ViewChild, OnDestroy, Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import { LayoutContainer, LayoutChild } from 'app/core/classes/layouts';
import { ViewController } from 'app/core/classes/view-controller';
import { DisplayComponent } from 'app/core/components/display/display.component';
import { CoreServiceInjector } from 'app/core/services/core-service-injector';
import { CoreService } from 'app/core/services/core-service/core.service';
import { CoreEvent } from 'app/interfaces/events';

@Component({
  selector: 'viewcontroller',
  templateUrl: './view-controller.component.html',
  styleUrls: ['./view-controller.component.scss'],
})
export class ViewControllerComponent extends ViewController implements OnDestroy {
  readonly componentName = ViewControllerComponent;
  @ViewChild('display', { static: true }) display: DisplayComponent;
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

  create<T>(component: Type<T>): T {
    return this.display.create(component) as T;
  }

  addChild(instance: unknown): void {
    this.display.addChild(instance);
  }

  removeChild(instance: unknown): void {
    this.display.removeChild(instance);
  }
}
