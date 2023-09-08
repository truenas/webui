import { Component, Input } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-data-protection-card',
  templateUrl: './data-protection-card.component.html',
  styleUrls: ['./data-protection-card.component.scss'],
})
export class DataProtectionCardComponent {
  @Input() dataset: DatasetDetails;

  readonly console = console;

  constructor(
    private slideInService: IxSlideInService,
    private snackbarService: SnackbarService,
    private translate: TranslateService,
  ) {}

  addSnapshot(): void {
    const slideInRef = this.slideInService.open(SnapshotAddFormComponent, { data: this.dataset.id });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.snackbarService.success(this.translate.instant('Snapshot added successfully.'));
    });
  }
}
