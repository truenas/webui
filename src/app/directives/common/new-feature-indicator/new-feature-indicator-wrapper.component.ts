import {
  ChangeDetectionStrategy, Component, Input, TemplateRef,
} from '@angular/core';
import { NewFeatureIndicator } from 'app/directives/common/new-feature-indicator/new-feature-indicator.interface';
import { NewFeatureIndicatorService } from 'app/directives/common/new-feature-indicator/new-feature-indicator.service';

@Component({
  selector: 'ix-new-feature-indicator-wrapper',
  templateUrl: './new-feature-indicator-wrapper.component.html',
  styleUrls: ['./new-feature-indicator-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewFeatureIndicatorWrapperComponent {
  @Input() template: TemplateRef<unknown>;
  @Input() indicator: NewFeatureIndicator;

  constructor(
    private indicatorService: NewFeatureIndicatorService,
  ) { }

  onHidden(): void {
    this.indicatorService.markIndicatorAsShown(this.indicator);
  }
}
