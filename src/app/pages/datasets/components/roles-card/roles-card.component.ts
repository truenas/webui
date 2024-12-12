import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ixAppsDataset } from 'app/pages/datasets/utils/dataset.utils';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { SlideInService } from 'app/services/slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-roles-card',
  templateUrl: './roles-card.component.html',
  styleUrls: ['./roles-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatCardContent,
    IxIconComponent,
    TranslateModule,
    RouterLink,
    TestDirective,
    RequiresRolesDirective,
  ],
})
export class RolesCardComponent {
  readonly dataset = input.required<DatasetDetails>();
  readonly systemDataset = input.required<string>();
  readonly hasChildrenWithShares = input<boolean>(false);

  protected readonly nfsRequiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  protected readonly smbRequiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];

  readonly isApplications = computed(() => {
    return this.dataset().name?.endsWith(ixAppsDataset);
  });

  readonly appNames = computed(() => {
    return uniq(this.dataset().apps.map((app) => app.name)).join(', ');
  });

  readonly vmNames = computed(() => {
    return uniq(this.dataset().vms.map((app) => app.name)).join(', ');
  });

  readonly isSystemDataset = computed(() => {
    return this.dataset().name === this.systemDataset();
  });

  readonly smbShareNames = computed(() => {
    if (!this.dataset().smb_shares?.length) {
      return '';
    }
    const shareNames: string[] = this.dataset().smb_shares.map((item) => item.share_name);
    if (shareNames.length === 1) {
      return "'" + shareNames[0] + "'";
    }
    let shareNamesPretty = "'";
    for (let i = 0; i < shareNames.length - 1; i++) {
      if (i + 1 >= shareNames.length - 1) {
        shareNamesPretty += shareNames[i] + "', and '" + shareNames[shareNames.length - 1] + "'";
      } else {
        shareNamesPretty += shareNames[i] + "', '";
      }
    }
    return shareNamesPretty;
  });

  readonly canCreateShare = computed(() => {
    return !this.hasChildrenWithShares()
      && !this.isSystemDataset()
      && !this.isApplications()
      && !this.dataset().apps?.length
      && !this.dataset().vms?.length
      && !this.dataset().smb_shares?.length
      && !this.dataset().nfs_shares?.length
      && !this.dataset().iscsi_shares?.length;
  });

  constructor(
    private slideInService: SlideInService,
    private datasetStore: DatasetTreeStore,
  ) {}

  createSmbShare(): void {
    const slideInRef = this.slideInService.open(SmbFormComponent, {
      data: { defaultSmbShare: { path: this.dataset().mountpoint } },
    });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.datasetStore.datasetUpdated();
    });
  }

  createNfsShare(): void {
    const slideInRef = this.slideInService.open(NfsFormComponent, {
      data: { defaultNfsShare: { path: this.dataset().mountpoint } },
    });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.datasetStore.datasetUpdated();
    });
  }
}
