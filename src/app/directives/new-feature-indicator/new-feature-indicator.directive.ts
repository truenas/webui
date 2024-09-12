import {
  ComponentRef, Directive, Input, TemplateRef, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NewFeatureIndicatorWrapperComponent } from 'app/directives/new-feature-indicator/new-feature-indicator-wrapper.component';
import { NewFeatureIndicator } from 'app/directives/new-feature-indicator/new-feature-indicator.interface';
import { NewFeatureIndicatorService } from 'app/directives/new-feature-indicator/new-feature-indicator.service';

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
@UntilDestroy()
@Directive({
  selector: '[ixNewFeatureIndicator]',
  standalone: true,
})
export class NewFeatureIndicatorDirective {
  private wrapperContainer: ComponentRef<NewFeatureIndicatorWrapperComponent>;
  private indicator: NewFeatureIndicator;

  @Input()
  set ixNewFeatureIndicator(indicator: NewFeatureIndicator) {
    this.indicator = indicator;
    this.updateIndicator();
  }

  constructor(
    private indicatorService: NewFeatureIndicatorService,
    private templateRef: TemplateRef<unknown>,
    private viewContainerRef: ViewContainerRef,
  ) {
    this.indicatorService.onShown.pipe(untilDestroyed(this)).subscribe((indicator) => {
      if (indicator === this.indicator) {
        this.updateIndicator();
      }
    });
  }

  updateIndicator(): void {
    this.viewContainerRef.clear();
    if (this.indicatorService.wasIndicatorShown(this.indicator)) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      return;
    }

    this.wrapperContainer = this.viewContainerRef.createComponent(NewFeatureIndicatorWrapperComponent);
    this.wrapperContainer.setInput('template', this.templateRef);
    this.wrapperContainer.setInput('indicator', this.indicator);
  }
}
