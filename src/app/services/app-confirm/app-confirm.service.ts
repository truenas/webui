import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { AppConfirmComponent } from './app-confirm.component';

@Injectable()
export class AppConfirmService {
  constructor(private dialog: MatDialog) { }

  confirm(title: string, message: string, customButton: string): Observable<boolean> {
    const dialogRef = this.dialog.open(AppConfirmComponent, { disableClose: true });
    dialogRef.updateSize('380px');
    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;
    dialogRef.componentInstance.customButton = customButton;
    return dialogRef.afterClosed();
  }
}
