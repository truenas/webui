import { Component, OnInit } from '@angular/core';
import { ApplicationsService } from './applications.service';
import { ModalService } from '../../services/modal.service';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})

export class ApplicationsComponent implements OnInit {
  selectedIndex = 0;

  constructor(private appService: ApplicationsService, private modalService: ModalService) { }

  ngOnInit(): void {

  }

  newTab(index: number) {
    this.selectedIndex = index;
  }

  refresh(e) {
    this.selectedIndex = e.index;
    if (e.index === 1) {
      this.modalService.refreshTable();
    }
  }
}
