import { ChangeDetectionStrategy, Component, computed, input, inject, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ixAppsDataset } from 'app/pages/datasets/utils/dataset.utils';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { LicenseService } from 'app/services/license.service';

export interface InheritedWebShare {
  name: string;
  path: string;
  parentDataset: string;
}

@Component({
  selector: 'ix-usage-card',
  templateUrl: './usage-card.component.html',
  styleUrls: ['./usage-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatCardContent,
    IxIconComponent,
    RouterLink,
    TestDirective,
    RequiresRolesDirective,
  ],
})
export class UsageCardComponent {
  private slideIn = inject(SlideIn);
  private datasetStore = inject(DatasetTreeStore);
  private licenseService = inject(LicenseService);
  private destroyRef = inject(DestroyRef);

  readonly dataset = input.required<DatasetDetails>();
  readonly systemDataset = input.required<string>();
  readonly hasChildrenWithShares = input<boolean>(false);

  protected readonly nfsRequiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];
  protected readonly smbRequiredRoles = [Role.SharingSmbWrite, Role.SharingWrite];
  protected readonly webShareRequiredRoles = [Role.SharingWrite];

  readonly selectedBranch = toSignal(this.datasetStore.selectedBranch$);

  readonly isApplications = computed(() => {
    return this.dataset().name?.endsWith(ixAppsDataset);
  });

  /**
   * Finds all WebShares from ancestor datasets that include the current dataset.
   * A WebShare is inherited if the current dataset's mountpoint is within the WebShare's path.
   */
  private findInheritedShares(
    ancestors: DatasetDetails[],
    currentDataset: DatasetDetails,
  ): InheritedWebShare[] {
    const inheritedShares: InheritedWebShare[] = [];

    for (const ancestor of ancestors) {
      if (ancestor.webshares?.length) {
        const ancestorShares = this.getMatchingWebShares(ancestor, currentDataset);
        inheritedShares.push(...ancestorShares);
      }
    }

    return inheritedShares;
  }

  /**
   * Gets WebShares from an ancestor that include the current dataset.
   */
  private getMatchingWebShares(
    ancestor: DatasetDetails,
    currentDataset: DatasetDetails,
  ): InheritedWebShare[] {
    return (ancestor.webshares || [])
      .filter((webshare) => currentDataset.mountpoint.startsWith(webshare.path))
      .map((webshare) => ({
        name: webshare.name,
        path: webshare.path,
        parentDataset: ancestor.name,
      }));
  }

  /**
   * Formats an array of share names into a human-readable string with single quotes.
   * Examples:
   * - [] => ''
   * - ['share1'] => "'share1'"
   * - ['share1', 'share2'] => "'share1' and 'share2'"
   * - ['share1', 'share2', 'share3'] => "'share1', 'share2' and 'share3'"
   */
  private formatShareNames(names: string[]): string {
    if (names.length === 0) {
      return '';
    }
    if (names.length === 1) {
      return `'${names[0]}'`;
    }
    const quotedNames = names.map((name) => `'${name}'`);
    const lastItem = quotedNames.pop();
    return `${quotedNames.join(', ')} and ${lastItem}`;
  }

  readonly appNames = computed(() => {
    return uniq(this.dataset().apps?.map((app) => app.name))?.join(', ');
  });

  readonly vmNames = computed(() => {
    return uniq(this.dataset().vms?.map((app) => app.name))?.join(', ');
  });

  readonly isSystemDataset = computed(() => {
    return this.dataset().name === this.systemDataset();
  });

  readonly smbShareNames = computed(() => {
    const shareNames = this.dataset().smb_shares?.map((item) => item.share_name) || [];
    return this.formatShareNames(shareNames);
  });

  readonly webShareNames = computed(() => {
    const shareNames = this.dataset().webshares?.map((item) => item.name) || [];
    return this.formatShareNames(shareNames);
  });

  readonly inheritedWebShares = computed(() => {
    const branch = this.selectedBranch();
    const currentDataset = this.dataset();

    if (!branch || branch.length < 2) {
      return [];
    }

    // Get all ancestor datasets (excluding the current dataset which is last)
    const ancestors = branch.slice(0, -1);
    return this.findInheritedShares(ancestors, currentDataset);
  });

  readonly inheritedWebShareNames = computed(() => {
    const shareNames = this.inheritedWebShares().map((share) => share.name);
    const formatted = this.formatShareNames(shareNames);
    return formatted ? `${formatted} (inherited)` : '';
  });

  readonly hasDirectWebShares = computed(() => {
    return this.dataset().webshares?.length > 0;
  });

  readonly hasInheritedWebShares = computed(() => {
    return this.inheritedWebShares().length > 0;
  });

  private getUniqueInheritedShareNames(): string[] {
    const directShareNames = (this.dataset().webshares ?? []).map((share) => share.name);
    return this.inheritedWebShares()
      .map((share) => share.name)
      .filter((name) => !directShareNames.includes(name));
  }

  readonly combinedWebShareDisplay = computed(() => {
    const directShareNames = (this.dataset().webshares ?? []).map((share) => share.name);
    const uniqueInheritedNames = this.getUniqueInheritedShareNames()
      .map((name) => `${name} (inherited)`);

    return this.formatShareNames([...directShareNames, ...uniqueInheritedNames]);
  });

  readonly canCreateShare = computed(() => {
    return !this.hasChildrenWithShares()
      && !this.isSystemDataset()
      && !this.isApplications()
      && !this.dataset().apps?.length
      && !this.dataset().vms?.length
      && !this.dataset().smb_shares?.length
      && !this.dataset().nfs_shares?.length
      && !this.dataset().iscsi_shares?.length
      && !this.dataset().webshares?.length
      && !this.hasInheritedWebShares();
  });

  readonly hasLicenseOrTruenasConnect = toSignal(
    this.licenseService.hasLicenseOrTruenasConnect$,
    { initialValue: false },
  );

  createSmbShare(): void {
    this.slideIn.open(SmbFormComponent, {
      data: { defaultSmbShare: { path: this.dataset().mountpoint } as SmbShare },
    }).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil
    ).subscribe(() => {
      this.datasetStore.datasetUpdated();
    });
  }

  createNfsShare(): void {
    this.slideIn.open(NfsFormComponent, {
      data: { defaultNfsShare: { path: this.dataset().mountpoint } as NfsShare },
    }).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil
    ).subscribe(() => {
      this.datasetStore.datasetUpdated();
    });
  }

  createWebshare(): void {
    // Extract the dataset name (last part of the dataset path)
    const datasetName = this.dataset().name.split('/').pop() || '';

    this.slideIn.open(WebShareSharesFormComponent, {
      data: {
        isNew: true,
        name: datasetName,
        path: this.dataset().mountpoint,
      },
    }).pipe(
      filter((response) => !!response?.response),
      takeUntilDestroyed(this.destroyRef),
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil
    ).subscribe(() => {
      this.datasetStore.datasetUpdated();
    });
  }
}
