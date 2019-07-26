import {
  ComponentFactoryResolver,
  Directive,
  Input,
  OnInit,
  ViewContainerRef
} from '@angular/core';
import { config } from 'rxjs';

@Directive({selector : '[dynamicComponent]'})
export class DynamicComponentDirective implements OnInit {
  @Input() component;
  @Input() config;
  @Input() parent;

  constructor(private resolver: ComponentFactoryResolver,
              private container: ViewContainerRef) {}

  ngOnInit() {
      const tempComponent = this.resolver.resolveComponentFactory(this.component);
      this.component = this.container.createComponent(tempComponent);
      this.component.instance.config = this.config;
      this.component.instance.parent = this.parent;
  }
}
