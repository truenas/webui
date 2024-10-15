import { ComponentType } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { MatBottomSheet, MatBottomSheetConfig, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { AuthService } from 'app/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class BottomSheetService {
  private bottomSheetRef: MatBottomSheetRef;

  constructor(
    private bottomSheet: MatBottomSheet,
    private authService: AuthService,
  ) {
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (!isAuthenticated && this.bottomSheetRef) {
        this.bottomSheetRef.dismiss();
      }
    });
  }

  open<T, D, R>(
    component: ComponentType<T>,
    config?: MatBottomSheetConfig<D>,
  ): MatBottomSheetRef<T, R> {
    this.bottomSheetRef = this.bottomSheet.open<T, D, R>(component, config);
    return this.bottomSheetRef;
  }

  close(): void {
    if (this.bottomSheetRef && !this.bottomSheetRef.disableClose) {
      this.bottomSheetRef.dismiss();
    }
  }
}
