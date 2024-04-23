import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { certificatesDashElements } from 'app/pages/credentials/certificates-dash/certificates-dash.elements';

@UntilDestroy()
@Component({
  selector: 'ix-certificates-dash',
  templateUrl: './certificates-dash.component.html',
  styleUrls: ['./certificates-dash.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificatesDashComponent {
  protected readonly searchableElements = certificatesDashElements;
}
