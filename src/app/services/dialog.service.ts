import { Injectable } from '@angular/core';
import { MatDialog, MatDialogRef, MatSnackBar } from '@angular/material';
import { T } from 'app/translate-marker';
import { filter } from 'rxjs/operators';
import { Observable } from 'rxjs/Rx';
import { ConfirmDialog } from '../pages/common/confirm-dialog/confirm-dialog.component';
import { EntityDialogComponent } from '../pages/common/entity/entity-dialog/entity-dialog.component';
import { ErrorDialog } from '../pages/common/error-dialog/error-dialog.component';
import { InfoDialog } from '../pages/common/info-dialog/info-dialog.component';
import { SelectDialogComponent } from '../pages/common/select-dialog/select-dialog.component';
import { AppLoaderService } from '../services/app-loader/app-loader.service';
import { WebSocketService } from '../services/ws.service';

@Injectable()
export class DialogService {
    protected loaderOpen = false;


    constructor(private dialog: MatDialog, private ws: WebSocketService, public snackBar: MatSnackBar,protected loader: AppLoaderService) {
        /* Close all open dialogs when websocket connection is dropped */
        this.ws.onCloseSubject.pipe(filter(didClose => !!didClose)).subscribe(() => this.closeAllDialogs());
    }

    public confirm(title: string, message: string, hideCheckBox?: boolean, buttonMsg?: string, secondaryCheckBox?: boolean, 
        secondaryCheckBoxMsg?: string, method?:string, data?:any, tooltip?:any, hideCancel?:boolean, cancelMsg?: string): any {

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

        if(tooltip) {
            dialogRef.componentInstance.tooltip = tooltip;
        }

        if (hideCancel) {
            dialogRef.componentInstance.hideCancel = hideCancel;
            dialogRef.disableClose = hideCancel;
        }
        if(cancelMsg) {
            dialogRef.componentInstance.cancelMsg = cancelMsg;
        }

        if(secondaryCheckBox) {
            dialogRef.componentInstance.secondaryCheckBox = secondaryCheckBox;
            dialogRef.componentInstance.secondaryCheckBoxMsg = secondaryCheckBoxMsg;
            dialogRef.componentInstance.data = data;
            dialogRef.componentInstance.method = method;
            dialogRef.componentInstance.switchSelectionEmitter.subscribe((selection)=>{
            if(selection){
                if(data[1] && data[1].hasOwnProperty('delete_users')){
                    data[1].delete_users = !data[1].delete_users;
                }
                if(data[1] && data[1].hasOwnProperty('delete_groups')){
                    data[1].delete_groups = !data[1].delete_groups;
                }
                if(data[0] && data[0].hasOwnProperty('reboot')){
                    data[0].reboot = !data[0].reboot;
                }
                if(data[0] && data[0].hasOwnProperty('overcommit')){
                    data[0].overcommit = !data[0].overcommit;
                }
                return dialogRef;
            }
        });
            return dialogRef;
        }
        return dialogRef.afterClosed();
    }

    public errorReport(title: string, message: string, backtrace: string = '', logs?: any): Observable<boolean> {

        let dialogRef: MatDialogRef<ErrorDialog>;

        dialogRef = this.dialog.open(ErrorDialog);

        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.message = message;
        dialogRef.componentInstance.backtrace = backtrace;
        if (logs) {
            dialogRef.componentInstance.logs = logs;
        }

        return dialogRef.afterClosed();
    }

    public Info(title: string, info: string, width='500px', icon="report_problem", is_html=false ): Observable<boolean> {
        
        let dialogRef: MatDialogRef<InfoDialog>;

        dialogRef = this.dialog.open(InfoDialog, {width: width});

        dialogRef.componentInstance.title = title;
        dialogRef.componentInstance.info = info;
        dialogRef.componentInstance.icon = icon;
        dialogRef.componentInstance.is_html = is_html;

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

    public dialogForm(conf: any): Observable<boolean> {
        let dialogRef: MatDialogRef<EntityDialogComponent>;

        dialogRef = this.dialog.open(EntityDialogComponent, {maxWidth: '420px'});
        dialogRef.componentInstance.conf = conf;

        return dialogRef.afterClosed();
    }

    public dialogFormWide(conf: any): Observable<boolean> {
        let dialogRef: MatDialogRef<EntityDialogComponent>;

        dialogRef = this.dialog.open(EntityDialogComponent, {maxWidth: '490px', minWidth: '490px'});
        dialogRef.componentInstance.conf = conf;

        return dialogRef.afterClosed();
    }

    public doubleConfirm(title: string, message: string, name: string, confirmBox?: boolean, buttonMsg?: string): any {
        const conf = {
            title: title,
            message: message,
            fieldConfig: [
              {
                type: 'input',
                name: 'name',
                required: true,
              },
              {
                  type: 'checkbox',
                  name: 'confirm',
                  placeholder: 'Confirm',
                  isHidden: !confirmBox,
              }
            ],
            saveButtonText: buttonMsg ? buttonMsg : T("DELETE"),
            afterInit: function(entityDialog) {
                entityDialog.formGroup.controls['name'].valueChanges.subscribe((res) => {
                    entityDialog.submitEnabled = res === name && (confirmBox ? entityDialog.formGroup.controls['confirm'].value : true);
                })
                entityDialog.formGroup.controls['confirm'].valueChanges.subscribe((res) => {
                    entityDialog.submitEnabled = res && (entityDialog.formGroup.controls['name'].value === name);
                })
            },
            customSubmit: function (entityDialog) {
                return entityDialog.dialogRef.close(true);
            }
          }
        return this.dialogForm(conf);
    }

    public closeAllDialogs(): void {
        for (const openDialog of this.dialog.openDialogs) {
            openDialog.close();
        }
    }
}
