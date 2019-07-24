import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  OnChanges,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { TaskScheduleListComponent } from 'app/pages/task-calendar/components/task-schedule-list/task-schedule-list.component';

const COMPONENTS = {
  TaskScheduleListComponent: TaskScheduleListComponent
};

@Directive({ selector: '[dynamicComponent]' })
export class DynamicComponentDirective implements OnInit, OnChanges {
  @Input() component;
  @Input() config;
  @Input() parent;

  private _component: ComponentRef<any>;

  constructor(private resolver: ComponentFactoryResolver, private container: ViewContainerRef) {}

  ngOnInit() {
    this._buildComponent();
  }

  ngOnChanges() {
    if (this._component && this._component.instance) {
      this._component.destroy();
      this._buildComponent();
    }
  }

  private _buildComponent(): void {
    this._component = this.container.createComponent(
      /* If component is registered with our COMPONENTS dictionary, use that */
      this.resolver.resolveComponentFactory(
        typeof this.component === 'string' ? COMPONENTS[this.component] : this.component
      )
    );
    this._component.instance.config = this.config;
    this._component.instance.parent = this.parent;
  }
}
