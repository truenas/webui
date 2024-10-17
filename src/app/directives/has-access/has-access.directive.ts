import {
  ComponentRef, Directive, HostBinding, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MissingAccessWrapperComponent } from 'app/directives/has-access/missing-access-wrapper.component';

@UntilDestroy()
@Directive({
  selector: '[ixHasAccess]',
  standalone: true,
})
export class HasAccessDirective {
  private wrapperContainer: ComponentRef<MissingAccessWrapperComponent>;
  private previousAccess: boolean = null;

  @Input()
  set ixHasAccess(hasAccess: boolean) {
    if (this.previousAccess === hasAccess) {
      return;
    }

    this.previousAccess = hasAccess;

    if (!hasAccess) {
      this.wrapperContainer = this.viewContainerRef.createComponent(MissingAccessWrapperComponent);
      this.wrapperContainer.instance.template = this.templateRef;
      this.wrapperContainer.instance.class = this.elementClass;
    } else {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    }
  }

  protected cssClassList: string[] = [];

  @Input('class')
  @HostBinding('class')
  get elementClass(): string {
    return this.cssClassList.join(' ');
  }

  set elementClass(val: string) {
    this.cssClassList = val.split(' ');
  }

  constructor(
    protected templateRef: TemplateRef<HTMLElement>,
    protected viewContainerRef: ViewContainerRef,
  ) { }
}
