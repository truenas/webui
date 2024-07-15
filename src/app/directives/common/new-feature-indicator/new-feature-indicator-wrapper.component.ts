import {
  animate, style, transition, trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy, Component, input, TemplateRef,
} from '@angular/core';
import { NewFeatureIndicator } from 'app/directives/common/new-feature-indicator/new-feature-indicator.interface';
import { NewFeatureIndicatorService } from 'app/directives/common/new-feature-indicator/new-feature-indicator.service';

@Component({
  selector: 'ix-new-feature-indicator-wrapper',
  templateUrl: './new-feature-indicator-wrapper.component.html',
  styleUrls: ['./new-feature-indicator-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms 150ms ease-in', style({ opacity: 1 })),
      ]),
    ]),
  ],
})
export class NewFeatureIndicatorWrapperComponent {
  readonly template = input.required<TemplateRef<unknown>>();
  readonly indicator = input.required<NewFeatureIndicator>();

  constructor(
    private indicatorService: NewFeatureIndicatorService,
  ) { }

  onHidden(): void {
    this.indicatorService.markIndicatorAsShown(this.indicator());
  }
}
