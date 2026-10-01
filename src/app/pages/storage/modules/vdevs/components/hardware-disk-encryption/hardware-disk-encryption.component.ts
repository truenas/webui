import { ChangeDetectionStrategy, Component, computed, DestroyRef, input, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnDialog, TnTestIdDirective } from '@truenas/ui-components';
import { combineLatest, Subject } from 'rxjs';
import {
  filter, map, startWith, switchMap,
} from 'rxjs/operators';
import { HasRoleDirective } from 'app/directives/has-role/has-role.directive';
import { NavigateAndHighlightDirective } from 'app/directives/navigate-and-interact/navigate-and-highlight.directive';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { sedStatusLabel } from 'app/pages/storage/modules/disks/utils/sed-status-label.utils';
import {
  ManageDiskSedDialog,
} from 'app/pages/storage/modules/vdevs/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { EntitlementsService } from 'app/services/entitlements.service';

@Component({
  selector: 'ix-hardware-disk-encryption',
  templateUrl: './hardware-disk-encryption.component.html',
  styleUrls: ['./hardware-disk-encryption.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    HasRoleDirective,
    TnTestIdDirective,
    NavigateAndHighlightDirective,
    TranslateModule,
  ],
})
export class HardwareDiskEncryptionComponent {
  private tnDialog = inject(TnDialog);
  private api = inject(ApiService);
  private entitlements = inject(EntitlementsService);
  private destroyRef = inject(DestroyRef);

  readonly topologyDisk = input.required<TopologyDisk>();

  protected readonly hasGlobalEncryption = toSignal(this.api.call('system.advanced.sed_global_password_is_set'));
  private readonly hasSedEntitlement = this.entitlements.entitled(EntitlementFeature.Sed);
  protected readonly requiredRoles = [Role.DiskWrite];

  // Entitlement alone by design (NAS-143012): existing per-disk or global SED passwords are not a bypass.
  protected readonly hasSedSupport = computed(() => {
    return Boolean(this.hasSedEntitlement());
  });

  private readonly refreshDisk$ = new Subject<void>();

  // Refetched after the per-disk password dialog saves, so "Password is set" follows the change.
  // Skipped without the SED entitlement, as the card is hidden then (same gate as the Disks list).
  // `undefined` while loading, `null` when no disk matches the devname.
  private readonly disk = toSignal(
    combineLatest([
      toObservable(this.topologyDisk).pipe(filter(Boolean)),
      toObservable(this.hasSedEntitlement).pipe(filter(Boolean)),
      this.refreshDisk$.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([topologyItem]) => {
        return this.api.call('disk.query', [[['devname', '=', topologyItem.disk]],
          { extra: { passwords: true, sed_status: true } }]).pipe(
          map(([disk]) => (disk as Disk | undefined) ?? null),
        );
      }),
    ),
  );

  protected readonly supportsSed = computed(() => Boolean(this.disk()?.sed));
  protected readonly hasDiskEncryption = computed(() => Boolean(this.disk()?.passwd));
  protected readonly sedStatusLabel = computed(() => {
    const disk = this.disk();
    if (disk === undefined) {
      return T('Loading...');
    }
    return disk ? sedStatusLabel(disk) : T('Unknown');
  });

  protected onManageSedPassword(): void {
    this.tnDialog.open(ManageDiskSedDialog, {
      data: this.topologyDisk().disk,
    }).closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshDisk$.next());
  }
}
