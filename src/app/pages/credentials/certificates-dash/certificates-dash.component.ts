import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  templateUrl: './certificates-dash.component.html',
  styleUrls: ['./certificates-dash.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificatesDashComponent {}
