import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';

import { T } from '../../../translate-marker';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { WebSocketService } from '../../../services';
import * as _ from 'lodash';
import { EntityUtils } from '../../common/entity/utils';
import { DialogService } from '../../../../app/services';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';

@Component({
  selector: 'app-single-plugin',
  templateUrl: './plugin.component.html',
  styleUrls: ['./plugin.component.css'],
})
export class PluginComponent implements OnInit {
  @Input() config: any;
  @Input() parent: any;

  public actions: any[];

  constructor(
    protected loader: AppLoaderService,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected matDialog: MatDialog) { }

  ngOnInit() {
    console.log('hello', this.config, this.parent);
    this.actions = this.getActions(this.config);
  }

  getActions(row) {
    const actions = [{
      id: "start",
      label: T("START"),
      icon: 'play_arrow',
      visible: this.isActionVisible('start'),
      onClick: () => {
        this.loader.open();
        row[3] = 'STARTING...';
        this.ws.job('jail.start', [row[1]]).subscribe(
          (res) => {
            this.updateRow(row).then(() => this.loader.close());
          },
          (res) => {
            this.loader.close();
            new EntityUtils().handleWSError(this.parent, res, this.dialogService);
          });
      }
    },
    {
      id: "restart",
      label: T("RESTART"),
      icon: 'replay',
      visible: this.isActionVisible('restart'),
      onClick: () => {
        this.loader.open();
        row[3] = 'RESTARTING...';
        this.ws.job('jail.restart', [row[1]]).subscribe(
          (res) => {
            this.updateRow(row).then(() => this.loader.close());
          },
          (err) => {
            this.loader.close();
            new EntityUtils().handleWSError(this.parent, err, this.dialogService);
          });
      }
    },
    {
      id: "stop",
      label: T("STOP"),
      icon: 'stop',
      visible: this.isActionVisible('stop'),
      onClick: () => {
        this.loader.open();
        row[3] = 'STOPPING...';
        this.ws.job('jail.stop', [row[1]]).subscribe(
          (res) => {
            this.updateRow(row).then(() => this.loader.close());
          },
          (res) => {
            this.loader.close();
            new EntityUtils().handleWSError(this.parent, res, this.dialogService);
          });
      }
    },
    {
      id: "update",
      label: T("UPDATE"),
      icon: 'update',
      visible: this.isActionVisible('update'),
      onClick: () => {
          const dialogRef = this.matDialog.open(EntityJobComponent, { data: { "title": T("Updating Plugin") }, disableClose: true });
          dialogRef.componentInstance.setCall('jail.update_to_latest_patch', [row[1]]);
          dialogRef.componentInstance.submit();
          dialogRef.componentInstance.success.subscribe((res) => {
            dialogRef.close(true);
            this.parent.snackBar.open(T("Plugin ") + row[1] + T(" updated."), T('Close'), { duration: 5000 });
          });
      }
    },
    {
      id: "management",
      label: T("MANAGE"),
      icon: 'settings',
      visible: this.isActionVisible('management'),
      onClick: () => {
        console.log(row[9]);
        
          window.open(row[9]);
      }
    },
    {
      id: "delete",
      label: T("UNINSTALL"),
      icon: 'delete',
      visible: this.isActionVisible('delete'),
      onClick: () => {
          this.parent.doDelete(row);
      }
    }
    ]
    // if (parentRow['1'].startsWith('asigra')) {
    //   actions.push({
    //     id: "register",
    //     label: T('Register'),
    //     onClick: (row) => {
    //     //   this.getRegistrationLink();
    //     }
    //   });
    // }
    return actions;
  }

  isActionVisible(actionId: string) {
    if (actionId === 'start' && this.config[3] === "up") {
      return false;
    } else if (actionId === 'stop' && this.config[3] === "down") {
      return false;
    } else if (actionId === 'management' && (this.config[3] === "down" || this.config[9] == null)) {
      return false;
    } else if (actionId === 'restart' && this.config[3] === "down") {
      return false;
    }
    return true;
  }

  updateRow(row): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.ws.call('jail.list_resource', ["PLUGIN"]).subscribe(
        (res) => {
          for (let i = 0; i < res.length; i++) {
            if (res[i][1] == row[1]) {
              for (const j in row) {
                row[j] = (j === '6' && _.split(res[i][j], '|').length > 1) ? _.split(res[i][j], '|')[1] : res[i][j];
              }
              this.actions = this.getActions(this.config);
              resolve(true);
            }
          }
          reject(false);
        },
        (err) => {
          reject(err);
        }
      )
    });
  }
}