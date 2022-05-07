import {
  Component, ViewChild, OnDestroy, Type,
} from '@angular/core';
import { Subject } from 'rxjs';
import { ViewController } from 'app/core/classes/view-controller';
import { DisplayComponent } from 'app/core/components/display/display.component';
import { CoreEvent } from 'app/interfaces/events';
import { LayoutContainer } from 'app/interfaces/layout-container.interface';
import { CoreService } from 'app/services/core-service/core.service';

@Component({
  selector: 'ix-view-controller',
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
