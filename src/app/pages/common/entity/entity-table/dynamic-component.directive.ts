import {
  ComponentFactoryResolver,
  Directive,
  Input,
  OnInit,
  ViewContainerRef,
} from '@angular/core';

@Directive({ selector: '[dynamicComponent]' })
export class DynamicComponentDirective implements OnInit {
  @Input() component: any;
  @Input() config: any;
  @Input() parent: any;

  constructor(private resolver: ComponentFactoryResolver,
    private container: ViewContainerRef) {}

  ngOnInit(): void {
    const tempComponent = this.resolver.resolveComponentFactory(this.component);
    this.component = this.container.createComponent(tempComponent);
    this.component.instance.config = this.config;
    this.component.instance.parent = this.parent;
  }
}
