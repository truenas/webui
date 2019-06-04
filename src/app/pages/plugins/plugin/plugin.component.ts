import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import * as myIP from 'what-is-my-ip-address';
import * as _ from 'lodash';

import { T } from '../../../translate-marker';
import { EntityUtils } from '../../common/entity/utils';
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
  protected publicIp = '';

  constructor(protected matDialog: MatDialog) { }

  ngOnInit() {
    this.actions = this.getActions(this.config);

    myIP.v4().then((pubIp) => {
      this.publicIp = pubIp;
    }).catch((e) => {
      console.log("Error getting Public IP: ", e);
      this.publicIp = '';
    });
  }

  getActions(row) {
    const actions = [{
      name: row[1],
      id: "start",
      label: T("START"),
      icon: 'play_arrow',
      visible: this.isActionVisible('start'),
      onClick: () => {
        this.parent.loader.open();
        row[3] = 'STARTING...';
        this.parent.ws.job('jail.start', [row[1]]).subscribe(
          (res) => {
            this.parent.conf.updateRows([row]).then(() => {
              this.actions = this.getActions(this.config);
              this.parent.loader.close();
            });
          },
          (res) => {
            this.parent.loader.close();
            new EntityUtils().handleWSError(this.parent, res, this.parent.dialogService);
          });
      }
    },
    {
      name: row[1],
      id: "restart",
      label: T("RESTART"),
      icon: 'replay',
      visible: this.isActionVisible('restart'),
      onClick: () => {
        this.parent.loader.open();
        row[3] = 'RESTARTING...';
        this.parent.ws.job('jail.restart', [row[1]]).subscribe(
          (res) => {
            this.parent.conf.updateRows([row]).then(() => {
              this.actions = this.getActions(this.config);
              this.parent.loader.close();
            });
          },
          (err) => {
            this.parent.loader.close();
            new EntityUtils().handleWSError(this.parent, err, this.parent.dialogService);
          });
      }
    },
    {
      name: row[1],
      id: "stop",
      label: T("STOP"),
      icon: 'stop',
      visible: this.isActionVisible('stop'),
      onClick: () => {
        this.parent.loader.open();
        row[3] = 'STOPPING...';
        this.parent.ws.job('jail.stop', [row[1]]).subscribe(
          (res) => {
            this.parent.conf.updateRows([row]).then(() => {
              this.actions = this.getActions(this.config);
              this.parent.loader.close()
            });
          },
          (res) => {
            this.parent.loader.close();
            new EntityUtils().handleWSError(this.parent, res, this.parent.dialogService);
          });
      }
    },
    {
      name: row[1],
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
      name: row[1],
      id: "management",
      label: T("MANAGE"),
      icon: 'settings',
      visible: this.isActionVisible('management'),
      onClick: () => {
        window.open(row[9]);
      }
    },
    {
      name: row[1],
      id: "delete",
      label: T("UNINSTALL"),
      icon: 'delete',
      visible: this.isActionVisible('delete'),
      onClick: () => {
        this.parent.doDelete(row);
      }
    }];

    if (row['1'].startsWith('asigra')) {
      actions.push({
        name: row[1],
        id: "register",
        label: T('REGISTER'),
        icon: 'assignment',
        visible: this.isActionVisible('register'),
        onClick: () => {
          this.getRegistrationLink();
        }
      });
    }
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

  getRegistrationLink() {
    const url = 'https://licenseportal.asigra.com/licenseportal/user-registration.do';
    const form = document.createElement('form');
    form.action = url;
    form.method = 'POST';
    form.target = '_blank';
    form.style.display = 'none';

    const input = document.createElement('input');
    input.type = 'text';
    input.name = 'dsSystemPublicIP';
    input.value = this.publicIp;

    const submit = document.createElement('input');
    submit.type = 'submit';
    submit.id = 'submitProject';

    form.appendChild(input);
    form.appendChild(submit);
    document.body.appendChild(form);

    submit.click();

    document.body.removeChild(form);
  }
}