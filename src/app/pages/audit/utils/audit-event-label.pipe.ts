import { Pipe, PipeTransform } from '@angular/core';
import { AuditEvent, auditEventLabels } from 'app/enums/audit.enum';

@Pipe({
  name: 'auditEventLabel',
  pure: true,
})
export class AuditEventLabelPipe implements PipeTransform {
  transform(event: AuditEvent | undefined | null): string {
    return (event && auditEventLabels.get(event)) || event || '-';
  }
}
