import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Adds a manage certificates link to the form control.
 * Designed to be used with an ix-select.
 */
@Component({
  selector: 'ix-with-manage-certificates-link',
  templateUrl: './with-manage-certificates-link.component.html',
  styleUrls: ['./with-manage-certificates-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithManageCertificatesLinkComponent {
}
