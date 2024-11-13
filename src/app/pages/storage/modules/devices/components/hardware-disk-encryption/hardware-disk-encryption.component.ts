import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HasRoleDirective } from 'app/directives/has-role/has-role.directive';
import { Role } from 'app/enums/role.enum';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  ManageDiskSedDialogComponent,
} from 'app/pages/storage/modules/devices/components/hardware-disk-encryption/manage-disk-sed-dialog/manage-disk-sed-dialog.component';
import { ApiService } from 'app/services/websocket/api.service';

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
    WithLoadingStateDirective,
    HasRoleDirective,
    TestDirective,
    RouterLink,
    TranslateModule,
  ],
})
export class HardwareDiskEncryptionComponent implements OnChanges {
  @Input() topologyDisk: TopologyDisk;

  hasGlobalEncryption$ = this.ws.call('system.advanced.sed_global_password_is_set').pipe(toLoadingState());
  hasDiskEncryption$: Observable<LoadingState<boolean>>;

  protected readonly Role = Role;

  constructor(
    private matDialog: MatDialog,
    private ws: ApiService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    this.loadDiskEncryption();
  }

  onManageSedPassword(): void {
    const dialog = this.matDialog.open(ManageDiskSedDialogComponent, {
      data: this.topologyDisk.disk,
    });
    dialog
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((wasChanged) => {
        if (!wasChanged) {
          return;
        }

        this.loadDiskEncryption();
        this.cdr.markForCheck();
      });
  }

  private loadDiskEncryption(): void {
    this.hasDiskEncryption$ = this.ws.call('disk.query', [[['devname', '=', this.topologyDisk.disk]], { extra: { passwords: true } }])
      .pipe(
        map((disks) => disks[0].passwd !== ''),
        toLoadingState(),
      );
  }
}
