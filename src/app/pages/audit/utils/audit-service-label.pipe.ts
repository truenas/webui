import { Pipe, PipeTransform } from '@angular/core';
import { AuditService, auditServiceLabels } from 'app/enums/audit.enum';

@Pipe({
  name: 'auditServiceLabel',
  pure: true,
})
export class AuditServiceLabelPipe implements PipeTransform {
  transform(service: AuditService | undefined | null): string {
    return (service && auditServiceLabels.get(service)) || service || '-';
  }
}
