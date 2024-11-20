import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { dataProtectionCardElements } from 'app/pages/datasets/components/data-protection-card/data-protection-card.elements';
import { SnapshotAddFormComponent } from 'app/pages/datasets/modules/snapshots/snapshot-add-form/snapshot-add-form.component';
import { SlideInService } from 'app/services/slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-data-protection-card',
  templateUrl: './data-protection-card.component.html',
  styleUrls: ['./data-protection-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    UiSearchDirective,
    TranslateModule,
    MatCardContent,
    RouterLink,

  ],
})
export class DataProtectionCardComponent {
  readonly dataset = input.required<DatasetDetails>();

  protected readonly requiredRoles = [Role.SnapshotWrite];
  protected readonly searchableElements = dataProtectionCardElements;

  constructor(
    private slideInService: SlideInService,
    private snackbarService: SnackbarService,
    private translate: TranslateService,
  ) {}

  addSnapshot(): void {
    const slideInRef = this.slideInService.open(SnapshotAddFormComponent, { data: this.dataset().id });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.snackbarService.success(this.translate.instant('Snapshot added successfully.'));
    });
  }
}
