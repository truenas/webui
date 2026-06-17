import { ChangeDetectionStrategy, Component, computed, DestroyRef, input, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnCardComponent, TnDialog, type TnCardAction } from '@truenas/ui-components';
import { filter } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { Role } from 'app/enums/role.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import {
  ReplaceDiskDialog,
  ReplaceDiskDialogData,
} from 'app/pages/storage/modules/vdevs/components/disk-info-card/replace-disk-dialog/replace-disk-dialog.component';
import { VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';

@Component({
  selector: 'ix-disk-info-card',
  templateUrl: './disk-info-card.component.html',
  styleUrls: ['./disk-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    CopyButtonComponent,
    TranslateModule,
    FileSizePipe,
    OrNotAvailablePipe,
  ],
})
export class DiskInfoCardComponent {
  private tnDialog = inject(TnDialog);
  private slideIn = inject(SlideIn);
  private route = inject(ActivatedRoute);
  private vDevsStore = inject(VDevsStore);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly topologyDisk = input.required<TopologyDisk>();
  readonly disk = input<Disk>();

  protected readonly requiredRoles = [Role.PoolWrite];

  private readonly hasPoolWriteRole = toSignal(
    this.authService.hasRole(this.requiredRoles),
    { initialValue: false },
  );

  protected isHdd = computed(() => {
    return this.disk()?.type === DiskType.Hdd;
  });

  protected isAvailable = computed(() => {
    return !!this.disk();
  });

  // Replace stays available whether or not the disk is online, but is gated on PoolWrite
  // (previously *ixRequiresRoles on the footer button).
  protected readonly replaceAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasPoolWriteRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Replace'),
      testId: 'replace',
      handler: () => this.onReplace(),
    };
  });

  // Edit is only meaningful for an available disk (previously gated by @if (isAvailable())).
  protected readonly editAction = computed<TnCardAction | undefined>(() => {
    if (!this.isAvailable()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Edit'),
      testId: 'edit-disk',
      handler: () => this.onEdit(),
    };
  });

  onEdit(): void {
    this.slideIn.open(DiskFormComponent, { data: this.disk() })
      .onSuccess(() => this.vDevsStore.reloadList(), this.destroyRef);
  }

  onReplace(): void {
    const poolId = this.route.snapshot.params.poolId as string;
    this.tnDialog
      .open(ReplaceDiskDialog, {
        data: {
          poolId: Number(poolId),
          guid: this.topologyDisk().guid,
          diskName: this.disk()?.name || this.topologyDisk().guid,
        } as ReplaceDiskDialogData,
      })
      .closed
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.vDevsStore.reloadList();
      });
  }
}
