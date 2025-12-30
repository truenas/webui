import { HttpEventType } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  computed,
  inject,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FileType } from 'app/enums/file-type.enum';
import { FileRecord } from 'app/interfaces/file-record.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DownloadService } from 'app/services/download.service';
import { UploadService } from 'app/services/upload.service';

@Component({
  selector: 'ix-file-manager',
  standalone: true,
  imports: [
    MatButtonModule,
    MatToolbarModule,
    MatListModule,
    MatMenuModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslateModule,
    IxIconComponent,
    PageHeaderComponent,
  ],
  templateUrl: './file-manager.component.html',
  styleUrls: ['./file-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileManagerComponent implements OnInit {
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;

  private api = inject(ApiService);
  private uploadService = inject(UploadService);
  private downloadService = inject(DownloadService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

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
    const result: { name: string; path: string }[] = [{ name: 'Root', path: '/' }];

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

  // Download state
  isDownloading = signal<boolean>(false);

  // Check if any file (non-directory) is selected
  hasFileSelected = computed(() => {
    const selected = this.selectedItems();
    const items = this.items();
    return Array.from(selected).some((path) => {
      const item = items.find((i) => i.path === path);
      return item && item.type !== FileType.Directory;
    });
  });

  ngOnInit(): void {
    this.loadDirectory(this.currentPath());
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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const destinationPath = `${this.currentPath()}/${file.name}`;

    this.isUploading.set(true);
    this.uploadProgress.set(0);
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
        this.isUploading.set(false);
        this.uploadProgress.set(0);
        this.uploadFileName.set('');
        this.snackbar.error(this.translate.instant('Upload failed'));
      },
      complete: () => {
        this.isUploading.set(false);
        this.uploadProgress.set(0);
        this.uploadFileName.set('');
        this.snackbar.success(this.translate.instant('File uploaded successfully'));
        this.loadDirectory(this.currentPath());
        input.value = '';
      },
    });
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

    for (const path of selected) {
      const item = items.find((i) => i.path === path);
      if (item && item.type !== FileType.Directory) {
        this.downloadFile(item);
      }
    }
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
