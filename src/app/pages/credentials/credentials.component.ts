import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-credentials',
  templateUrl: './credentials.component.html',
  styleUrls: ['./credentials.component.css']
})
export class CredentialsComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit(): void {
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
