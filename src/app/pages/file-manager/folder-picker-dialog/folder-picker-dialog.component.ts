import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export interface FolderPickerDialogData {
  title: string;
  currentPath?: string;
  excludePaths?: string[];
  confirmLabel?: string;
  currentSelectionLabel?: string;
  disabledSelectionTooltip?: string;
  allowDatasetRootSelection?: boolean;
  itemSelectLabel?: string;
}

export interface FolderPickerDialogResult {
  path: string;
}

interface LocationEntry {
  name: string;
  path: string;
  icon: string;
  type: 'pool' | 'usb';
}

@Component({
  selector: 'ix-folder-picker-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    TnIconComponent,
  ],
  templateUrl: './folder-picker-dialog.component.html',
  styleUrls: ['./folder-picker-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FolderPickerDialogComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  currentPath = signal<string>('/mnt');
  items = signal<FileRecord[]>([]);
  isLoading = signal<boolean>(false);
  locations = signal<LocationEntry[]>([]);

  // Track navigation history for breadcrumbs
  breadcrumbs = signal<{ name: string; path: string }[]>([]);
  readonly dialogRef = inject(MatDialogRef<FolderPickerDialogComponent, FolderPickerDialogResult>);
  readonly data = inject<FolderPickerDialogData>(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.loadLocations();
    const startPath = this.data.currentPath || '/mnt';
    this.navigateTo(startPath);
  }

  private loadLocations(): void {
    // Load pools from /mnt
    this.api.call('filesystem.listdir', ['/mnt', [], { order_by: ['name'] }])
      .subscribe({
        next: (files) => {
          const pools = files
            .filter((f) => f.type === FileType.Directory && !f.name.startsWith('.'))
            .map((f) => ({
              name: f.name,
              path: f.path,
              icon: 'mdi-database',
              type: 'pool' as const,
            }));
          this.locations.update((locs) => [...pools, ...locs.filter((l) => l.type !== 'pool')]);
        },
      });

    // Load USB drives
    this.api.call('usb.drive.query')
      .subscribe({
        next: (drives) => {
          const usbLocations: LocationEntry[] = [];
          for (const drive of drives) {
            if (drive.partitions && drive.partitions.length > 0) {
              for (const partition of drive.partitions) {
                if (partition.mountpoint) {
                  usbLocations.push({
                    name: partition.label || drive.model || partition.name,
                    path: partition.mountpoint,
                    icon: 'mdi-usb-flash-drive',
                    type: 'usb',
                  });
                }
              }
            } else if (drive.mountpoint) {
              usbLocations.push({
                name: drive.label || drive.model || drive.name,
                path: drive.mountpoint,
                icon: 'mdi-usb-flash-drive',
                type: 'usb',
              });
            }
          }
          this.locations.update((locs) => [...locs.filter((l) => l.type !== 'usb'), ...usbLocations]);
        },
      });
  }

  navigateTo(path: string): void {
    this.currentPath.set(path);
    this.updateBreadcrumbs(path);
    this.loadDirectory(path);
  }

  private updateBreadcrumbs(path: string): void {
    const segments = path.split('/').filter(Boolean);
    const crumbs: { name: string; path: string }[] = [];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += '/' + segment;
      crumbs.push({ name: segment, path: currentPath });
    }

    this.breadcrumbs.set(crumbs);
  }

  private loadDirectory(path: string): void {
    this.isLoading.set(true);

    this.api.call('filesystem.listdir', [path, [], { order_by: ['name'] }])
      .subscribe({
        next: (files) => {
          // Only show directories, exclude hidden and excluded paths
          const dirs = files.filter((f) => {
            if (f.type !== FileType.Directory) return false;
            if (f.name.startsWith('.')) return false;
            if (this.data.excludePaths?.includes(f.path)) return false;
            return true;
          });
          this.items.set(dirs);
          this.isLoading.set(false);
        },
        error: () => {
          this.items.set([]);
          this.isLoading.set(false);
        },
      });
  }

  onItemDoubleClick(item: FileRecord): void {
    if (item.type === FileType.Directory) {
      this.navigateTo(item.path);
    }
  }

  selectFolder(path: string): void {
    if (this.canSelectPath(path)) {
      this.dialogRef.close({ path });
    }
  }

  goUp(): void {
    const path = this.currentPath();
    if (path === '/mnt') return;

    const parentPath = path.split('/').slice(0, -1).join('/') || '/mnt';
    this.navigateTo(parentPath);
  }

  onLocationClick(location: LocationEntry): void {
    this.navigateTo(location.path);
  }

  canGoUp(): boolean {
    return this.currentPath() !== '/mnt';
  }

  selectCurrentFolder(): void {
    this.dialogRef.close({ path: this.currentPath() });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  isCurrentLocationPool(): boolean {
    const path = this.currentPath();
    return this.locations().some((l) => l.path === path);
  }

  /**
     * Check if the current folder can be selected as a move destination.
     * Must be inside a dataset or USB drive (at least 3 levels deep: /mnt/pool/something).
     * Cannot be /mnt or the pool root itself.
     */
  canSelectCurrentFolder(): boolean {
    return this.canSelectPath(this.currentPath());
  }

  canSelectPath(path: string): boolean {
    if (path === '/mnt') {
      return false;
    }

    if (path === '/mnt/.usb') {
      return false;
    }

    const segments = path.split('/').filter(Boolean);

    if (segments.length < 2) {
      return false;
    }

    if (
      segments.length === 2
      && segments[0] === 'mnt'
      && !segments[1].startsWith('.')
      && !this.data.allowDatasetRootSelection
    ) {
      return false;
    }

    return true;
  }
}
