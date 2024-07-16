import {
  ChangeDetectionStrategy, Component, computed, effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { unsupportedEnclosureMockModel } from 'app/constants/server-series.constant';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';

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
  readonly selectedSlot = this.store.selectedSlot;
  readonly isLoading = this.store.isLoading;
  readonly isSupportedEnclosure = computed(() => this.enclosure().model !== unsupportedEnclosureMockModel);

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

    const minisWithOwnPage = [
      EnclosureModel.Mini3E,
      EnclosureModel.Mini3EPlus,
      EnclosureModel.Mini3X,
      EnclosureModel.Mini3XPlus,
      EnclosureModel.Mini3XlPlus,
    ];

    if (!minisWithOwnPage.includes(enclosure.model)) {
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
