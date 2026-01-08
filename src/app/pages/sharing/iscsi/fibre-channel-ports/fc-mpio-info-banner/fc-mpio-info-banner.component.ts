import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-fc-mpio-info-banner',
  templateUrl: './fc-mpio-info-banner.component.html',
  styleUrls: ['./fc-mpio-info-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    TranslateModule,
  ],
})
export class FcMpioInfoBannerComponent {}
