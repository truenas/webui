import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPopperjsModule, NgxPopperjsPlacements } from 'ngx-popperjs';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-tooltip',
  styleUrls: ['./tooltip.component.scss'],
  templateUrl: './tooltip.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxPopperjsModule,
    TranslateModule,
    IxIconModule,
    TestIdModule,
    CastPipe,
  ],
})
export class TooltipComponent {
  readonly message = input<string>();
  readonly header = input<string>();

  // Conversion here just allows us to use enum values as string without having to import the enum
  readonly placement = input<NgxPopperjsPlacements, `${NgxPopperjsPlacements}`>(NgxPopperjsPlacements.AUTO, {
    transform: (value) => {
      return value as NgxPopperjsPlacements;
    },
  });
}
