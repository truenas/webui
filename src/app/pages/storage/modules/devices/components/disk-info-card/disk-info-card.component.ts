import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DiskType } from 'app/enums/disk-type.enum';
import { Role } from 'app/enums/role.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  ReplaceDiskDialogComponent,
  ReplaceDiskDialogData,
} from 'app/pages/storage/modules/devices/components/disk-info-card/replace-disk-dialog/replace-disk-dialog.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { SlideInService } from 'app/services/slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-disk-info-card',
  templateUrl: './disk-info-card.component.html',
  styleUrls: ['./disk-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatButton,
    TestDirective,
    MatCardContent,
    CopyButtonComponent,
    MatCardActions,
    RequiresRolesDirective,
    TranslateModule,
    FileSizePipe,
    OrNotAvailablePipe,
  ],
})
export class DiskInfoCardComponent {
  @Input() topologyDisk: TopologyDisk;
  @Input() disk: Disk;

  readonly requiredRoles = [Role.FullAdmin];

  constructor(
    private matDialog: MatDialog,
    private slideInService: SlideInService,
    private route: ActivatedRoute,
    private devicesStore: DevicesStore,
  ) {}

  get isHdd(): boolean {
    return this.disk?.type === DiskType.Hdd;
  }

  get isAvailable(): boolean {
    return !!this.disk;
  }

  onEdit(): void {
    const slideInRef = this.slideInService.open(DiskFormComponent, { wide: true });
    slideInRef.componentInstance.setFormDisk(this.disk);
    slideInRef.slideInClosed$.pipe(
      filter((response) => Boolean(response)),
      untilDestroyed(this),
    ).subscribe(() => this.devicesStore.reloadList());
  }

  onReplace(): void {
    const poolId = this.route.snapshot.params.poolId as string;
    this.matDialog
      .open(ReplaceDiskDialogComponent, {
        data: {
          poolId: Number(poolId),
          guid: this.topologyDisk.guid,
          diskName: this.disk?.name || this.topologyDisk.guid,
        } as ReplaceDiskDialogData,
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.devicesStore.reloadList();
      });
  }
}
