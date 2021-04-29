import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import {
  Component, Output, EventEmitter, OnInit, OnDestroy,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';
import { T } from '../../../../translate-marker';
import { WebSocketService } from '../../../../services/ws.service';

@Component({
  selector: 'app-resilver-progress-dialog',
  templateUrl: './resilver-progress.component.html',
  styleUrls: ['./resilver-progress.component.css'],
})
export class ResilverProgressDialogComponent implements OnInit, OnDestroy {
  tooltip: string;
  hideCancel = false;
  final = false;
  parent: any;
  progressTotalPercent = 0;
  state: any;
  resilveringDetails: any;
  title = T('Resilvering Status');
  description = T('Resilvering pool: ');
  statusLabel = T('Status: ');
  protected subscription: Subscription;
  diskName: string;

  constructor(public dialogRef: MatDialogRef < ResilverProgressDialogComponent >,
    protected translate: TranslateService, protected ws: WebSocketService) {
  }

  ngOnInit(): void {
    this.subscription = this.ws.subscribe('zfs.pool.scan').subscribe((res) => {
      if (res && res.fields.scan.function.indexOf('RESILVER') > -1) {
        this.resilveringDetails = res.fields;
        this.diskName = this.resilveringDetails.name;
        this.progressTotalPercent = this.resilveringDetails.scan.percentage;
        this.state = this.resilveringDetails.scan.state;
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
