import { Observable } from 'rxjs/Rx';
import { ConfirmDialog } from '../pages/common/confirm-dialog/confirm-dialog.component';
import { ErrorDialog } from '../pages/common/error-dialog/error-dialog.component';
import { MdDialogRef, MdDialog, MdDialogConfig } from '@angular/material';
import { Injectable } from '@angular/core';

@Injectable()
export class DialogService {

    constructor(private dialog: MdDialog) { }

    public confirm(title: string, message: string): Observable<boolean> {

        let dialogRef: MdDialogRef<ConfirmDialog>;

        dialogRef = this.dialog.open(ConfirmDialog);

        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.message = message;

        return dialogRef.afterClosed();
    }

    public errorReport(title: string, message: string, backtrace: string): Observable<boolean> {

        let dialogRef: MdDialogRef<ErrorDialog>;

        dialogRef = this.dialog.open(ErrorDialog);

        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.message = message;
        dialogRef.componentInstance.backtrace = backtrace;

        return dialogRef.afterClosed();
    }

}
