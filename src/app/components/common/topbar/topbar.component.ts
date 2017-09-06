import { Component, OnInit, EventEmitter, Input, Output } from '@angular/core';
import * as domHelper from '../../../helpers/dom.helper';
import { RestService } from '../../../services';
import { ThemeService } from '../../../services/theme/theme.service';
import { WebSocketService } from '../../../services/ws.service';
import { DialogService } from '../../../services/dialog.service';

@Component({
  selector: 'topbar',
  templateUrl: './topbar.template.html'
})
export class TopbarComponent implements OnInit {
  @Input() sidenav;
  @Input() notificPanel;
  @Output() onLangChange = new EventEmitter<any>();
  
  notificationCount = 0;
  
  currentLang = 'en';
  availableLangs = [{
    name: 'English',
    code: 'en',
  }, {
    name: 'Spanish',
    code: 'es',
  }]
  freenasThemes;
  
  constructor(private themeService: ThemeService, private rs: RestService, private ws: WebSocketService, private dialogService: DialogService) {}
  ngOnInit() {
    this.freenasThemes = this.themeService.freenasThemes;
    
     this.rs.get("system/alert", {}).subscribe((res) => {
       this.notificationCount = res.data.length;
     });
  }
  setLang() {
    this.onLangChange.emit(this.currentLang);
  }
  changeTheme(theme) {
    this.themeService.changeTheme(theme);
  }
  toggleNotific() {
    this.notificPanel.toggle();
  }
  toggleSidenav() {
    this.sidenav.toggle();
  }
  toggleCollapse() {
        let appBody = document.body;
        domHelper.toggleClass(appBody, 'collapsed-menu');
        domHelper.removeClass(document.getElementsByClassName('has-submenu'), 'open');
  }

  signOut() {
    this.dialogService.confirm("Logout", "You are about to LOGOUT the system, are you sure?").subscribe((res) => {
      if (res) {
        this.ws.logout();
      }
    });
  }
}