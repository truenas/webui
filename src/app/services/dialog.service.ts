import { Observable } from 'rxjs/Rx';
import { ConfirmDialog } from '../pages/common/confirm-dialog/confirm-dialog.component';
import { ErrorDialog } from '../pages/common/error-dialog/error-dialog.component';
import { InfoDialog } from '../pages/common/info-dialog/info-dialog.component';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material';
import { Injectable } from '@angular/core';

@Injectable()
export class DialogService {

    constructor(private dialog: MatDialog) { }

    public confirm(title: string, message: string, hideCheckBox?: boolean): Observable<boolean> {

        let dialogRef: MatDialogRef<ConfirmDialog>;

        dialogRef = this.dialog.open(ConfirmDialog);

        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.message = message;

        if(hideCheckBox) {
            dialogRef.componentInstance.hideCheckBox = hideCheckBox;
        }        

        return dialogRef.afterClosed();
    }

    public errorReport(title: string, message: string, backtrace: string): Observable<boolean> {

        let dialogRef: MatDialogRef<ErrorDialog>;

        dialogRef = this.dialog.open(ErrorDialog);

        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.message = message;
        dialogRef.componentInstance.backtrace = backtrace;

        return dialogRef.afterClosed();
    }

    public Info(title: string, info: string ): Observable<boolean> {
        
        let dialogRef: MatDialogRef<InfoDialog>;

        dialogRef = this.dialog.open(InfoDialog);

        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.info = info;

        return dialogRef.afterClosed();
    }

}
