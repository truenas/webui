import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { QrCodeModule } from 'ng-qrcode';
import { helptext2fa } from 'app/helptext/system/2fa';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';

@UntilDestroy()
@Component({
  selector: 'ix-qr-viewer',
  templateUrl: './qr-viewer.component.html',
  styleUrls: ['./qr-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    WarningComponent,
    QrCodeModule,
    TranslateModule,
  ],
})
export class QrViewerComponent {
  readonly qrInfo = input.required<string>();
  readonly showWarning = input(false);

  readonly helpText = helptext2fa;
}
