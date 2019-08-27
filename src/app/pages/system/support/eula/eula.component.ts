import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'app-eula',
  templateUrl: './eula.component.html',
  styleUrls: ['./eula.component.css']
})
export class EulaComponent implements OnInit {
  eula: any;

  constructor(private ws: WebSocketService, private router: Router) { }

  ngOnInit() {
    const isFreenas = window.localStorage.getItem('is_freenas');
    if (isFreenas === 'true') {
      this.router.navigate(['/']);
    } else {
      this.ws.call('truenas.get_eula').subscribe((res) => {
        this.eula = res;
      })
    }
  }

  goToSupport() {
    this.router.navigate(['/system/support'])
  }
}
