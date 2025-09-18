import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatAnchor } from '@angular/material/button';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ViewElementsMenuComponent } from 'app/pages/system/enclosure/components/enclosure-header/view-elements-menu/view-elements-menu.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-dashboard',
  templateUrl: './enclosure-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./enclosure-dashboard.component.scss'],
  providers: [
    EnclosureStore,
  ],
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
  protected enclosureStore = inject(EnclosureStore);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  readonly isJbofLicensed$ = this.api.call('jbof.licensed');

  readonly selectedEnclosure = this.enclosureStore.selectedEnclosure;

  loadingConf = {
    type: EmptyType.Loading,
    large: true,
  } as EmptyConfig;

  emptyDashboardConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('Enclosure Unavailable'),
    message: this.translate.instant('We’re unable to access the enclosure at the moment. Please ensure it’s connected properly and reload the page.'),
  };

  protected readonly isLoading = this.enclosureStore.isLoading;

  constructor() {
    this.enclosureStore.initiate(null);
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
