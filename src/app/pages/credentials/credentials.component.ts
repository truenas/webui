import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'app-credentials',
  templateUrl: './credentials.component.html',
  styleUrls: ['./credentials.component.css']
})
export class CredentialsComponent implements OnInit {
  product_type = window.localStorage.getItem('product_type');
  isScale: boolean = this.product_type.includes('SCALE');
  isCore: boolean = this.product_type.includes('CORE');
  isEnterprise: boolean = this.product_type.includes('ENTERPRISE');
  is_ha = false;

  constructor(private router: Router, private ws: WebSocketService) { }

  ngOnInit(): void {
    if (this.isEnterprise) {
      this.ws.call('failover.licensed').subscribe((is_ha) => {
        this.is_ha = is_ha;
      })
    }
  }

  systemNav(link) {
    this.router.navigate(['system', link])
  }

  nav(link) {
    this.router.navigate([link]);
  }

  navExternal(link) {
    return window.open(link);
  }
 
}
