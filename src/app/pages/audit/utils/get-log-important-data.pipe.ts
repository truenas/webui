import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { getLogImportantData } from 'app/pages/audit/utils/get-log-important-data.utils';

@Pipe({
  name: 'getLogImportantData',
  pure: true,
})
export class GetLogImportantDataPipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(log: AuditEntry): string {
    return getLogImportantData(log, this.translate);
  }
}
