import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, lastValueFrom, of } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminStatus {
  token: string | null;
  eligible_count: number;
  last_scan_error: string | null;
  library_path: string;
  library_path_locked: boolean;
}

interface AdminTokenResponse {
  token: string;
}

interface LibraryPathResponse {
  library_path: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const adminApiBase = '/featured-photos-api/admin';

@Component({
  selector: 'ix-featured-photos-admin',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './featured-photos-admin.component.html',
  styleUrls: ['./featured-photos-admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturedPhotosAdminComponent implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private window = inject<Window>(WINDOW);

  // --- state ---
  token = signal<string | null>(null);
  eligibleCount = signal<number>(0);
  libraryPath = signal<string>('');
  libraryPathLocked = signal(false);
  libraryPathDraft = signal<string>('');
  libraryPathSaveError = signal<string | null>(null);
  lastScanError = signal<string | null>(null);

  revealed = signal(false);
  isLoading = signal(false);
  isResetting = signal(false);
  isSavingPath = signal(false);
  copyFeedback = signal<string | null>(null);
  loadError = signal(false);

  // --- computed ---
  tokenDisplayed = computed(() => {
    const current = this.token();
    if (!current) return '';
    return this.revealed() ? current : '•'.repeat(current.length);
  });

  galleryUrl = computed(() => {
    const current = this.token();
    if (!current || !isPlatformBrowser(this.platformId)) return '';
    return `${this.window.location.origin}/featured-photos/gallery?token=${current}`;
  });

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  ngOnInit(): void {
    this.loadStatus();
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async loadStatus(): Promise<void> {
    this.isLoading.set(true);
    this.loadError.set(false);
    try {
      const status = await lastValueFrom(
        this.http.get<AdminStatus>(`${adminApiBase}/status`)
          .pipe(catchError(() => of(null))),
      );
      if (status) {
        this.token.set(status.token);
        this.eligibleCount.set(status.eligible_count);
        this.libraryPath.set(status.library_path);
        this.libraryPathLocked.set(status.library_path_locked);
        this.libraryPathDraft.set(status.library_path);
        this.libraryPathSaveError.set(null);
        this.lastScanError.set(status.last_scan_error);
      } else {
        this.loadError.set(true);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  toggleReveal(): void {
    this.revealed.update((value) => !value);
  }

  async copyToken(): Promise<void> {
    const current = this.token();
    if (!current) return;
    await this.window.navigator.clipboard.writeText(current);
    this.showCopyFeedback('Token copied');
  }

  async copyGalleryUrl(): Promise<void> {
    const url = this.galleryUrl();
    if (!url) return;
    await this.window.navigator.clipboard.writeText(url);
    this.showCopyFeedback('Gallery link copied');
  }

  openGallery(): void {
    const url = this.galleryUrl();
    if (url) this.window.open(url, '_blank');
  }

  async saveLibraryPath(): Promise<void> {
    if (this.libraryPathLocked()) return;
    const next = this.libraryPathDraft().trim();
    if (!next || next === this.libraryPath()) return;

    this.isSavingPath.set(true);
    this.libraryPathSaveError.set(null);
    try {
      const response = await lastValueFrom(
        this.http.put<LibraryPathResponse>(`${adminApiBase}/library-path`, {
          library_path: next,
        }).pipe(catchError((error: unknown) => of(error))),
      );
      if (response instanceof HttpErrorResponse) {
        this.libraryPathSaveError.set(this.libraryPathErrorMessage(response.status));
      } else if (response && !(response instanceof Error)) {
        const updated = (response as LibraryPathResponse).library_path;
        this.libraryPath.set(updated);
        this.libraryPathDraft.set(updated);
        this.showCopyFeedback('Library path saved');
      } else {
        this.libraryPathSaveError.set('Failed to update library path.');
      }
    } finally {
      this.isSavingPath.set(false);
    }
  }

  resetLibraryPathDraft(): void {
    this.libraryPathDraft.set(this.libraryPath());
    this.libraryPathSaveError.set(null);
  }

  async resetToken(): Promise<void> {
    const confirmed = this.window.confirm(
      this.token()
        ? 'Reset the gallery token? The current gallery link will stop working.'
        : 'Generate a new gallery token?',
    );
    if (!confirmed) return;

    this.isResetting.set(true);
    try {
      const response = await lastValueFrom(
        this.http.post<AdminTokenResponse>(`${adminApiBase}/token/reset`, null)
          .pipe(catchError(() => of(null))),
      );
      if (response) {
        this.token.set(response.token);
        this.revealed.set(true);
      }
    } finally {
      this.isResetting.set(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

  private showCopyFeedback(msg: string): void {
    if (this.copyFeedbackTimer) clearTimeout(this.copyFeedbackTimer);
    this.copyFeedback.set(msg);
    this.copyFeedbackTimer = setTimeout(() => this.copyFeedback.set(null), 2000);
  }

  private libraryPathErrorMessage(status: number): string {
    if (status === 409) {
      return 'Path is controlled by FEATURED_PHOTOS_LIBRARY and cannot be changed here.';
    }
    if (status === 400) {
      return 'Path cannot be empty.';
    }
    return 'Failed to update library path.';
  }
}
