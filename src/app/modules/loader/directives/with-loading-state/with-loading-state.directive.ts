import {
  ChangeDetectorRef, Directive, input, OnChanges, OnDestroy, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { isObservable, Observable, Subscription } from 'rxjs';
import { LoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
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
  standalone: true,
})
export class WithLoadingStateDirective<V = unknown> implements OnChanges, OnDestroy {
  renderSubscription: Subscription;

  constructor(
    private templateRef: TemplateRef<WithLoadingStateContext<V>>,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
  ) {}

  readonly state = input.required<LoadingState<V> | Observable<LoadingState<V>>>({
    alias: 'ixWithLoadingState',
  });

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('state' in changes) {
      this.updateView();
    }
  }

  ngOnDestroy(): void {
    this.renderSubscription?.unsubscribe();
  }

  private updateView(): void {
    const state$ = this.state();
    this.renderSubscription?.unsubscribe();

    if (isObservable(state$)) {
      this.renderSubscription = state$?.subscribe((state) => this.renderState(state));
    } else {
      this.renderState(state$);
    }
  }

  private renderState(state: LoadingState<V>): void {
    this.viewContainerRef.clear();

    switch (true) {
      case state.isLoading:
        this.viewContainerRef.createComponent(WithLoadingStateLoaderComponent);
        break;
      case Boolean(state.error): {
        const errorComponent = this.viewContainerRef.createComponent(WithLoadingStateErrorComponent);
        errorComponent.setInput('error', state.error);
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
    directive: WithLoadingStateDirective<V>,
    context: unknown,
  ): context is WithLoadingStateContext<V> {
    return true;
  }
}

export interface WithLoadingStateContext<V> {
  $implicit: V;
  ixWithLoadingState: V;
}
