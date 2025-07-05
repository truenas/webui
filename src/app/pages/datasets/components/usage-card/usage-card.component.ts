import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import {
  combineLatest, filter, map, of, catchError,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { SmbShare } from 'app/interfaces/smb-share.interface';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { ixAppsDataset } from 'app/pages/datasets/utils/dataset.utils';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { SmbFormComponent } from 'app/pages/sharing/smb/smb-form/smb-form.component';
import { WebShareSharesFormComponent } from 'app/pages/sharing/webshare/webshare-shares-form/webshare-shares-form.component';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
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
  private api = inject(ApiService);
  private store$ = inject(Store<AppState>);

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
    if (!this.dataset().smb_shares?.length) {
      return '';
    }
    const shareNames: string[] = this.dataset().smb_shares?.map((item) => item.share_name) || [];
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

  readonly webShareNames = computed(() => {
    if (!this.dataset().webshares?.length) {
      return '';
    }
    const shareNames: string[] = this.dataset().webshares?.map((item) => item.name) || [];
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

  readonly inheritedWebShares = computed(() => {
    const branch = this.selectedBranch();
    const currentDataset = this.dataset();

    if (!branch || branch.length < 2) {
      return [];
    }

    const inheritedShares: { name: string; path: string; parentDataset: string }[] = [];

    // Check all ancestors (exclude the current dataset which is the last in branch)
    for (let i = 0; i < branch.length - 1; i++) {
      const ancestor = branch[i];
      if (ancestor.webshares?.length) {
        // Check if any webshare from this ancestor includes our dataset
        for (const webshare of ancestor.webshares) {
          // Check if current dataset path starts with the webshare path
          if (currentDataset.mountpoint.startsWith(webshare.path)) {
            inheritedShares.push({
              name: webshare.name,
              path: webshare.path,
              parentDataset: ancestor.name,
            });
          }
        }
      }
    }

    return inheritedShares;
  });

  readonly inheritedWebShareNames = computed(() => {
    const inherited = this.inheritedWebShares();
    if (!inherited.length) {
      return '';
    }

    const shareNames = inherited.map((share) => share.name);
    if (shareNames.length === 1) {
      return "'" + shareNames[0] + "' (inherited)";
    }

    let shareNamesPretty = "'";
    for (let i = 0; i < shareNames.length - 1; i++) {
      if (i + 1 >= shareNames.length - 1) {
        shareNamesPretty += shareNames[i] + "', and '" + shareNames[shareNames.length - 1] + "' (inherited)";
      } else {
        shareNamesPretty += shareNames[i] + "', '";
      }
    }
    return shareNamesPretty;
  });

  readonly hasDirectWebShares = computed(() => {
    return this.dataset().webshares?.length > 0;
  });

  readonly hasInheritedWebShares = computed(() => {
    return this.inheritedWebShares().length > 0;
  });

  readonly combinedWebShareDisplay = computed(() => {
    const directShares = this.dataset().webshares || [];
    const inheritedShares = this.inheritedWebShares();

    // Get direct share names
    const directShareNames = directShares.map((share) => share.name);

    // Get inherited share names that are not already in direct shares
    const uniqueInheritedShareNames = inheritedShares
      .map((share) => share.name)
      .filter((name) => !directShareNames.includes(name));

    // Build display string
    const allShareNames = [...directShareNames, ...uniqueInheritedShareNames.map((name) => `${name} (inherited)`)];

    if (allShareNames.length === 0) {
      return '';
    }

    if (allShareNames.length === 1) {
      return "'" + allShareNames[0] + "'";
    }

    let shareNamesPretty = "'";
    for (let i = 0; i < allShareNames.length - 1; i++) {
      if (i + 1 >= allShareNames.length - 1) {
        shareNamesPretty += allShareNames[i] + "', and '" + allShareNames[allShareNames.length - 1] + "'";
      } else {
        shareNamesPretty += allShareNames[i] + "', '";
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
      && !this.dataset().iscsi_shares?.length
      && !this.dataset().webshares?.length
      && !this.hasInheritedWebShares();
  });

  readonly hasValidLicense = toSignal(
    combineLatest([
      this.store$.pipe(
        waitForSystemInfo,
        map((systemInfo) => systemInfo.license !== null),
      ),
      this.api.call('tn_connect.config').pipe(
        map((config: TruenasConnectConfig) => config?.status === TruenasConnectStatus.Configured),
        catchError(() => of(false)),
      ),
    ]).pipe(
      map(([hasLicense, tnConnectConfigured]) => hasLicense || tnConnectConfigured),
    ),
    { initialValue: false },
  );

  createSmbShare(): void {
    this.slideIn.open(SmbFormComponent, {
      data: { defaultSmbShare: { path: this.dataset().mountpoint } as SmbShare },
    }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.datasetStore.datasetUpdated();
    });
  }

  createNfsShare(): void {
    this.slideIn.open(NfsFormComponent, {
      data: { defaultNfsShare: { path: this.dataset().mountpoint } as NfsShare },
    }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
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
        search_indexed: true,
        is_home_base: false,
      },
    }).pipe(
      filter((response) => !!response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.datasetStore.datasetUpdated();
    });
  }
}
