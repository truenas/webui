import { Component } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material";
import { ConsolePanelModalDialog } from "app/components/common/dialog/consolepanel/consolepanel-dialog.component";
import { Observable, Subscription } from "rxjs";
import { filter, map, switchMap, take } from "rxjs/operators";
import { RestService } from "../rest.service";
import { WebSocketService } from "../ws.service";

@Component({
  selector: "app-app-loader",
  templateUrl: "./app-loader.component.html",
  styleUrls: ["./app-loader.component.css"]
})
export class AppLoaderComponent {
  title: string;
  message: string;

  consoleMsg: string;
  consoleMSgList: string[] = [];

  isShowConsole$: Observable<boolean> = this._rest
    .get("system/advanced", { limit: 0 })
    .pipe(map(res => res.data["adv_consolemsg"]));

  consoleDialog: MatDialogRef<ConsolePanelModalDialog>;
  private _consoleSubscription: Subscription;

  constructor(
    public dialogRef: MatDialogRef<AppLoaderComponent>,
    private _rest: RestService,
    private _dialog: MatDialog,
    private _ws: WebSocketService
  ) {
    this.isShowConsole$
      .pipe(
        take(1),
        filter(isShowConsole => !!isShowConsole)
      )
      .subscribe(() => {
        this.dialogRef.updateSize("200px", "248px");
      });
  }

  onOpenConsole(): void {
    this.consoleDialog = this._dialog.open(ConsolePanelModalDialog, {});

    this._consoleSubscription = this.consoleDialog.componentInstance.onEventEmitter
      .pipe(switchMap(() => this._ws.consoleMessages))
      .subscribe(consoleMsg => {
        this.consoleDialog.componentInstance.consoleMsg = consoleMsg;
      });

    this.consoleDialog.afterClosed().subscribe(() => {
      clearInterval(this.consoleDialog.componentInstance.intervalPing);
      this._consoleSubscription.unsubscribe();
    });
  }
}
