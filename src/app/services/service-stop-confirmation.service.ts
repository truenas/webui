import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, switchMap } from 'rxjs';
import { ServiceName, serviceNames } from 'app/enums/service-name.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { IscsiService } from 'app/services/iscsi.service';

/**
 * The confirmation shown before a service is stopped, shared by System > Services and the Shares page cards
 * so that stopping a service asks the same question from both. iSCSI also warns about active connections.
 */
@Injectable({ providedIn: 'root' })
export class ServiceStopConfirmationService {
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private iscsiService = inject(IscsiService);

  confirmStop(serviceName: ServiceName): Observable<boolean> {
    if (serviceName === ServiceName.Iscsi) {
      return this.confirmStopIscsiService(serviceName);
    }

    return this.dialogService.confirm({
      message: this.translate.instant('Are you sure you want to stop {serviceName}?', {
        serviceName: serviceNames.get(serviceName),
      }),
      hideCheckbox: true,
      buttonColor: 'warn',
      buttonText: this.translate.instant('Stop'),
    });
  }

  private confirmStopIscsiService(serviceName: ServiceName): Observable<boolean> {
    return this.iscsiService.getGlobalSessions().pipe(
      switchMap((sessions) => {
        let message = this.translate.instant('Stop {serviceName}?', { serviceName: serviceNames.get(serviceName) });
        if (sessions.length) {
          const connectionsMessage = this.translate.instant('{n, plural, one {There is an active iSCSI connection.} other {There are # active iSCSI connections}}', {
            n: sessions.length,
          });
          const stopMessage = this.translate.instant('Stop the {serviceName} service and close these connections?', {
            serviceName: serviceNames.get(serviceName),
          });
          message = `<font color="red">${connectionsMessage}</font><br>${stopMessage}` as TranslatedString;
        }

        return this.dialogService.confirm({
          message,
          hideCheckbox: true,
          buttonColor: 'warn',
          buttonText: this.translate.instant('Stop'),
        });
      }),
    );
  }
}
