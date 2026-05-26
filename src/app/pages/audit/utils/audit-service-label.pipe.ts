import { Pipe, PipeTransform } from '@angular/core';
import { AuditService, auditServiceLabels } from 'app/enums/audit.enum';

@Pipe({
  name: 'auditServiceLabel',
  pure: true,
})
export class AuditServiceLabelPipe implements PipeTransform {
  transform(service: string | undefined | null): string {
    return auditServiceLabels.get(service as AuditService) || service || '-';
  }
}
