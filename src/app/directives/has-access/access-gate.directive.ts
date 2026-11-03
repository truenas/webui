import {
  Directive, inputBinding, TemplateRef, ViewContainerRef, inject,
} from '@angular/core';
import { MissingAccessWrapperComponent } from 'app/directives/has-access/missing-access-wrapper.component';

/**
 * Renders the template plainly when access is granted, or inside a "missing permissions"
 * wrapper when it is not. `*ixHasAccess` and `*ixRequiresRoles` differ only in where the
 * answer comes from, so each passes it to `renderAccess()`.
 */
@Directive()
export abstract class AccessGateDirective {
  protected templateRef = inject<TemplateRef<HTMLElement>>(TemplateRef);
  protected viewContainerRef = inject(ViewContainerRef);

  private previousAccess: boolean | null = null;

  protected renderAccess(hasAccess: boolean): void {
    if (this.previousAccess === hasAccess) {
      return;
    }

    this.previousAccess = hasAccess;

    if (!hasAccess) {
      this.viewContainerRef.createComponent(MissingAccessWrapperComponent, {
        bindings: [inputBinding('template', () => this.templateRef)],
      });
    } else {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
    }
  }
}
