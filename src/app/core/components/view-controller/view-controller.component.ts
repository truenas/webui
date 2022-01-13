import {
  Component, ViewChild, OnDestroy,
} from '@angular/core';
import { Subject } from 'rxjs';
import { ViewController } from 'app/core/classes/view-controller';
import { DisplayComponent } from 'app/core/components/display/display.component';
import { CoreEvent } from 'app/interfaces/events';
import { LayoutContainer } from 'app/interfaces/layout-container.interface';
import { CoreService } from 'app/services/core-service/core.service';

@Component({
  selector: 'viewcontroller',
  templateUrl: './view-controller.component.html',
  styleUrls: ['./view-controller.component.scss'],
})
export class ViewControllerComponent extends ViewController implements OnDestroy {
  @ViewChild('display', { static: true }) display: DisplayComponent;
  controlEvents: Subject<CoreEvent> = new Subject();

  layoutContainer: LayoutContainer = { layout: 'row', align: 'space-between center', gap: '2%' };

  constructor(
    private core: CoreService,
  ) {
    super();
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
