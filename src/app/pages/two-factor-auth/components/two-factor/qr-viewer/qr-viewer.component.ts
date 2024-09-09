import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { helptext2fa } from 'app/helptext/system/2fa';

@UntilDestroy()
@Component({
  selector: 'ix-qr-viewer',
  templateUrl: './qr-viewer.component.html',
  styleUrls: ['./qr-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrViewerComponent {
  readonly qrInfo = input.required<string>();
  readonly showWarning = input(false);

  readonly helpText = helptext2fa;
}
