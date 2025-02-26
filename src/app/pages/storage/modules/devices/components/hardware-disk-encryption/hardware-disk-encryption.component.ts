import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, switchMap } from 'rxjs/operators';
import { HasRoleDirective } from 'app/directives/has-role/has-role.directive';
import { Role } from 'app/enums/role.enum';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ManageDiskSedDialogComponent,
} from 'app/pages/storage/modules/devices/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-hardware-disk-encryption',
  templateUrl: './hardware-disk-encryption.component.html',
  styleUrls: ['./hardware-disk-encryption.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    HasRoleDirective,
    TestDirective,
    RouterLink,
    TranslateModule,
  ],
})
export class HardwareDiskEncryptionComponent {
  readonly topologyDisk = input.required<TopologyDisk>();

  protected readonly hasGlobalEncryption = toSignal(this.api.call('system.advanced.sed_global_password_is_set'));
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly requiredRoles = [Role.DiskWrite];

  hasSedSupport = computed(() => {
    return this.isEnterprise() || (this.hasDiskEncryption() || this.hasGlobalEncryption());
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

  constructor(
    private store$: Store<AppState>,
    private matDialog: MatDialog,
    private api: ApiService,
  ) {}

  onManageSedPassword(): void {
    this.matDialog.open(ManageDiskSedDialogComponent, {
      data: this.topologyDisk().disk,
    }).afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe();
  }
}
