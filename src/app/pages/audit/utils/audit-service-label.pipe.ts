import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuditService, auditServiceLabels } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';

@Pipe({
  name: 'auditServiceLabel',
  pure: true,
})
export class AuditServiceLabelPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(row: AuditEntry): string {
    const labelKey = auditServiceLabels.get(row.service as AuditService);
    if (labelKey) {
      return this.translate.instant(labelKey);
    }
    return row.service || '-';
  }
}
