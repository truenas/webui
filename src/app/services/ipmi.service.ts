import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs/operators';
import helptext from 'app/helptext/network/ipmi/ipmi';
import { IpmiIdentify } from 'app/interfaces/ipmi.interface';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Injectable({ providedIn: 'root' })
export class IpmiService {
  constructor(
    private dialog: DialogService,
    private translate: TranslateService,
    private ws: WebSocketService,
  ) {}

  showIdentifyDialog(): void {
    const dialog = this.dialog.select(
      this.translate.instant('IPMI Identify'),
      helptext.ipmiOptions,
      this.translate.instant('IPMI flash duration'),
    );

    dialog.componentInstance.switchSelectionEmitter.pipe(untilDestroyed(this)).subscribe((selection: number | 'force') => {
      const successMessage = selection === 0
        ? this.translate.instant('Flashing stopped.')
        : this.translate.instant('Now flashing...');
      dialog.afterClosed().pipe(
        filter(Boolean),
        switchMap(() => {
          let params: IpmiIdentify;
          if (selection === 'force') {
            params = { force: true };
          } else {
            params = { seconds: selection };
          }
          return this.ws.call('ipmi.identify', [params]);
        }),
        untilDestroyed(this),
      ).subscribe(() => {
        this.dialog.info(
          this.translate.instant('IPMI Identify'),
          successMessage,
        );
      });
    });
  }
}
