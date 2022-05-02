import {
  ComponentFactoryResolver, ComponentRef, Directive, EventEmitter, Input, OnInit, Output, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { HeaderInputWrapperComponent } from 'app/modules/common/page-header-actions-wrapper/header-input-wrapper.component';

@UntilDestroy()
@Directive({
  selector: '[headerInput]',
})
export class HeaderInputDirective implements OnInit {
  compRef: ComponentRef<HeaderInputWrapperComponent>;
  @Input() prefixIcon: string;
  @Input() shouldShowReset: Observable<boolean>;
  @Output() resetInput = new EventEmitter<void>();
  constructor(private vcRef: ViewContainerRef,
    private templateRef: TemplateRef<any>,
    private compFact: ComponentFactoryResolver) { }

  ngOnInit(): void {
    const myComp = this.compFact.resolveComponentFactory(HeaderInputWrapperComponent);
    this.compRef = this.vcRef.createComponent(myComp);
    this.compRef.instance.template = this.templateRef;
    this.compRef.instance.prefixIcon = this.prefixIcon;
    this.compRef.instance.reset.pipe(untilDestroyed(this)).subscribe(() => this.resetInput.emit());
    this.compRef.instance.shouldShowReset$ = this.shouldShowReset;
  }
}
