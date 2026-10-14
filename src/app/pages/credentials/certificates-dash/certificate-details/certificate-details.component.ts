import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { Certificate } from 'app/interfaces/certificate.interface';

@Component({
  selector: 'ix-certificate-details',
  templateUrl: './certificate-details.component.html',
  styleUrls: ['./certificate-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, TnTestIdDirective],
})
export class CertificateDetailsComponent {
  readonly certificate = input.required<Certificate>();
}
