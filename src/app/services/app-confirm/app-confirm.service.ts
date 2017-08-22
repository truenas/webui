import { Observable } from 'rxjs/Rx';
import { MdDialogRef, MdDialog, MdDialogConfig } from '@angular/material';
import { Injectable } from '@angular/core';

import { AppComfirmComponent } from './app-confirm.component';

@Injectable()
export class AppConfirmService {

  constructor(private dialog: MdDialog) { }

  public confirm(title: string, message: string): Observable<boolean> {
    let dialogRef: MdDialogRef<AppComfirmComponent>;
    dialogRef = this.dialog.open(AppComfirmComponent, {disableClose: true});
    dialogRef.updateSize('380px');
    dialogRef.componentInstance.title = title;
    dialogRef.componentInstance.message = message;
    return dialogRef.afterClosed();
  }
}