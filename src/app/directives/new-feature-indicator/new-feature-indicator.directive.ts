import { DestroyRef, Directive, input, inputBinding, OnChanges, OnInit, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NewFeatureIndicatorWrapperComponent } from 'app/directives/new-feature-indicator/new-feature-indicator-wrapper.component';
import { NewFeatureIndicator } from 'app/directives/new-feature-indicator/new-feature-indicator.interface';
import { NewFeatureIndicatorService } from 'app/directives/new-feature-indicator/new-feature-indicator.service';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';

/**
 * Usage: adding an indicator with a hint about a new feature.
 *
 * @example
 * ```
 * <button
 *   *ixNewFeatureIndicator="{ key: 'test_key', message: 'test_message' }"
 * ></button>
 * ```
 */
@Directive({
  selector: '[ixNewFeatureIndicator]',
})
export class NewFeatureIndicatorDirective implements OnInit, OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private indicatorService = inject(NewFeatureIndicatorService);
  private templateRef = inject<TemplateRef<unknown>>(TemplateRef);
  private viewContainerRef = inject(ViewContainerRef);

  private indicator: NewFeatureIndicator;

  readonly newFeatureIndicator = input.required<NewFeatureIndicator>({
    alias: 'ixNewFeatureIndicator',
  });

  constructor() {
    this.indicatorService.onShown.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((indicator) => {
      if (indicator === this.indicator) {
        this.updateIndicator();
      }
    });
  }

  ngOnInit(): void {
    this.indicator = this.newFeatureIndicator();
    this.updateIndicator();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('newFeatureIndicator' in changes) {
      this.indicator = this.newFeatureIndicator();
      this.updateIndicator();
    }
  }

  updateIndicator(): void {
    this.viewContainerRef.clear();
    if (this.indicatorService.wasIndicatorShown(this.indicator)) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      return;
    }

    this.viewContainerRef.createComponent(NewFeatureIndicatorWrapperComponent, {
      bindings: [
        inputBinding('template', () => this.templateRef),
        inputBinding('indicator', () => this.indicator),
      ],
    });
  }
}
