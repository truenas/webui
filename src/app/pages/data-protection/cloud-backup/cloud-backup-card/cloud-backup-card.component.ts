import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { filter } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-cloud-backup-card',
  templateUrl: './cloud-backup-card.component.html',
  styleUrl: './cloud-backup-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudBackupCardComponent {
  protected readonly requiredRoles = [Role.CloudBackupWrite];

  constructor(
    private slideIn: IxChainedSlideInService,
  ) {}

  protected onAdd(): void {
    this.slideIn.open(CloudBackupFormComponent).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe({
      next: () => {

      },
    });
  }
}
