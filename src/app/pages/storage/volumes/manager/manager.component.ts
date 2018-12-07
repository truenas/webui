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
  public dirty = false;
  protected existing_pools = [];
  public poolError = null;

  public submitTitle = T("Create");
  protected extendedSubmitTitle = T("Extend");

  protected current_layout: any;
  protected existing_pool: any;
  protected needs_disk = true;
  protected needsDiskMessage = T("Add one or more disks to be used for data.");
  protected extendedNeedsDiskMessage = T("Add one or more disks to extend the pool.");
  public size;
  protected extendedAvailable;
  public sizeMessage = T("Estimated total raw data capacity");
  protected extendedSizeMessage = T("Estimated data capacity available after extension.");

  public disknumError = null;
  public disknumErrorMessage = T("WARNING: Adding data vdevs with different numbers of \
      disks is not recommended.");
  public disknumErrorConfirmMessage = T("It is not recommended to create a pool with vdevs \
      containing different numbers of disks. Continue?");
  public disknumExtendConfirmMessage = T("It is not recommended to extend a pool with one or \
      more vdevs containing different numbers of disks. Continue?");

  public vdevtypeError = null;
  public vdevtypeErrorMessage = T("Adding data vdevs of different types is not supported.");

  public diskAddWarning = T("The contents of all added disks will be erased.");
  public diskExtendWarning = T("The contents of all newly added disks will be erased. The pool \
      will be extended to the new topology with existing data left intact.");

  first_data_vdev_type: string;
  first_data_vdev_disknum: number;

  public busy: Subscription;

  public name_tooltip = T('ZFS pools must conform to strict naming <a\
                           href="https://docs.oracle.com/cd/E23824_01/html/821-1448/gbcpt.html"\
                           target="_blank">conventions</a>. Choose a\
                           memorable name.');

  public encryption_tooltip = T('<a href="https://www.freebsd.org/cgi/man.cgi?query=geli&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
                                 target="_blank">GELI</a> encryption is\
                                 available for ZFS pools. <b>WARNING:</b>\
                                 Read the <a\
                                 href="%%docurl%%/storage.html%%webversion%%#managing-encrypted-pools"\
                                 target="_blank">Encryption section</a>\
                                 of the guide before activating this\
                                 option.');

  public suggested_layout_tooltip = T('Create a recommended formation\
                                       of vdevs in a pool.');

  public encryption_message = T("Always back up the key! Losing the key \
                                 will also lose all data on the disks with \
                                 no chance of recovery.");

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
        new EntityUtils().handleError(this, err);
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
    this.ws.call("notifier.get_disks", [true]).subscribe((res) => {
      this.disks = [];
      for (let i in res) {
        res[i]['real_capacity'] = res[i]['capacity'];
        res[i]['capacity'] = (<any>window).filesize(res[i]['capacity'], {standard : "iec"});
        this.disks.push(res[i]);
      }

     this.disks = this.sorter.tableSorter(this.disks, 'devname', 'asc');


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
      this. can_suggest = this.suggestable_disks.length < 11;

      this.temp = [...this.disks];
    });
  }

  ngAfterViewInit() {
    if (!this.isNew) {
      setTimeout(() => { // goofy workaround for stupid angular error
        this.dialog.confirm(T("Warning"), T("Extending the pool adds new\
                                             vdevs in a stripe with the\
                                             existing vdevs. It is important\
                                             to only use new vdevs of the\
                                             same size and type as those\
                                             already in the pool. This\
                                             operation cannot be reversed.\
                                             Continue?"), false, T("Continue")).subscribe((res) => {
          if (!res) {
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
    let diskWarning = this.diskAddWarning;
    if (!this.isNew) {
      diskWarning = this.diskExtendWarning;
    }

    this.dialog.confirm(T("Warning"), diskWarning, false, T('Create Pool')).subscribe((res) => {
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
      if (event.target.id === "nameFilter") {
        this.nameFilter = re;
      } else if (event.target.id === "capacityFilter") {
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
