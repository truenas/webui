import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {
  selectedIndex = 0;

  constructor() { }

  ngOnInit(): void {}

  newTab(index: number) {
    this.selectedIndex = index;
  }
}
