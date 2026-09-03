import { ChangeDetectionStrategy, Component, computed, DestroyRef, input, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnDialog, TnTestIdDirective } from '@truenas/ui-components';
import { filter, map, switchMap } from 'rxjs/operators';
import { HasRoleDirective } from 'app/directives/has-role/has-role.directive';
import { NavigateAndHighlightDirective } from 'app/directives/navigate-and-interact/navigate-and-highlight.directive';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { ApiService } from 'app/modules/websocket/api.service';
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

  protected readonly hasSedSupport = computed(() => {
    return Boolean(this.hasSedEntitlement());
  });

  protected readonly hasDiskEncryption = toSignal(
    toObservable(this.topologyDisk).pipe(
      filter(Boolean),
      switchMap((topologyItem) => {
        return this.api.call('disk.query', [[['devname', '=', topologyItem.disk]],
          { extra: { passwords: true } }]).pipe(
          map(([disk]) => disk.passwd !== ''),
        );
      }),
    ),
  );

  protected onManageSedPassword(): void {
    this.tnDialog.open(ManageDiskSedDialog, {
      data: this.topologyDisk().disk,
    }).closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
}
