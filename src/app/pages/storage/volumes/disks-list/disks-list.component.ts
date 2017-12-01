import { Component, ElementRef, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../services/';
import { TourService } from '../../../../services/tour.service';
import filesize from 'filesize';
import { debug } from 'util';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector : 'app-volumes-list',
  template : `<entity-table [title]="title" [conf]="this"></entity-table>`
})
export class DisksListComponent {

  public title = "View Disks";
  protected flattenedVolData: any;
  protected resource_name: string = 'storage/disk/';
  
}
