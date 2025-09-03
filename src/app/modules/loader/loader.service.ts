import { Injectable, inject } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  defer, EMPTY, finalize, MonoTypeOperatorFunction, Observable, Subscription,
} from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppLoaderComponent } from 'app/modules/loader/components/app-loader/app-loader.component';
import { FocusService } from 'app/services/focus.service';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  private matDialog = inject(MatDialog);
  private focusService = inject(FocusService);

  dialogRef: MatDialogRef<AppLoaderComponent> | null = null;
  private onBeforeClose: (() => Observable<boolean>) | null = null;
  private handlersSetup = false;
  private keydownSubscription: Subscription | null = null;
  private backdropSubscription: Subscription | null = null;

  /**
   * Opens loader when observable (request) starts and closes when it ends.
   */
  withLoader<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => defer(() => {
      this.open();
      return source$.pipe(
        finalize(() => this.close()),
      );
    });
  }

  open(title: string = T('Please wait')): Observable<boolean> {
    if (this.dialogRef !== null) {
      return EMPTY;
    }

    this.dialogRef = this.matDialog.open(AppLoaderComponent, {
      disableClose: this.onBeforeClose !== null,
      width: '200px',
      height: '200px',
    });

    if (this.dialogRef.componentInstance) {
      this.dialogRef.componentInstance.setTitle(title);
    }

    // If there's a confirmation handler, intercept close attempts
    if (this.onBeforeClose) {
      this.setupConfirmationHandlers();
    }

    return this.dialogRef.afterClosed();
  }

  close(): void {
    if (this.dialogRef) {
      this.tryToRestoreFocusToThePreviousDialog();
      this.dialogRef.close();
      this.dialogRef = null;
      this.onBeforeClose = null;
      this.handlersSetup = false;

      // Clean up subscriptions
      if (this.keydownSubscription) {
        this.keydownSubscription.unsubscribe();
        this.keydownSubscription = null;
      }
      if (this.backdropSubscription) {
        this.backdropSubscription.unsubscribe();
        this.backdropSubscription = null;
      }
    }
  }

  /**
   * Sets a confirmation handler that will be called when the user tries to close the loader
   * (by clicking outside or pressing ESC). If the handler returns true, the loader will close.
   * If false, it stays open.
   */
  setConfirmationBeforeClose(handler: () => Observable<boolean>): void {
    this.onBeforeClose = handler;
    // If dialog is already open, update its disableClose property and setup handlers
    if (this.dialogRef) {
      this.dialogRef.disableClose = true;
      this.setupConfirmationHandlers();
    }
  }

  /**
   * Removes the confirmation handler
   */
  removeConfirmationBeforeClose(): void {
    this.onBeforeClose = null;
    this.handlersSetup = false;

    // Unsubscribe from event handlers
    if (this.keydownSubscription) {
      this.keydownSubscription.unsubscribe();
      this.keydownSubscription = null;
    }
    if (this.backdropSubscription) {
      this.backdropSubscription.unsubscribe();
      this.backdropSubscription = null;
    }

    // If dialog is open, restore normal close behavior
    if (this.dialogRef) {
      this.dialogRef.disableClose = false;
    }
  }

  private setupConfirmationHandlers(): void {
    if (!this.dialogRef || !this.onBeforeClose || this.handlersSetup) {
      return;
    }

    this.handlersSetup = true;

    // Since disableClose is true, we need to manually listen for ESC and backdrop clicks
    this.keydownSubscription = this.dialogRef.keydownEvents().pipe(
      filter((event) => event.key === 'Escape'),
    ).subscribe(() => {
      this.handleConfirmationClose();
    });

    this.backdropSubscription = this.dialogRef.backdropClick().subscribe(() => {
      this.handleConfirmationClose();
    });
  }

  private handleConfirmationClose(): void {
    // Check if handler is still active (not removed)
    if (this.onBeforeClose && this.handlersSetup) {
      console.info('DEBUG: Showing confirmation dialog');
      this.onBeforeClose().subscribe((shouldClose) => {
        console.info('DEBUG: Confirmation result:', shouldClose);
        if (shouldClose) {
          this.close();
        }
        // If shouldClose is false, do nothing (dialog stays open)
      });
    } else {
      console.info('DEBUG: Confirmation handler was removed, not showing dialog');
    }
  }

  setTitle(title: string): void {
    if (!this.dialogRef?.componentInstance) {
      return;
    }

    this.dialogRef.componentInstance.setTitle(title);
  }

  private tryToRestoreFocusToThePreviousDialog(): void {
    const previousDialogs = this.matDialog.openDialogs.filter((dialog) => dialog.id !== this.dialogRef?.id);
    const previousDialogId = previousDialogs[previousDialogs.length - 1]?.id;

    if (previousDialogId) {
      this.focusService.focusElementById(previousDialogId);
    }
  }
}
