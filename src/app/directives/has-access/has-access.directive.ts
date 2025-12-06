import { ComponentRef, Directive, Input, inputBinding, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { MissingAccessWrapperComponent } from 'app/directives/has-access/missing-access-wrapper.component';

@Directive({
  selector: '[ixHasAccess]',
  host: {
    '[class]': 'elementClass',
  },
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
      this.wrapperContainer = this.viewContainerRef.createComponent(MissingAccessWrapperComponent, {
        bindings: [
          inputBinding('class', () => this.elementClass),
          inputBinding('template', () => this.templateRef),
        ],
      });
    } else {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    }
  }

  protected cssClassList: string[] = [];

  // eslint-disable-next-line @angular-eslint/prefer-signals
  @Input('class')
  get elementClass(): string {
    return this.cssClassList.join(' ');
  }

  set elementClass(val: string) {
    this.cssClassList = val.split(' ');
  }
}
