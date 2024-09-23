import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
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
    IxIconComponent,
    TestIdModule,
    CastPipe,
  ],
})
export class TooltipComponent {
  readonly message = input<string>();
  readonly header = input<string>();
}
