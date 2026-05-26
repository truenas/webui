import { Pipe, PipeTransform } from '@angular/core';
import { AuditEvent, auditEventLabels } from 'app/enums/audit.enum';

@Pipe({
  name: 'auditEventLabel',
  pure: true,
})
export class AuditEventLabelPipe implements PipeTransform {
  transform(event: string | undefined | null): string {
    return auditEventLabels.get(event as AuditEvent) || event || '-';
  }
}
