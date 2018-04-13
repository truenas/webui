import { Observable } from 'rxjs/Rx';
import { ConfirmDialog } from '../pages/common/confirm-dialog/confirm-dialog.component';
import { ErrorDialog } from '../pages/common/error-dialog/error-dialog.component';
import { InfoDialog } from '../pages/common/info-dialog/info-dialog.component';
import { SelectDialogComponent } from '../pages/common/select-dialog/select-dialog.component';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material';
import { Injectable } from '@angular/core';
import {WebSocketService} from '../services/ws.service';
import { MatSnackBar } from '@angular/material';

@Injectable()
export class DialogService {

    constructor(private dialog: MatDialog, private ws: WebSocketService, public snackBar: MatSnackBar,) { }

    public confirm(title: string, message: string, hideCheckBox?: boolean, buttonMsg?: string): Observable<boolean> {

        let dialogRef: MatDialogRef<ConfirmDialog>;

        dialogRef = this.dialog.open(ConfirmDialog);

        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.message = message;

        if(buttonMsg) {
            dialogRef.componentInstance.buttonMsg = buttonMsg;
        }

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

    public select(title: string, options:  Array<any>, optionPlaceHolder: string, method: string, params?: any, message?: string){
        let data: any;     
        let dialogRef: MatDialogRef<SelectDialogComponent>;

        dialogRef = this.dialog.open(SelectDialogComponent, {width: '300px'});

        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.options = options;
        dialogRef.componentInstance.optionPlaceHolder = optionPlaceHolder;
        dialogRef.componentInstance.method = method;

        dialogRef.componentInstance.switchSelectionEmitter.subscribe((selection)=>{
            if (selection === 'force'){
                 data = {[selection]: true}
            }
            else {
                data = {[params]: selection}
            }
            dialogRef.afterClosed().subscribe((res)=>{
                if(res){
                    this.ws.call(method, [data]).subscribe((out)=>{
                        this.snackBar.open(message, 'close', { duration: 5000 });
                    });
                };
            });
        });


    }

}
