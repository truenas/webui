import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnBannerComponent } from '@truenas/ui-components';
import { QrCodeModule } from 'ng-qrcode';
import { helptext2fa } from 'app/helptext/system/2fa';

@Component({
  selector: 'ix-qr-viewer',
  templateUrl: './qr-viewer.component.html',
  styleUrls: ['./qr-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnBannerComponent,
    QrCodeModule,
    TranslateModule,
  ],
})
export class QrViewerComponent {
  readonly qrInfo = input.required<string>();
  readonly showWarning = input(false);

  readonly helpText = helptext2fa;
}
