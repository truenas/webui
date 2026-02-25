import { HttpEventType } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
  ElementRef,
  ViewChild,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { firstValueFrom, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { UsbDrive } from 'app/interfaces/usb-drive.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UploadService } from 'app/services/upload.service';
import { FolderPickerDialogComponent, FolderPickerDialogData, FolderPickerDialogResult } from './folder-picker-dialog/folder-picker-dialog.component';
import { InputDialogComponent, InputDialogConfig } from './input-dialog/input-dialog.component';
import { QuickLookDialogComponent, QuickLookDialogData } from './quick-look-dialog/quick-look-dialog.component';

@Component({
  selector: 'ix-file-manager',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatToolbarModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    TnIconComponent,
    PageHeaderComponent,
  ],
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileManagerComponent implements OnInit, OnDestroy {
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  @ViewChild('folderInput') folderInput: ElementRef<HTMLInputElement>;
  @ViewChild('contextMenuTrigger') contextMenuTrigger: MatMenuTrigger;

  private api = inject(ApiService);
  private matDialog = inject(MatDialog);
  private uploadService = inject(UploadService);
  private downloadService = inject(DownloadService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private destroy$ = new Subject<void>();

  // Current path
  currentPath = signal<string>('/mnt');

  // Navigation history
  pathHistory = signal<string[]>(['/mnt']);
  historyIndex = signal<number>(0);

  // View mode: 'grid' or 'list'
  viewMode = signal<'grid' | 'list'>('grid');

  // Loading state
  isLoading = signal<boolean>(false);

  // Selected items
  selectedItems = signal<Set<string>>(new Set());

  // File items in current directory
  items = signal<FileRecord[]>([]);

  // Breadcrumb segments
  breadcrumbs = computed(() => {
    const path = this.currentPath();
    const segments = path.split('/').filter(Boolean);
    const result: { name: string; path: string }[] = [];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += '/' + segment;
      result.push({ name: segment, path: currentPath });
    }

    return result;
  });

  // Can go back in history
  canGoBack = computed(() => this.historyIndex() > 0);

  // Can go forward in history
  canGoForward = computed(() => this.historyIndex() < this.pathHistory().length - 1);

  // Has parent directory
  hasParent = computed(() => this.currentPath() !== '/');

  // Upload state
  isUploading = signal<boolean>(false);
  uploadProgress = signal<number>(0);
  uploadFileName = signal<string>('');
  uploadTotalFiles = signal<number>(0);
  uploadCurrentIndex = signal<number>(0);

  // Download state
  isDownloading = signal<boolean>(false);

  // Context menu item
  contextMenuItem = signal<FileRecord | null>(null);

  // Context menu position
  contextMenuPosition = { x: 0, y: 0 };

  // Quick Look dialog reference for toggle behavior
  private quickLookDialogRef: import('@angular/material/dialog').MatDialogRef<QuickLookDialogComponent> | null = null;

  // Check if any item is selected (file or directory)
  hasItemSelected = computed(() => {
    return this.selectedItems().size > 0;
  });

  // Check if /mnt directory is empty (no pools created)
  isMntEmpty = computed(() => {
    return this.currentPath() === '/mnt' && this.items().length === 0 && !this.isLoading();
  });

  // Check if inside a pool directory with no datasets
  isPoolEmpty = computed(() => {
    const path = this.currentPath();
    // Check if path is /mnt/<poolname> (exactly 2 segments after /mnt/)
    const pathParts = path.split('/').filter(Boolean);
    return pathParts.length === 2 && pathParts[0] === 'mnt' && this.items().length === 0 && !this.isLoading();
  });

  // Get the current pool name from path
  currentPoolName = computed(() => {
    const path = this.currentPath();
    const pathParts = path.split('/').filter(Boolean);
    if (pathParts.length >= 2 && pathParts[0] === 'mnt') {
      return pathParts[1];
    }
    return null;
  });

  // Check if uploading is permitted in the current directory
  // Uploading is NOT permitted in /mnt or pool root directories (e.g., /mnt/poolname)
  isUploadPermitted = computed(() => {
    const path = this.currentPath();
    const pathParts = path.split('/').filter(Boolean);
    // Not permitted at /mnt (1 segment) or /mnt/<pool> (2 segments)
    if (pathParts.length <= 2 && pathParts[0] === 'mnt') {
      return false;
    }
    return true;
  });

  // USB drives
  usbDrives = signal<UsbDrive[]>([]);
  isLoadingUsbDrives = signal<boolean>(false);

  // Mounted USB drives (partitions with mountpoints)
  mountedUsbDrives = computed(() => {
    const drives = this.usbDrives();
    const mounted: { drive: UsbDrive; partition?: { name: string; mountpoint: string; label: string | null } }[] = [];

    for (const drive of drives) {
      if (drive.partitions && drive.partitions.length > 0) {
        // Drive has partitions, check each for mountpoint
        for (const partition of drive.partitions) {
          if (partition.mountpoint) {
            mounted.push({
              drive,
              partition: {
                name: partition.name,
                mountpoint: partition.mountpoint,
                label: partition.label,
              },
            });
          }
        }
      } else if (drive.mountpoint) {
        // Drive itself is mounted (no partitions)
        mounted.push({ drive });
      }
    }

    return mounted;
  });

  ngOnInit(): void {
    this.loadDirectory(this.currentPath());
    this.loadUsbDrives();
    this.subscribeToUsbDriveEvents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:keydown.meta.backspace', ['$event'])
  onCommandDelete(event: Event): void {
    // Don't trigger if user is typing in an input field
    const target = document.activeElement as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
      return;
    }

    // Check if any items are selected
    if (this.selectedItems().size === 0) {
      return;
    }

    // Prevent default browser behavior
    event.preventDefault();

    // Trigger delete for selected items
    this.deleteSelected();
  }

  @HostListener('document:keydown.space')
  onSpacebarPress(): void {
    // Don't trigger if user is typing in an input field
    const target = document.activeElement as HTMLElement;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
      return;
    }

    // Check if exactly one item is selected
    const selected = this.selectedItems();
    if (selected.size !== 1) {
      return;
    }

    const selectedPath = Array.from(selected)[0];
    const item = this.items().find((i) => i.path === selectedPath);

    if (!item || !this.isQuickLookSupported(item)) {
      return;
    }

    this.toggleQuickLook(item);
  }

  toggleQuickLook(item: FileRecord): void {
    // If dialog is already open, close it
    if (this.quickLookDialogRef) {
      this.quickLookDialogRef.close();
      return;
    }

    // Open the dialog
    this.openQuickLook(item);
  }

  isQuickLookSupported(item: FileRecord): boolean {
    if (item.type === FileType.Directory) {
      return false;
    }

    const ext = item.name.split('.').pop()?.toLowerCase() || '';
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'];
    const videoExtensions = ['mp4'];
    return imageExtensions.includes(ext) || videoExtensions.includes(ext);
  }

  openQuickLook(item: FileRecord): void {
    this.quickLookDialogRef = this.matDialog.open(QuickLookDialogComponent, {
      data: { fileItem: item } as QuickLookDialogData,
      panelClass: 'quick-look-dialog-panel',
      maxWidth: '100vw',
      maxHeight: '100vh',
      width: '100vw',
      height: '100vh',
    });

    // Clear the reference when dialog closes
    this.quickLookDialogRef.afterClosed().subscribe(() => {
      this.quickLookDialogRef = null;
    });
  }

  loadDirectory(path: string): void {
    this.isLoading.set(true);
    this.selectedItems.set(new Set());

    this.api.call('filesystem.listdir', [path, [], { order_by: ['name'], limit: 1000 }])
      .subscribe({
        next: (files) => {
          this.items.set(files);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          console.error('Failed to load directory:', error);
          this.items.set([]);
          this.isLoading.set(false);
        },
      });
  }

  navigateTo(path: string): void {
    if (path === this.currentPath()) return;

    // Update history
    const newHistory = [...this.pathHistory().slice(0, this.historyIndex() + 1), path];
    this.pathHistory.set(newHistory);
    this.historyIndex.set(newHistory.length - 1);

    this.currentPath.set(path);
    this.loadDirectory(path);
  }

  goBack(): void {
    if (!this.canGoBack()) return;

    const newIndex = this.historyIndex() - 1;
    this.historyIndex.set(newIndex);
    const path = this.pathHistory()[newIndex];
    this.currentPath.set(path);
    this.loadDirectory(path);
  }

  goForward(): void {
    if (!this.canGoForward()) return;

    const newIndex = this.historyIndex() + 1;
    this.historyIndex.set(newIndex);
    const path = this.pathHistory()[newIndex];
    this.currentPath.set(path);
    this.loadDirectory(path);
  }

  goUp(): void {
    if (!this.hasParent()) return;

    const parentPath = this.currentPath().split('/').slice(0, -1).join('/') || '/';
    this.navigateTo(parentPath);
  }

  onItemClick(item: FileRecord, event: MouseEvent): void {
    event.stopPropagation(); // Prevent container click from clearing selection
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      const selected = new Set(this.selectedItems());
      if (selected.has(item.path)) {
        selected.delete(item.path);
      } else {
        selected.add(item.path);
      }
      this.selectedItems.set(selected);
    } else {
      // Single selection
      this.selectedItems.set(new Set([item.path]));
    }
  }

  onContainerClick(): void {
    // Clear selection when clicking on empty space
    this.selectedItems.set(new Set());
  }

  onItemDoubleClick(item: FileRecord): void {
    if (item.type === FileType.Directory) {
      this.navigateTo(item.path);
    } else {
      this.downloadFile(item);
    }
  }

  toggleViewMode(): void {
    this.viewMode.update((mode) => (mode === 'grid' ? 'list' : 'grid'));
  }

  isSelected(item: FileRecord): boolean {
    return this.selectedItems().has(item.path);
  }

  formatSize(bytes?: number): string {
    if (bytes === undefined) return '-';
    if (bytes === 0) return '0 Bytes';

    const base = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(base));

    return `${parseFloat((bytes / (base ** i)).toFixed(2))} ${sizes[i]}`;
  }

  formatDate(timestamp?: number): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getFileIcon(item: FileRecord): string {
    if (item.type === FileType.Directory) {
      return 'mdi-folder';
    }

    if (item.type === FileType.Symlink) {
      return 'mdi-arrow-right-thin';
    }

    const ext = item.name.split('.').pop()?.toLowerCase() || '';

    // Video files
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
      return 'mdi-play-circle';
    }

    // For all other file types, use the generic file icon
    // We use CSS classes to colorize them differently
    return 'insert_drive_file';
  }

  getFileIconClass(item: FileRecord): string {
    if (item.type === FileType.Directory) {
      return 'icon-folder';
    }

    const ext = item.name.split('.').pop()?.toLowerCase() || '';

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
      return 'icon-image';
    }

    // Video files
    if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
      return 'icon-video';
    }

    // Audio files
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a'].includes(ext)) {
      return 'icon-audio';
    }

    // Archive files
    if (['zip', 'tar', 'gz', 'rar', '7z', 'bz2', 'xz'].includes(ext)) {
      return 'icon-archive';
    }

    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) {
      return 'icon-document';
    }

    // Spreadsheet files
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) {
      return 'icon-spreadsheet';
    }

    // Code files
    if (['js', 'ts', 'py', 'java', 'c', 'cpp', 'h', 'html', 'css', 'json', 'xml', 'yaml', 'yml', 'sh', 'go', 'rs', 'rb', 'php'].includes(ext)) {
      return 'icon-code';
    }

    return 'icon-file';
  }

  isDirectory(item: FileRecord): boolean {
    return item.type === FileType.Directory;
  }

  triggerUpload(): void {
    this.fileInput.nativeElement.click();
  }

  triggerFolderUpload(): void {
    this.folderInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    this.uploadFiles(files, input);
  }

  onFolderSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    this.uploadFiles(files, input, true);
  }

  private uploadFiles(files: File[], input: HTMLInputElement, preserveFolderStructure = false): void {
    if (files.length === 0) return;

    this.isUploading.set(true);
    this.uploadTotalFiles.set(files.length);
    this.uploadCurrentIndex.set(0);

    this.uploadFilesSequentially(files, input, preserveFolderStructure, 0);
  }

  private uploadFilesSequentially(
    files: File[],
    input: HTMLInputElement,
    preserveFolderStructure: boolean,
    index: number,
  ): void {
    if (index >= files.length) {
      this.completeUpload(input, files.length);
      return;
    }

    const file = files[index];
    this.uploadCurrentIndex.set(index + 1);
    this.uploadProgress.set(0);

    // Determine destination path
    let destinationPath: string;
    if (preserveFolderStructure && (file as File & { webkitRelativePath?: string }).webkitRelativePath) {
      // Use relative path from folder selection
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      destinationPath = `${this.currentPath()}/${relativePath}`;
    } else {
      destinationPath = `${this.currentPath()}/${file.name}`;
    }

    this.uploadFileName.set(file.name);

    const { observable: upload$ } = this.uploadService.upload({
      file,
      method: 'filesystem.put',
      params: [destinationPath],
    });

    upload$.subscribe({
      next: (httpEvent) => {
        if (httpEvent.type === HttpEventType.UploadProgress && httpEvent.total) {
          const progress = Math.round((httpEvent.loaded / httpEvent.total) * 100);
          this.uploadProgress.set(progress);
        }
      },
      error: (error: unknown) => {
        console.error('Upload failed:', error);
        this.snackbar.error(this.translate.instant('Upload failed: {name}', { name: file.name }));
        // Continue with remaining files
        this.uploadFilesSequentially(files, input, preserveFolderStructure, index + 1);
      },
      complete: () => {
        // Upload next file
        this.uploadFilesSequentially(files, input, preserveFolderStructure, index + 1);
      },
    });
  }

  private completeUpload(input: HTMLInputElement, totalFiles: number): void {
    this.isUploading.set(false);
    this.uploadProgress.set(0);
    this.uploadFileName.set('');
    this.uploadTotalFiles.set(0);
    this.uploadCurrentIndex.set(0);

    if (totalFiles === 1) {
      this.snackbar.success(this.translate.instant('File uploaded successfully'));
    } else {
      this.snackbar.success(this.translate.instant('{count} files uploaded successfully', { count: totalFiles }));
    }

    this.loadDirectory(this.currentPath());
    input.value = '';
  }

  downloadFile(item: FileRecord): void {
    if (item.type === FileType.Directory) return;

    this.isDownloading.set(true);

    const mimeType = this.getMimeType(item.name);

    this.downloadService.coreDownload({
      method: 'filesystem.get',
      arguments: [item.path],
      fileName: item.name,
      mimeType,
    }).subscribe({
      next: () => {
        this.isDownloading.set(false);
      },
      error: (error: unknown) => {
        console.error('Download failed:', error);
        this.isDownloading.set(false);
        this.snackbar.error(this.translate.instant('Download failed'));
      },
    });
  }

  downloadSelectedFiles(): void {
    const selected = this.selectedItems();
    const items = this.items();

    // Get all selected items (including directories)
    const selectedItems = Array.from(selected)
      .map((path) => items.find((i) => i.path === path))
      .filter((item): item is FileRecord => item !== undefined);

    if (selectedItems.length === 0) {
      return;
    }

    // Check if only a single file (not directory) is selected
    if (selectedItems.length === 1 && selectedItems[0].type !== FileType.Directory) {
      // Single file: download directly
      this.downloadFile(selectedItems[0]);
    } else {
      // Multiple items or single directory: download as ZIP archive
      this.downloadBatchFiles(selectedItems);
    }
  }

  downloadBatchFiles(items: FileRecord[]): void {
    this.isDownloading.set(true);

    // Create archive name based on current directory or timestamp
    const dirName = this.currentPath().split('/').pop() || 'files';
    const archiveName = `${dirName}_${Date.now()}.zip`;

    // Extract paths from selected items
    const paths = items.map((item) => item.path);

    this.downloadService.coreDownload({
      method: 'filesystem.get_archive',
      arguments: [{ paths }],
      fileName: archiveName,
      mimeType: 'application/zip',
    }).subscribe({
      next: () => {
        this.isDownloading.set(false);
      },
      error: (error: unknown) => {
        console.error('Batch download failed:', error);
        this.isDownloading.set(false);
        this.snackbar.error(this.translate.instant('Download failed'));
      },
    });
  }

  onContextMenu(event: MouseEvent, item: FileRecord): void {
    event.preventDefault();
    this.contextMenuItem.set(item);
    if (!this.isSelected(item)) {
      this.selectedItems.set(new Set([item.path]));
    }
    this.contextMenuPosition.x = event.clientX;
    this.contextMenuPosition.y = event.clientY;
    this.contextMenuTrigger.openMenu();
  }

  renameSelected(): void {
    if (this.selectedItems().size !== 1) return;

    const selectedPath = Array.from(this.selectedItems())[0];
    const item = this.items().find((i) => i.path === selectedPath);
    if (item) {
      this.renameItem(item);
    }
  }

  renameItem(item: FileRecord): void {
    const currentName = item.name;

    this.matDialog.open(InputDialogComponent, {
      data: {
        title: 'Rename',
        message: 'Enter new name:',
        inputLabel: 'Name',
        value: currentName,
        confirmText: 'Rename',
      } as InputDialogConfig,
      width: '400px',
    })
      .afterClosed()
      .pipe(
        filter((newName: string | null) => !!newName && newName !== currentName),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((newName: string) => {
        const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
        const newPath = `${parentPath}/${newName}`;

        this.api.call('filesystem.rename', [{ src: item.path, dst: newPath }])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.success(this.translate.instant('Renamed successfully'));
              this.loadDirectory(this.currentPath());
            },
            error: (error: unknown) => {
              this.errorHandler.showErrorModal(error);
            },
          });
      });
  }

  copySelected(): void {
    if (this.selectedItems().size === 0) return;

    const selectedPath = Array.from(this.selectedItems())[0];
    const item = this.items().find((i) => i.path === selectedPath);
    if (item) {
      this.copyItem(item);
    }
  }

  copyItem(item: FileRecord): void {
    const defaultName = `${item.name}_copy`;

    this.matDialog.open(InputDialogComponent, {
      data: {
        title: 'Copy',
        message: 'Enter name for the copy:',
        inputLabel: 'Name',
        value: defaultName,
        confirmText: 'Copy',
      } as InputDialogConfig,
      width: '400px',
    })
      .afterClosed()
      .pipe(
        filter((newName: string | null) => !!newName),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((newName: string) => {
        const parentPath = item.path.substring(0, item.path.lastIndexOf('/'));
        const newPath = `${parentPath}/${newName}`;

        this.dialogService.jobDialog(
          this.api.job('filesystem.copy', [{ src: item.path, dst: newPath }]),
          { title: this.translate.instant('Copying...') },
        )
          .afterClosed()
          .pipe(
            this.errorHandler.withErrorHandler(),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe(() => {
            this.snackbar.success(this.translate.instant('Copied successfully'));
            this.loadDirectory(this.currentPath());
          });
      });
  }

  deleteSelected(): void {
    if (this.selectedItems().size === 0) return;

    const selectedPaths = Array.from(this.selectedItems());
    const itemsToDelete = this.items().filter((i) => selectedPaths.includes(i.path));

    if (itemsToDelete.length === 0) return;

    const hasDirectories = itemsToDelete.some((i) => i.type === FileType.Directory);
    const message = itemsToDelete.length === 1
      ? this.translate.instant('Are you sure you want to delete "{name}"?', { name: itemsToDelete[0].name })
      : this.translate.instant('Are you sure you want to delete {count} items?', { count: itemsToDelete.length });

    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message,
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.performDelete(itemsToDelete, hasDirectories);
      });
  }

  deleteItem(item: FileRecord): void {
    const isDirectory = item.type === FileType.Directory;
    const message = this.translate.instant('Are you sure you want to delete "{name}"?', { name: item.name });

    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message,
      buttonColor: 'warn',
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.performDelete([item], isDirectory);
      });
  }

  private performDelete(items: FileRecord[], recursive: boolean): void {
    const deletePromises = items.map((item) => {
      return firstValueFrom(this.api.call('filesystem.delete', [{
        path: item.path,
        options: { recursive },
      }]));
    });

    Promise.all(deletePromises)
      .then(() => {
        this.snackbar.success(this.translate.instant('Deleted successfully'));
        this.selectedItems.set(new Set());
        this.loadDirectory(this.currentPath());
      })
      .catch((error: unknown) => {
        this.errorHandler.showErrorModal(error);
      });
  }

  loadUsbDrives(): void {
    this.isLoadingUsbDrives.set(true);

    this.api.call('usb.drive.query')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (drives) => {
          this.usbDrives.set(drives);
          this.isLoadingUsbDrives.set(false);
        },
        error: (error: unknown) => {
          console.error('Failed to load USB drives:', error);
          this.usbDrives.set([]);
          this.isLoadingUsbDrives.set(false);
        },
      });
  }

  subscribeToUsbDriveEvents(): void {
    this.api.subscribe('usb.drive.query')
      .pipe(takeUntil(this.destroy$))
      .subscribe((event) => {
        if (event.msg === CollectionChangeType.Added) {
          const newDrive = event.fields;
          this.usbDrives.update((drives) => [...drives, newDrive]);
        } else if (event.msg === CollectionChangeType.Changed) {
          const updatedDrive = event.fields;
          this.usbDrives.update((drives) => {
            return drives.map((drive) => (drive.id === updatedDrive.id ? updatedDrive : drive));
          });
        } else if (event.msg === CollectionChangeType.Removed) {
          const removedId = event.id;
          this.usbDrives.update((drives) => drives.filter((drive) => drive.id !== removedId));
          // If we're currently viewing the removed drive's path, navigate away
          const currentPath = this.currentPath();
          if (currentPath.startsWith('/mnt/.usb')) {
            this.navigateTo('/mnt');
          }
        }
      });
  }

  navigateToUsbDrive(mountpoint: string): void {
    this.navigateTo(mountpoint);
  }

  ejectUsbDrive(drive: UsbDrive, event: MouseEvent): void {
    event.stopPropagation();

    const driveName = this.getUsbDriveDisplayName(drive);

    this.dialogService.confirm({
      title: this.translate.instant('Eject USB Drive'),
      message: this.translate.instant('Are you sure you want to safely eject "{name}"?', { name: driveName }),
      buttonText: this.translate.instant('Eject'),
    })
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.api.call('usb.drive.eject', [{ id: drive.id }])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.success(this.translate.instant('USB drive ejected safely'));
              // If we're currently viewing this drive, navigate away
              const currentPath = this.currentPath();
              const driveMountpoint = drive.mountpoint;
              if (driveMountpoint && currentPath.startsWith(driveMountpoint)) {
                this.navigateTo('/mnt');
              }
            },
            error: (error: unknown) => {
              this.errorHandler.showErrorModal(error);
            },
          });
      });
  }

  getUsbDriveDisplayName(
    drive: UsbDrive,
    partition?: { name: string; mountpoint: string; label: string | null },
  ): string {
    if (partition?.label) {
      return partition.label;
    }
    if (drive.label) {
      return drive.label;
    }
    if (drive.model) {
      return drive.model;
    }
    if (partition?.name) {
      return partition.name;
    }
    return drive.name;
  }

  goToStoragePage(): void {
    this.router.navigate(['/storage']);
  }

  goToDatasetsPage(): void {
    const poolName = this.currentPoolName();
    if (poolName) {
      this.router.navigate(['/datasets', poolName]);
    } else {
      this.router.navigate(['/datasets']);
    }
  }

  createFolder(): void {
    this.matDialog.open(InputDialogComponent, {
      data: {
        title: 'New Folder',
        message: 'Enter folder name:',
        inputLabel: 'Folder Name',
        value: 'untitled folder',
        confirmText: 'Create',
      } as InputDialogConfig,
      width: '400px',
    })
      .afterClosed()
      .pipe(
        filter((folderName: string | null) => !!folderName),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((folderName: string) => {
        const newPath = `${this.currentPath()}/${folderName}`;

        this.api.call('filesystem.mkdir', [{ path: newPath }])
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackbar.success(this.translate.instant('Folder created successfully'));
              this.loadDirectory(this.currentPath());
            },
            error: (error: unknown) => {
              this.errorHandler.showErrorModal(error);
            },
          });
      });
  }

  moveSelected(): void {
    const selected = this.selectedItems();
    if (selected.size === 0) return;

    const selectedPaths = Array.from(selected);
    const selectedItems = this.items().filter((i) => selectedPaths.includes(i.path));

    if (selectedItems.length === 0) return;

    const dialogRef = this.matDialog.open(FolderPickerDialogComponent, {
      data: {
        title: this.translate.instant('Move To'),
        currentPath: this.currentPath(),
        excludePaths: selectedPaths,
      } as FolderPickerDialogData,
      width: '700px',
      maxHeight: '80vh',
    });

    dialogRef.afterClosed()
      .pipe(
        filter((result: FolderPickerDialogResult | undefined): result is FolderPickerDialogResult => !!result),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.performMove(selectedPaths, result.path);
      });
  }

  private performMove(sourcePaths: string[], destinationPath: string): void {
    this.dialogService.jobDialog(
      this.api.job('filesystem.move', [{
        src: sourcePaths,
        dst: destinationPath,
      }]),
      { title: this.translate.instant('Moving...') },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const count = sourcePaths.length;
        if (count === 1) {
          this.snackbar.success(this.translate.instant('Item moved successfully'));
        } else {
          this.snackbar.success(this.translate.instant('{count} items moved successfully', { count }));
        }
        this.selectedItems.set(new Set());
        this.loadDirectory(this.currentPath());
      });
  }

  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';

    const mimeTypes: Record<string, string> = {
      txt: 'text/plain',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      xml: 'application/xml',
      pdf: 'application/pdf',
      zip: 'application/zip',
      gz: 'application/gzip',
      tar: 'application/x-tar',
      rar: 'application/vnd.rar',
      '7z': 'application/x-7z-compressed',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      ico: 'image/x-icon',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
