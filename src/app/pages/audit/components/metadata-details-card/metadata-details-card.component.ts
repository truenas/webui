import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent } from '@truenas/ui-components';
import { AuditService } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { credentialTypeLabels } from 'app/interfaces/credential-type.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { AuditServiceLabelPipe } from 'app/pages/audit/utils/audit-service-label.pipe';

@Component({
  selector: 'ix-metadata-details-card',
  templateUrl: './metadata-details-card.component.html',
  styleUrls: ['./metadata-details-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AuditServiceLabelPipe,
    IxDateComponent,
    TnCardComponent,
    TranslateModule,
  ],
})
export class MetadataDetailsCardComponent {
  readonly log = input.required<AuditEntry>();

  // Only middleware entries carry connection details (origin, credentials).
  private middlewareServiceData = computed(() => {
    const log = this.log();
    return log.service === AuditService.Middleware ? log.service_data : null;
  });

  protected origin = computed(() => {
    const origin = this.middlewareServiceData()?.origin;
    // The origin duplicates the top-level address in the common case; only show it when it adds something.
    return origin && origin !== this.log().address ? origin : null;
  });

  protected credentialType = computed(() => {
    const type = this.middlewareServiceData()?.credentials?.credentials;
    if (!type) {
      return null;
    }
    return credentialTypeLabels.get(type) || type;
  });

  // The audit schema version is a major/minor pair, not an either/or flag.
  protected version = computed(() => {
    const vers = this.log().service_data?.vers;
    return vers ? `${vers.major}.${vers.minor}` : null;
  });
}
