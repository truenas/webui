import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnEmptyComponent, TnSpinnerComponent, TnTestIdDirective,
} from '@truenas/ui-components';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { ViewElementsMenuComponent } from 'app/pages/system/enclosure/components/enclosure-header/view-elements-menu/view-elements-menu.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

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
    TnButtonComponent,
    TnTestIdDirective,
    RouterLink,
    ViewElementsMenuComponent,
    RouterOutlet,
    TnEmptyComponent,
    TnSpinnerComponent,
    TranslateModule,
  ],
})
export class EnclosureDashboardComponent {
  private enclosureStore = inject(EnclosureStore);
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  protected readonly isJbofLicensed = toSignal(this.api.call('jbof.licensed'), { initialValue: 0 });

  protected readonly selectedEnclosure = this.enclosureStore.selectedEnclosure;

  protected readonly isLoading = this.enclosureStore.isLoading;

  constructor() {
    this.enclosureStore.initiate(null);
    this.enclosureStore.listenForDiskUpdates().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const enclosure = params.get('enclosure');
        if (!enclosure) {
          return;
        }

        this.enclosureStore.selectEnclosure(enclosure);
      });
  }
}
