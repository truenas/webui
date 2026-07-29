import { ChangeDetectionStrategy, Component, DestroyRef, OnChanges, OnInit, input, computed, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardHeaderActionsDirective, TnEmptyComponent, TnTooltipDirective,
} from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AclType } from 'app/enums/acl-type.enum';
import { NfsAclTag } from 'app/enums/nfs-acl.enum';
import { Role } from 'app/enums/role.enum';
import { helptextPermissions } from 'app/helptext/storage/volumes/datasets/dataset-permissions';
import { Acl } from 'app/interfaces/acl.interface';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { FileSystemStat } from 'app/interfaces/filesystem-stat.interface';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { ViewNfsPermissionsComponent } from 'app/pages/datasets/modules/permissions/components/view-nfs-permissions/view-nfs-permissions.component';
import { ViewPosixPermissionsComponent } from 'app/pages/datasets/modules/permissions/components/view-posix-permissions/view-posix-permissions.component';
import { ViewTrivialPermissionsComponent } from 'app/pages/datasets/modules/permissions/components/view-trivial-permissions/view-trivial-permissions.component';
import { PermissionsCardStore } from 'app/pages/datasets/modules/permissions/stores/permissions-card.store';
import { isRootDataset } from 'app/pages/datasets/utils/dataset.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-permissions-card',
  templateUrl: 'permissions-card.component.html',
  styleUrls: ['./permissions-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderActionsDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    NgxSkeletonLoaderModule,
    ViewTrivialPermissionsComponent,
    ViewPosixPermissionsComponent,
    ViewNfsPermissionsComponent,
    TnEmptyComponent,
    TranslateModule,
    CastPipe,
    TnTooltipDirective,
  ],
  providers: [
    PermissionsCardStore,
  ],
})
export class PermissionsCardComponent implements OnInit, OnChanges {
  private store = inject(PermissionsCardStore);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly dataset = input.required<DatasetDetails>();

  protected readonly requiredRoles = [Role.DatasetWrite];

  protected readonly isLoading = signal(false);
  protected readonly isMissingMountpoint = signal(false);
  protected readonly isNotMounted = signal(false);
  protected readonly stat = signal<FileSystemStat | null>(null);
  protected readonly acl = signal<Acl | null>(null);

  readonly AclType = AclType;

  redirectToEditPermissions(): void {
    if (this.acl()?.trivial) {
      this.router.navigate(['/datasets', this.dataset().id, 'permissions', 'edit']);
    } else {
      this.router.navigate(['/datasets', 'acl', 'edit'], { queryParams: { path: '/mnt/' + this.dataset().id } });
    }
  }

  // Returns a translation key (not an instant translation) so the `| translate` pipe in the
  // template re-translates it on a runtime language switch while the card stays mounted.
  protected readonly emptyTitle = computed(() => {
    if (this.isMissingMountpoint()) {
      return T('Dataset has no mountpoint');
    }
    if (this.isNotMounted()) {
      return T('Dataset is not mounted');
    }
    if (this.isLocked()) {
      return T('Dataset is locked');
    }

    return T('No Data');
  });

  readonly canEditPermissions = computed(() => {
    return this.acl() && !isRootDataset(this.dataset()) && !this.dataset().locked && !this.dataset().readonly.parsed;
  });

  readonly isLocked = computed(() => {
    return this.dataset().locked;
  });

  readonly reasonEditIsDisabled = computed(() => {
    if (this.canEditPermissions()) {
      return null;
    }

    if (isRootDataset(this.dataset())) {
      return this.translate.instant(helptextPermissions.editDisabled.root);
    }

    if (this.isLocked()) {
      return this.translate.instant(helptextPermissions.editDisabled.locked);
    }

    if (this.dataset().readonly.parsed) {
      return this.translate.instant(helptextPermissions.editDisabled.readonly);
    }

    return null;
  });

  ngOnChanges(): void {
    this.loadPermissions();
  }

  ngOnInit(): void {
    this.store.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (state) => {
          this.isLoading.set(state.isLoading);
          this.acl.set(state.acl);
          this.stat.set(state.stat);

          // TODO: Move elsewhere
          const acl = this.acl();
          if (acl?.acl && acl.acltype === AclType.Nfs4) {
            for (const entry of acl.acl) {
              if (entry.tag === NfsAclTag.Owner && entry.who === null) {
                entry.who = acl.uid.toString();
              }
              if ((entry.tag === NfsAclTag.Group || entry.tag === NfsAclTag.UserGroup) && entry.who === null) {
                entry.who = acl.gid.toString();
              }
            }
          }
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  private loadPermissions(): void {
    this.acl.set(null);
    this.stat.set(null);

    if (this.isLocked()) {
      return;
    }

    this.isMissingMountpoint.set(!this.dataset().mountpoint);
    if (this.isMissingMountpoint()) {
      return;
    }

    this.isNotMounted.set(!this.dataset().mounted?.parsed);
    if (this.isNotMounted()) {
      return;
    }

    this.store.loadPermissions(this.dataset().mountpoint);
  }
}
