import {
  ChangeDetectionStrategy, Component, computed, effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { hasMiniSpecificPage } from 'app/pages/system/enclosure/utils/has-mini-specific-page.utils';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-page',
  templateUrl: './enclosure-page.component.html',
  styleUrls: ['./enclosure-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosurePageComponent {
  readonly enclosure = this.store.selectedEnclosure;
  readonly enclosures = this.store.enclosures;
  readonly selectedView = this.store.selectedView;
  readonly selectedSlot = this.store.selectedSlot;
  readonly isLoading = this.store.isLoading;

  protected readonly EnclosureView = EnclosureView;

  protected readonly title = computed(() => {
    return this.translate.instant('Disks on {enclosure}', {
      enclosure: this.store.enclosureLabel(),
    });
  });

  protected readonly redirectOnMinis = effect(() => {
    const enclosure = this.store.selectedEnclosure();
    if (!enclosure) {
      return;
    }

    if (!hasMiniSpecificPage(enclosure)) {
      return;
    }

    this.router.navigate(['/system', 'viewenclosure', enclosure.id, 'mini']);
  }, { allowSignalWrites: true });

  constructor(
    private store: EnclosureStore,
    private translate: TranslateService,
    private router: Router,
  ) {}
}
