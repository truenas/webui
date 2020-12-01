import { Component, OnInit } from '@angular/core';
import { ApplicationsService } from './applications.service';
@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {
  selectedIndex = 0;

  constructor(private appService: ApplicationsService) { }

  ngOnInit(): void {
    this.appService.getCatItems().subscribe(res => {
      console.log(res);
    })
  }

  newTab(index: number) {
    this.selectedIndex = index;
  }
}
