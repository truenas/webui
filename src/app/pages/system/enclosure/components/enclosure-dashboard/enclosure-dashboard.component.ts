import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-dashboard',
  templateUrl: './enclosure-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./enclosure-dashboard.component.scss'],
  providers: [
    EnclosureStore,
  ],
})
export class EnclosureDashboardComponent {
  readonly isJbofLicensed$ = this.ws.call('jbof.licensed');

  readonly selectedEnclosure = this.enclosureStore.selectedEnclosure;

  emptyDashboardConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('Enclosure Unavailable'),
    message: this.translate.instant('We’re unable to access the enclosure at the moment. Please ensure it’s connected properly and try again.'),
  };

  constructor(
    private enclosureStore: EnclosureStore,
    private route: ActivatedRoute,
    private ws: WebSocketService,
    private translate: TranslateService,
  ) {
    this.enclosureStore.initiate();
    this.enclosureStore.listenForDiskUpdates().pipe(untilDestroyed(this)).subscribe();

    this.route.paramMap
      .pipe(untilDestroyed(this))
      .subscribe((params) => {
        const enclosure = params.get('enclosure');
        if (!enclosure) {
          return;
        }

        this.enclosureStore.selectEnclosure(enclosure);
      });
  }
}
