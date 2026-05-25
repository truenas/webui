import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuditEvent, auditEventLabels } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';

@Pipe({
  name: 'auditEventLabel',
  pure: true,
})
export class AuditEventLabelPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(row: AuditEntry): string {
    const labelKey = auditEventLabels.get(row.event as AuditEvent);
    if (labelKey) {
      return this.translate.instant(labelKey);
    }
    return row.event || '-';
  }
}
