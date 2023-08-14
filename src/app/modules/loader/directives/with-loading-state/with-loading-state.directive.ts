import {
  ChangeDetectorRef, Directive, Input, OnDestroy, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import {
  WithLoadingStateErrorComponent,
} from 'app/modules/loader/directives/with-loading-state/with-loading-state-error/with-loading-state-error.component';
import {
  WithLoadingStateLoaderComponent,
} from 'app/modules/loader/directives/with-loading-state/with-loading-state-loader/with-loading-state-loader.component';

/**
 * Shows inline skeleton loader, error or content depending on the loading state.
 * Designed to be used with toLoadingState pipe.
 *
 * Usage:
 * ```
 * <div *ixWithLoadingState="value$ as value">{{ value }}</div>
 * ```
 */
@Directive({
  selector: '[ixWithLoadingState]',
})
export class WithLoadingStateDirective<V = unknown> implements OnDestroy {
  renderSubscription: Subscription;

  constructor(
    private templateRef: TemplateRef<WithLoadingStateContext<V>>,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
  ) {}

  @Input('ixWithLoadingState') set state(state$: Observable<LoadingState<V>>) {
    this.renderSubscription?.unsubscribe();
    this.renderSubscription = state$?.subscribe((state) => this.renderState(state));
  }

  ngOnDestroy(): void {
    this.renderSubscription?.unsubscribe();
  }

  private renderState(state: LoadingState<V>): void {
    this.viewContainerRef.clear();

    switch (true) {
      case state.isLoading:
        this.viewContainerRef.createComponent(WithLoadingStateLoaderComponent);
        break;
      case Boolean(state.error): {
        const errorComponent = this.viewContainerRef.createComponent(WithLoadingStateErrorComponent);
        errorComponent.instance.error = state.error;
        this.viewContainerRef.insert(errorComponent.hostView);
        break;
      }
      default:
        this.viewContainerRef.createEmbeddedView(this.templateRef, {
          $implicit: state.value,
          ixWithLoadingState: state.value,
        });
    }

    this.cdr.markForCheck();
  }

  static ngTemplateContextGuard<V>(
    directive: WithLoadingStateDirective<V>, context: unknown,
  ): context is WithLoadingStateContext<V> {
    return true;
  }
}

export interface WithLoadingStateContext<V> {
  $implicit: V;
  ixWithLoadingState: V;
}
