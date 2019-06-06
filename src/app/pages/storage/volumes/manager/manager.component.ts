import {
  Component,
  OnInit,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
  AfterViewInit,
} from '@angular/core';
import * as _ from 'lodash';
import { Router, ActivatedRoute } from '@angular/router';
// import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService, DialogService } from '../../../../services/';
import { DiskComponent } from './disk/';
import { VdevComponent } from './vdev/';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { TranslateService } from '@ngx-translate/core';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { StorageService } from '../../../../services/storage.service'
import { EntityUtils } from '../../../common/entity/utils';
import { DownloadKeyModalDialog } from '../../../../components/common/dialog/downloadkey/downloadkey-dialog.component';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/storage/volumes/manager/manager';


@Component({
  selector: 'app-manager',
  templateUrl: 'manager.component.html',
  styleUrls: [
    'manager.component.css',
  ],
  providers: [
    RestService,
    DialogService
  ],
})
export class ManagerComponent implements OnInit, OnDestroy, AfterViewInit {

  public disks: Array < any > = [];
  public suggestable_disks: Array < any > = [];
  public can_suggest = false;
  public selected: Array < any > = [];
  public vdevs:
    any = { data: [{}], cache: [], spare: [], log: [] };
  public original_vdevs: any = {};
  public original_disks: Array < any >;
  public orig_suggestable_disks: Array < any >;
  public error: string;
  @ViewChild('disksdnd') disksdnd;
  @ViewChildren(VdevComponent) vdevComponents: QueryList < VdevComponent > ;
  @ViewChildren(DiskComponent) diskComponents: QueryList < DiskComponent > ;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  public temp = [];

  public name: string;
  public resource_name = 'storage/volume/';
  public pk: any;
  public isNew = true;
  public vol_encrypt: number = 0;
  public isEncrypted: boolean = false;
  public re_has_errors = false;
  public nameFilter: RegExp;
  public capacityFilter: RegExp;
  public nameFilterField: string;
  public capacityFilterField: string;
  public dirty = false;
  protected existing_pools = [];
  public poolError = null;
  public isFooterConsoleOpen: boolean;
  public loaderOpen = false;

  public submitTitle = T("Create");
  protected extendedSubmitTitle = T("Extend");

  protected current_layout: any;
  protected existing_pool: any;
  protected needs_disk = true;
  protected needsDiskMessage = helptext.manager_needsDiskMessage;
  protected extendedNeedsDiskMessage = helptext.manager_extendedNeedsDiskMessage;
  public size;
  protected extendedAvailable;
  public sizeMessage = helptext.manager_sizeMessage;
  protected extendedSizeMessage = helptext.manager_extendedSizeMessage;

  public disknumError = null;
  public disknumErrorMessage = helptext.manager_disknumErrorMessage;
  public disknumErrorConfirmMessage = helptext.manager_disknumErrorConfirmMessage;
  public disknumExtendConfirmMessage = helptext.manager_disknumExtendConfirmMessage;

  public vdevtypeError = null;
  public vdevtypeErrorMessage = helptext.manager_vdevtypeErrorMessage;

  public diskAddWarning = helptext.manager_diskAddWarning;
  public diskExtendWarning = helptext.manager_diskExtendWarning;

  first_data_vdev_type: string;
  first_data_vdev_disknum: number;

  public busy: Subscription;

  public name_tooltip = helptext.manager_name_tooltip;

  public encryption_tooltip = helptext.manager_encryption_tooltip;

  public suggested_layout_tooltip = helptext.manager_suggested_layout_tooltip;

  public encryption_message = helptext.manager_encryption_message;

  constructor(
    private rest: RestService,
    private ws: WebSocketService,
    private router: Router,
//    private dragulaService: DragulaService,
    private dialog:DialogService,
    public snackBar: MatSnackBar,
    private loader:AppLoaderService,
    protected route: ActivatedRoute,
    public mdDialog: MatDialog,
    public translate: TranslateService,
    public sorter: StorageService ) {

/*    dragulaService.setOptions('pool-vdev', {
      accepts: (el, target, source, sibling) => { return true; },
    });
    dragulaService.drag.subscribe((value) => { console.log(value); });
    dragulaService.drop.subscribe((value) => {
      let [bucket, diskDom, destDom, srcDom, _] = value;
      let disk, srcVdev, destVdev;
      this.diskComponents.forEach((item) => {
        if (diskDom == item.elementRef.nativeElement) {
          disk = item;
        }
      });
      this.vdevComponents.forEach((item) => {
        if (destDom == item.dnd.nativeElement) {
          destVdev = item;
        } else if (srcDom == item.dnd.nativeElement) {
          srcVdev = item;
        }
      });
      if (srcVdev) {
        srcVdev.removeDisk(disk);
      }
      if (destVdev) {
        destVdev.addDisk(disk);
      }
    });
    dragulaService.over.subscribe((value) => { console.log(value); });
    dragulaService.out.subscribe((value) => { console.log(value); }); */
  }

  getDiskNumErrorMsg(disks) {
    this.translate.get(this.disknumErrorMessage).subscribe((errorMessage) => {
      this.disknumError = errorMessage + T(' First vdev has ') + this.first_data_vdev_disknum + T(' disks, new vdev has ') + disks + '.';
    });
  }

  getVdevTypeErrorMsg(type) {
    this.translate.get(this.vdevtypeErrorMessage).subscribe((errorMessage) => {
      this.vdevtypeError = errorMessage + T(' First vdev is a ') + this.first_data_vdev_type + T(', new vdev is ') + type + '.';
    });
  }

  getPoolData() {
    this.ws.call('pool.query', [
      [
        ["id", "=", this.pk]
      ]
    ]).subscribe(
      (res) => {
        if (res[0]) {
          this.first_data_vdev_type = res[0].topology.data[0].type.toLowerCase();
          if (this.first_data_vdev_type === 'raidz1') {
            this.first_data_vdev_type = 'raidz';
          }
          this.first_data_vdev_disknum = res[0].topology.data[0].children.length;

          if (this.first_data_vdev_disknum === 0 &&
              this.first_data_vdev_type === 'disk') {
            this.first_data_vdev_disknum = 1;
            this.first_data_vdev_type = 'stripe';
          }
        }
      },
      (err) => {
        new EntityUtils().handleWSError(this, err, this.dialog);
      }
    );
    this.rest.get(this.resource_name + this.pk, {}).subscribe((res) => {
      if (res && res.data) {
        this.extendedAvailable = res.data.avail;
        this.size = (<any>window).filesize(this.extendedAvailable, {standard : "iec"});
      }
    },
    (err) => {
      new EntityUtils().handleError(this, err);
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['pk']) {
        this.pk = parseInt(params['pk']);
        this.isNew = false;
      }
    });
    if (!this.isNew) {
      this.submitTitle = this.extendedSubmitTitle;
      this.sizeMessage = this.extendedSizeMessage;
      this.rest.get(this.resource_name + this.pk + '/', {}).subscribe((res) => {
        this.name = res.data.vol_name;
        this.vol_encrypt = res.data.vol_encrypt;
        if (this.vol_encrypt > 0) {
          this.isEncrypted = true;
        }
      });
      this.getPoolData();
    } else {
      this.ws.call('pool.query', []).subscribe((res) => {
        if (res) {
          this.existing_pools = res;
        }
      });
    }
    this.nameFilter = new RegExp('');
    this.capacityFilter = new RegExp('');

  }

  ngAfterViewInit() {
    this.loader.open();
    this.loaderOpen = true;
    this.ws.call("disk.get_unused", [true]).subscribe((res) => {
      this.loader.close();
      this.loaderOpen = false;
      this.disks = [];
      for (let i in res) {
        res[i]['real_capacity'] = res[i]['size'];
        res[i]['capacity'] = (<any>window).filesize(res[i]['size'], {standard : "iec"});
        this.disks.push(res[i]);
      }

     this.disks = this.sorter.tableSorter(this.disks, 'devname', 'asc');
     this.original_disks = Array.from(this.disks);


      // assign disks for suggested layout
      let largest_capacity = 0;
      for (let i = 0; i < this.disks.length; i++) {
        if (parseInt(this.disks[i].real_capacity) > largest_capacity) {
          largest_capacity = parseInt(this.disks[i].real_capacity);
        }
      }
      for (let i = 0; i < this.disks.length; i++) {
        if (parseInt(this.disks[i].real_capacity) === largest_capacity) {
          this.suggestable_disks.push(this.disks[i]);
        }
      }
      this.orig_suggestable_disks = Array.from(this.suggestable_disks);
      this. can_suggest = this.suggestable_disks.length < 11;

      this.temp = [...this.disks];
    }, (err) => {
      this.loader.close();
      new EntityUtils().handleWSError(this, err, this.dialog)
    });
    this.ws.call('system.advanced.config').subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });

    if (!this.isNew) {
      setTimeout(() => { // goofy workaround for stupid angular error
        this.dialog.confirm(T("Warning"), helptext.manager_extend_warning, 
            false, T("Continue")).subscribe((res) => {
          if (!res) {
            if (this.loaderOpen) {
              this.loader.close();
              this.loaderOpen = false;
            }
            this.goBack();
          }
        });
      });
    }
  }

  ngOnDestroy() {
    //this.dragulaService.destroy("pool-vdev");
  }

  addVdev(group) {
    this.dirty = true;
    this.vdevs[group].push({});
    this.getCurrentLayout();
  }

  removeVdev(vdev: VdevComponent) {
    let index = null;
    this.vdevComponents.forEach((item, i) => {
      if (item === vdev) {
        index = i;
      }
    });
    if (index !== null) {
      if (vdev.group === 'data') {
        this.vdevs[vdev.group].splice(index, 1);
      } else {
        this.vdevs[vdev.group] = []; // should only be one cache/spare/log
      }
    }
    this.getCurrentLayout();
  }

  getCurrentLayout() {
    let size_estimate = 0;
    if (!this.isNew) {
      size_estimate = this.extendedAvailable;
    }
    let data_vdev_disknum = 0;
    let data_disk_found = false;
    let any_disk_found = false;
    let data_vdev_type;
    this.disknumError = null;
    this.vdevtypeError = null;

    this.vdevComponents.forEach((vdev, i) => {
      if (vdev.group === 'data') {
        if (i === 0 && this.isNew) {
          this.first_data_vdev_type = vdev.type;
          data_vdev_type = vdev.type;
          if (vdev.disks.length > 0) {
            this.first_data_vdev_disknum = vdev.disks.length;
          } else {
            this.first_data_vdev_disknum = 0;
          }
        }
        if (vdev.disks.length > 0) {
          data_disk_found = true;
          data_vdev_disknum = vdev.disks.length;
          data_vdev_type = vdev.type;
        } else {
          data_vdev_disknum = 0;
        }
        size_estimate += vdev.rawSize;
        if (data_vdev_disknum > 0) {
          if( data_vdev_disknum !== this.first_data_vdev_disknum) {
            this.getDiskNumErrorMsg(data_vdev_disknum);
          }
          if( data_vdev_type !== this.first_data_vdev_type) {
            this.getVdevTypeErrorMsg(data_vdev_type);
          }
        }

      } else {
        if (vdev.disks.length > 0) {
          any_disk_found = true;
        }
      }

    });
    if (this.isNew) {
      this.needs_disk = !data_disk_found;
    } else {
      if (data_disk_found || any_disk_found) {
        this.needs_disk = false;
      } else {
        this.needs_disk = true;
      }
    }
    this.size = (<any>window).filesize(size_estimate, {standard : "iec"});
  }

  canSave() {
    if (this.isNew && !this.name) {
      return false;
    }
    if (this.vdevtypeError) {
      return false;
    }
    if (this.needs_disk) {
      return false;
    }
    if (this.poolError) {
      return false;
    }
    return true;
  }

  checkSubmit() {
    let disknumErr = this.disknumErrorConfirmMessage;
    if (!this.isNew) {
      disknumErr = this.disknumExtendConfirmMessage;
    }
    if (this.disknumError) {
      this.dialog.confirm(T("Warning"), disknumErr).subscribe((res) => {
        if (!res) {
          return;
        } else {
          this.doSubmit();
        }
      });
    } else {
      this.doSubmit();
    }
  }

  doSubmit() {
    let confirmButton = T('Create Pool');
    let diskWarning = this.diskAddWarning;
    if (!this.isNew) {
      confirmButton = T('Extend Pool');
      diskWarning = this.diskExtendWarning;
    }

    this.dialog.confirm(T("Warning"), diskWarning, false, confirmButton).subscribe((res) => {
      if (res) {
        this.error = null;

        const layout = [];
        this.vdevComponents.forEach((vdev) => {
          const disks = [];
          vdev.getDisks().forEach((disk) => {
            disks.push(disk.devname); });
          if (disks.length > 0) {
            layout.push({ vdevtype: vdev.type, disks: disks });
          }
        });

        let body = {};
        this.loader.open();
        if (this.isNew) {
          body = {volume_name: this.name, encryption: this.isEncrypted, layout: layout };
        } else {
          body  = {volume_add: this.name, layout: layout };
        }
        this.busy =
          this.rest
          .post(this.resource_name, {
            body: JSON.stringify(body)
          })
          .subscribe(
            (res) => {
              this.loader.close();
              if(this.isEncrypted) {
                let dialogRef = this.mdDialog.open(DownloadKeyModalDialog, {disableClose:true});

                dialogRef.componentInstance.volumeId = res.data.id;
                dialogRef.afterClosed().subscribe(result => {
                  this.goBack();
                });
              }
              else {
                this.goBack();
              }
            },
            (res) => {
              this.loader.close();
              if (res.code == 409) {
                this.error = '';
                for (let i in res.error) {
                  res.error[i].forEach(
                    (error) => { this.error += error + '<br />'; });
                }
              } else {
                this.dialog.errorReport(T('Error creating pool'), res.error.error_message, res.error.traceback);
              }
            });
          }
    });
  }

  goBack() {
    this.router.navigate(['/', 'storage', 'pools']);
  }

  openSnackBar() {
    this.snackBar.open(this.encryption_message, T("Warning"), {
      duration: 5000,
    });
  }

  openDialog() {
    if(this.isEncrypted) {
      this.dialog.confirm(T("Warning"), this.encryption_message, false, T('I Understand')).subscribe((res) => {
        if (res) {
          this.isEncrypted = true;
          this.vol_encrypt = 1
        } else {
          this.isEncrypted = false;
          this.vol_encrypt = 0;
        }
      });
    } else {
      this.isEncrypted = false;
      this.vol_encrypt = 0;
    }
  }

  isEncryptedChecked() {
    this.openDialog();
  }

  addDisk(disk: any) {
     this.disks.push(disk);
     this.disks = [...this.disks];
     this.temp.push(disk);
     this.disks = this.sorter.tableSorter(this.disks, 'devname', 'asc');
  }

  removeDisk(disk: any) {
    this.disks.splice(this.disks.indexOf(disk), 1);
    this.disks = [...this.disks];
    this.temp.splice(this.temp.indexOf(disk), 1);
    this.dirty = true;
    this.getCurrentLayout();
  }

  onSelect({ selected }) {
    this.selected.splice(0, this.selected.length);
    this.selected.push(...selected);
  }

  updateFilter(event) {
    const val = event.target.value.toLowerCase();
    let temp = this.temp;
    let re;
    try {
      re = new RegExp(val);
    } catch(e) {
      this.re_has_errors = true;
    }

    // filter our data
    if (re) {
      if (event.target.id === "pool-manager__nameFilter") {
        this.nameFilter = re;
      } else if (event.target.id === "pool-manager__capacityFilter") {
        this.capacityFilter = re;
      }

      this.re_has_errors = false;
      const self = this;
      const temp = this.temp.filter(function(d) {
        return self.nameFilter.test(d.devname.toLowerCase()) &&
               self.capacityFilter.test(d.capacity.toLowerCase());
      });

      // update the rows
      this.disks = temp;

      // Whenever the filter changes, always go back to the first page
      this.table.offset = 0;
    }
  }

  suggestLayout() {
    // todo: add more layouts, manipulating multiple vdevs is hard
    this.suggestRedundancyLayout();
  }

  resetLayout() {
    this.vdevComponents.forEach(vdev => {
      vdev.remove();
    });
    for (const group in this.vdevs) {
      if (this.vdevs.hasOwnProperty(group)) {
        while (this.vdevs[group].length > 0) {
          this.vdevs[group].pop();
        }
      }
    }
    this.nameFilterField = '';
    this.capacityFilterField = '';
    this.nameFilter = new RegExp('');
    this.capacityFilter = new RegExp('');
    this.vdevs['data'].push({});
    this.vdevComponents.first.estimateSize();
    this.disks = Array.from(this.original_disks);
    this.suggestable_disks = Array.from(this.orig_suggestable_disks);
    this.temp = [...this.disks];
    this.dirty = false;
    this.table.offset = 0;
    this.getCurrentLayout();
  }

  suggestRedundancyLayout() {
    for (let i = 0; i < this.suggestable_disks.length; i++) {
      this.vdevComponents.first.addDisk(this.suggestable_disks[i]);
    }
    while (this.suggestable_disks.length > 0) {
       this.removeDisk(this.suggestable_disks[0]);
       this.suggestable_disks.shift();
    }
  }

  checkPoolName() {
    if(_.find(this.existing_pools, {"name": this.name as any})) {
      this.poolError = T("A pool with this name already exists."); 
    } else {
      this.poolError = null;
    }
  }

  reorderEvent(event) {
    let sort = event.sorts[0],
      rows = this.disks;
    this.sorter.tableSorter(rows, sort.prop, sort.dir);
  }
}
