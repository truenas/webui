import 'style-loader!./baPageTop.scss';

import {Component} from '@angular/core';

import {GlobalState} from '../../../global.state';
import {WebSocketService} from '../../../services/index';

@Component({
  selector : 'ba-page-top',
  templateUrl : './baPageTop.html',
})
export class BaPageTop {

  public isScrolled: boolean = false;
  public isMenuCollapsed: boolean = false;

  constructor(private _state: GlobalState, public _ws: WebSocketService) {
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

  public logOut() { this._ws.logout(); }

  public onShutdown(): void {
    if (confirm("Are you sure to shutdown?")) {
      this._ws.call('system.shutdown', {}).subscribe((res) => {
        alert('system is shutting down...');
      });
    }
  }

  public onReboot(): void {
    if (confirm("Are you sure to reboot?")) {
      this._ws.call('system.reboot', {}).subscribe((res) => {
        alert('system is rebooting...');
      });
    }
  }
}
