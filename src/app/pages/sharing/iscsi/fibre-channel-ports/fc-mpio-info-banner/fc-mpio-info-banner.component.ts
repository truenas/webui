import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';

@Component({
  selector: 'ix-fc-mpio-info-banner',
  templateUrl: './fc-mpio-info-banner.component.html',
  styleUrls: ['./fc-mpio-info-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TranslateModule,
  ],
})
export class FcMpioInfoBannerComponent {}
