import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-page',
  templateUrl: './enclosure-page.component.html',
  styleUrls: ['./enclosure-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosurePageComponent {
  readonly enclosure = this.store.selectedEnclosure;
  readonly selectedView = this.store.selectedView;

  protected readonly isExpandersView = computed(() => {
    return this.selectedView() === EnclosureView.Expanders;
  });

  protected readonly title = computed(() => {
    return this.translate.instant('Disks on {enclosure}', {
      enclosure: this.store.enclosureLabel(),
    });
  });

  constructor(
    private store: EnclosureStore,
    private translate: TranslateService,
    protected store$: Store<AppState>,
  ) {}
}
