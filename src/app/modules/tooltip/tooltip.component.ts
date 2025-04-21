import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPopperjsModule, NgxPopperjsPlacements, NgxPopperjsTriggers } from 'ngx-popperjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-tooltip',
  styleUrls: ['./tooltip.component.scss'],
  templateUrl: './tooltip.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxPopperjsModule,
    TranslateModule,
    IxIconComponent,
    TestDirective,
  ],
})
export class TooltipComponent {
  readonly message = input<string>('');
  readonly header = input<string>('');

  protected readonly clickTrigger = 'click' as NgxPopperjsTriggers;

  // Conversion here just allows us to use enum values as string without having to import the enum
  readonly placement = input<NgxPopperjsPlacements, `${NgxPopperjsPlacements}`>(NgxPopperjsPlacements.AUTO, {
    transform: (value) => {
      return value as NgxPopperjsPlacements;
    },
  });
}
