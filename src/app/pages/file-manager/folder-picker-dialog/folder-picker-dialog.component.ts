import {
    ChangeDetectionStrategy,
    Component,
    Inject,
    OnInit,
    signal,
    inject,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { UsbDrive } from 'app/interfaces/usb-drive.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ApiService } from 'app/modules/websocket/api.service';

export interface FolderPickerDialogData {
    title: string;
    currentPath?: string;
    excludePaths?: string[];
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
        IxIconComponent,
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

    constructor(
        public dialogRef: MatDialogRef<FolderPickerDialogComponent, FolderPickerDialogResult>,
        @Inject(MAT_DIALOG_DATA) public data: FolderPickerDialogData,
    ) { }

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
        const path = this.currentPath();

        // Don't allow /mnt itself
        if (path === '/mnt') {
            return false;
        }

        // Don't allow /mnt/.usb (USB container directory)
        if (path === '/mnt/.usb') {
            return false;
        }

        // Check path depth - need at least /mnt/pool/folder (3 segments)
        const segments = path.split('/').filter(Boolean);

        // For USB drives at /mnt/.usb/drivename, we need 3 segments minimum
        // For datasets at /mnt/poolname/datasetname, we also need 3 segments minimum
        // But USB mount roots should be allowed (e.g. /mnt/.usb/usbname)
        if (segments.length < 2) {
            return false;
        }

        // If it's exactly /mnt/poolname (a pool root), don't allow
        if (segments.length === 2 && segments[0] === 'mnt' && !segments[1].startsWith('.')) {
            return false;
        }

        return true;
    }
}
