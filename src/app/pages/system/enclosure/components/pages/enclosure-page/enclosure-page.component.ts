import {
  ChangeDetectionStrategy, Component, computed, effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
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
  readonly isLoading = this.store.isLoading;

  protected readonly isExpandersView = computed(() => {
    return this.selectedView() === EnclosureView.Expanders;
  });

  protected readonly title = computed(() => {
    return this.translate.instant('Disks on {enclosure}', {
      enclosure: this.store.enclosureLabel(),
    });
  });

  protected readonly redirectOnMinis = effect(() => {
    if (!this.enclosure()) {
      return;
    }

    const minisWithOwnPage = [
      EnclosureModel.Mini3E,
      EnclosureModel.Mini3EPlus,
      EnclosureModel.Mini3X,
      EnclosureModel.Mini3XPlus,
      EnclosureModel.Mini3XlPlus,
    ];

    if (!minisWithOwnPage.includes(this.enclosure().model)) {
      return;
    }

    this.router.navigate(['/system', 'viewenclosure', this.enclosure().id, 'mini']);
  }, { allowSignalWrites: true });

  constructor(
    private store: EnclosureStore,
    private translate: TranslateService,
    private router: Router,
  ) {}
}
