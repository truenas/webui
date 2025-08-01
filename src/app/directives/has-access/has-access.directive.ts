import { ComponentRef, Directive, HostBinding, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { MissingAccessWrapperComponent } from 'app/directives/has-access/missing-access-wrapper.component';

@UntilDestroy()
@Directive({
  selector: '[ixHasAccess]',
})
export class HasAccessDirective {
  protected templateRef = inject<TemplateRef<HTMLElement>>(TemplateRef);
  protected viewContainerRef = inject(ViewContainerRef);

  private wrapperContainer: ComponentRef<MissingAccessWrapperComponent>;
  private previousAccess: boolean | null = null;

  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input()
  set ixHasAccess(hasAccess: boolean) {
    if (this.previousAccess === hasAccess) {
      return;
    }

    this.previousAccess = hasAccess;

    if (!hasAccess) {
      this.wrapperContainer = this.viewContainerRef.createComponent(MissingAccessWrapperComponent);
      this.wrapperContainer.setInput('template', this.templateRef);
      this.wrapperContainer.setInput('class', this.elementClass);
    } else {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    }
  }

  protected cssClassList: string[] = [];

  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input('class')
  @HostBinding('class')
  get elementClass(): string {
    return this.cssClassList.join(' ');
  }

  set elementClass(val: string) {
    this.cssClassList = val.split(' ');
  }
}
