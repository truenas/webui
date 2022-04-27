import {
  ComponentFactoryResolver, ComponentRef, Directive, Input, OnInit, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { HeaderInputWrapperComponent } from 'app/modules/common/page-header-actions-wrapper/header-input-wrapper.component';

@Directive({
  selector: '[headerInput]',
})
export class HeaderInputDirective implements OnInit {
  compRef: ComponentRef<HeaderInputWrapperComponent>;
  @Input() prefixIcon: string;
  constructor(private vcRef: ViewContainerRef,
    private templateRef: TemplateRef<any>,
    private compFact: ComponentFactoryResolver) { }

  ngOnInit(): void {
    const myComp = this.compFact.resolveComponentFactory(HeaderInputWrapperComponent);
    this.compRef = this.vcRef.createComponent(myComp);
    this.compRef.instance.template = this.templateRef;
    this.compRef.instance.prefixIcon = this.prefixIcon;
  }
}
