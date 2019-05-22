import { Component, Input, OnInit } from '@angular/core';

import { T } from '../../../translate-marker';

@Component ({
    selector: 'app-single-plugin',
    templateUrl: './plugin.component.html',
})
export class PluginComponent implements OnInit {
    @Input() config: any;
    @Input() parent: any;

    constructor(){}
    
    ngOnInit() {
        console.log('hello', this.config, this.parent);
        
    }

    getActions(parentRow) {
        const actions = [{
            id: "start",
            label: T("Start"),
            icon: 'play_arrow',
            onClick: (row) => {
            //   this.loader.open();
            //   this.entityList.busy =
            //     this.ws.call('jail.start', [row[1]]).subscribe(
            //       (res) => {
            //         this.loader.close();
            //         this.updateRow(row);
            //       },
            //       (res) => {
            //         this.loader.close();
            //         new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
            //       });
            }
          },
          {
            id: "restart",
            label: T("Restart"),
            icon: 'replay',
            onClick: (row) => {
            //   this.loader.open();
            //   row[3] = 'restarting';
            //   this.entityList.busy =
            //     this.ws.call('jail.restart', [row[1]]).subscribe(
            //       (res) => {
            //         this.loader.close();
            //         this.updateRow(row);
            //       },
            //       (err) => {
            //         this.loader.close();
            //         new EntityUtils().handleWSError(this.entityList, err, this.dialogService);
            //       });
            }
          },
          {
            id: "stop",
            label: T("Stop"),
            icon: 'stop',
            onClick: (row) => {
            //   this.loader.open();
            //   this.entityList.busy =
            //     this.ws.call('jail.stop', [row[1]]).subscribe(
            //       (res) => {
            //         this.loader.close();
            //         this.updateRow(row);
            //       },
            //       (res) => {
            //         this.loader.close();
            //         new EntityUtils().handleWSError(this.entityList, res, this.dialogService);
            //       });
            }
          },
          {
            id: "update",
            label: T("Update"),
            icon: 'update',
            onClick: (row) => {
            //   const dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": T("Updating Plugin") }, disableClose: true });
            //   dialogRef.componentInstance.setCall('jail.update_to_latest_patch', [row[1]]);
            //   dialogRef.componentInstance.submit();
            //   dialogRef.componentInstance.success.subscribe((res) => {
            //     dialogRef.close(true);
            //     this.snackBar.open(T("Plugin ") + row[1] + T(" updated."), T('Close'), { duration: 5000 });
            //   });
            }
          },
          {
            id: "management",
            label: T("Management"),
            icon: 'settings',
            onClick: (row) => {
            //   window.open(row[9]);
            }
          },
          {
            id: "delete",
            label: T("Delete"),
            icon: 'delete',
            onClick: (row) => {
            //   this.entityList.doDelete(row);
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
}