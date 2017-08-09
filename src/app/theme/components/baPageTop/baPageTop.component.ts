import 'style-loader!./baPageTop.scss';

import { Component } from '@angular/core';

import { GlobalState } from '../../../global.state';
import { WebSocketService, DialogService, RestService } from '../../../services/index';
import { Router } from '@angular/router';

@Component({
  selector: 'ba-page-top',
  templateUrl: './baPageTop.html',
  providers: [DialogService]
})
export class BaPageTop {

  public isScrolled: boolean = false;
  public isMenuCollapsed: boolean = false;

  constructor(protected router: Router, private _state: GlobalState, public _ws: WebSocketService, private dialogService: DialogService, public rest: RestService) {
    this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
      this.isMenuCollapsed = isCollapsed;
    });
  }

  public toggleMenu() {
    this.isMenuCollapsed = !this.isMenuCollapsed;
    this._state.notifyDataChanged('menu.isCollapsed', this.isMenuCollapsed);
    return false;
  }

  public scrolledChanged(isScrolled) { this.isScrolled = isScrolled; }

  public logOut() {
    this.dialogService.confirm("Logout", "You are about to LOGOUT the system, are you sure?").subscribe((res) => {
      if (res) {
        this._ws.logout();
      }
    });
  }

  public onShutdown(): void {
    this.dialogService.confirm("Reboot", "You are about to SHUTDOWN the system, are you sure?").subscribe((res) => {
      if (res) {
        // this.rest.post('system/shutdown/', {});
        this._ws.call('system.shutdown', {}).subscribe( (res) => {
        });
      }
    })
  }

  public onReboot(): void {
    this.dialogService.confirm("Reboot", "You are about to REBOOT the system, are you sure?").subscribe((res) => {
      if (res) {
        this.rest.post('system/reboot/', {}).subscribe( (res) => {
        });
      }
    })
  }
}
