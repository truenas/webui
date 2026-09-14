import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';

/**
 * Adds a manage certificates link to the form control.
 * Designed to wrap a `tn-form-field` holding a certificate `tn-select`.
 */
@Component({
  selector: 'ix-with-manage-certificates-link',
  templateUrl: './with-manage-certificates-link.component.html',
  styleUrls: ['./with-manage-certificates-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    TranslateModule,
    TnTestIdDirective,
  ],
})
export class WithManageCertificatesLinkComponent {
}
