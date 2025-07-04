import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, TemplateRef,
} from '@angular/core';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { NewFeatureIndicator } from 'app/directives/new-feature-indicator/new-feature-indicator.interface';
import { NewFeatureIndicatorService } from 'app/directives/new-feature-indicator/new-feature-indicator.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
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
    IxIconComponent,
    CastPipe,
    TestDirective,
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
