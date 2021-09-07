import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { WebSocketService } from 'app/services/ws.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-resilver-progress-dialog',
  templateUrl: './resilver-progress.component.html',
  styleUrls: ['./resilver-progress.component.scss'],
})
export class ResilverProgressDialogComponent implements OnInit {
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
  diskName: string;

  constructor(
    protected translate: TranslateService,
    protected ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.ws.subscribe('zfs.pool.scan').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res && res.fields.scan.function.indexOf('RESILVER') > -1) {
        this.resilveringDetails = res.fields;
        this.diskName = this.resilveringDetails.name;
        this.progressTotalPercent = this.resilveringDetails.scan.percentage;
        this.state = this.resilveringDetails.scan.state;
      }
    });
  }
}
