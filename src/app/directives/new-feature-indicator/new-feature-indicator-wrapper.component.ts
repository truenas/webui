import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, TemplateRef, inject } from '@angular/core';
import { TnIconComponent } from '@truenas/ui-components';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { NewFeatureIndicator } from 'app/directives/new-feature-indicator/new-feature-indicator.interface';
import { NewFeatureIndicatorService } from 'app/directives/new-feature-indicator/new-feature-indicator.service';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-new-feature-indicator-wrapper',
  templateUrl: './new-feature-indicator-wrapper.component.html',
  styleUrls: ['./new-feature-indicator-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxPopperjsModule,
    NgTemplateOutlet,
    TnIconComponent,
    CastPipe,
    TestDirective,
  ],
})
export class NewFeatureIndicatorWrapperComponent {
  private indicatorService = inject(NewFeatureIndicatorService);

  readonly template = input.required<TemplateRef<unknown>>();
  readonly indicator = input.required<NewFeatureIndicator>();

  onHidden(): void {
    this.indicatorService.markIndicatorAsShown(this.indicator());
  }
}
