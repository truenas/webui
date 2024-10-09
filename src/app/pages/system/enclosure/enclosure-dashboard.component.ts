import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ViewElementsMenuComponent } from 'app/pages/system/enclosure/components/enclosure-header/view-elements-menu/view-elements-menu.component';
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
  standalone: true,
  imports: [
    PageHeaderComponent,
    MatAnchor,
    TestDirective,
    RouterLink,
    ViewElementsMenuComponent,
    RouterOutlet,
    EmptyComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class EnclosureDashboardComponent {
  readonly isJbofLicensed$ = this.ws.call('jbof.licensed');

  readonly selectedEnclosure = this.enclosureStore.selectedEnclosure;

  emptyDashboardConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('Enclosure Unavailable'),
    message: this.translate.instant('We’re unable to access the enclosure at the moment. Please ensure it’s connected properly and reload the page.'),
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
