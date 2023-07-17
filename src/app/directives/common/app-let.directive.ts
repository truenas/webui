import {
  Directive, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';

interface LetContext<T = unknown> {
  appLet: T;
}

/**
 * Usage: creating variables in template without ngIf.
 * Useful with async pipe.
 * @example
 * ```
 * <div *appLet="state$ | async as state">
 *   <div>{{state.something}}</div>
 * </div>
 * ```
 */
@Directive({
  selector: '[appLet]',
})
export class LetDirective<T> {
  private context: LetContext<T> = { appLet: null };

  constructor(viewContainer: ViewContainerRef, templateRef: TemplateRef<LetContext<T>>) {
    viewContainer.createEmbeddedView(templateRef, this.context);
  }

  @Input()
  set appLet(value: T) {
    this.context.appLet = value;
  }

  // ngTemplateContextGuard flag to help with the Language Service
  static ngTemplateContextGuard<T>(
    dir: LetDirective<T>,
    ctx: unknown,
  ): ctx is LetContext<Exclude<T, false | 0 | '' | null | undefined>> {
    return true;
  }
}
