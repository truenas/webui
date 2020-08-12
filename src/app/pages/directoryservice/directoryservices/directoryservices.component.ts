import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
 
@Component({
  selector: 'app-directoryservices',
  template: '<p>Placeholder for Dir Services Dashboard</p>'
})
export class DirectoryservicesComponent implements OnInit {

  constructor(private router: Router ) { }

  ngOnInit(): void {
    this.router.navigate(['directoryservice']);
  }
}
