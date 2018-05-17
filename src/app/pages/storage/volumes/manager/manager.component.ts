import {
  Component,
  OnInit,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DragulaService } from 'ng2-dragula';
import { Subscription } from 'rxjs';
import { RestService, WebSocketService, DialogService } from '../../../../services/';
import { DiskComponent } from './disk/';
import { VdevComponent } from './vdev/';
import { MatSnackBar, MatDialog, MatDialogRef } from '@angular/material';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { TranslateService } from '@ngx-translate/core';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { StorageService } from '../../../../services/storage.service'
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
export class ManagerComponent implements OnInit, OnDestroy {

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

  public busy: Subscription;

  public name_tooltip = T('ZFS pools must conform to strict naming\
 <a href="https://docs.oracle.com/cd/E23824_01/html/821-1448/gbcpt.html"\
 target="_blank">conventions</a>. Choose a memorable name that will\
 stick out in the logs.');
  public encryption_tooltip = T('<a href="https://www.freebsd.org/cgi/man.cgi?query=geli&manpath=FreeBSD+11.1-RELEASE+and+Ports"\
 target="_blank">GELI</a> encryption is available for ZFS pools.\
 <b>WARNING: </b>Read the "Encryption" section (Section 8.1.1.1) of the\
 <a href="guide">Guide</a> before activating this option.');
  public suggested_layout_tooltip = T('Arranges available disks in a\
 system recommended formation.');
  
  public encryption_message = T("Always backup the key! If the key is lost, the\
                   data on the disks will also be lost with no hope of recovery.");

  constructor(
    private rest: RestService,
    private ws: WebSocketService,
    private router: Router,
    private dragulaService: DragulaService,
    private dialog:DialogService,
    public snackBar: MatSnackBar,
    private loader:AppLoaderService,
    protected route: ActivatedRoute,
    public mdDialog: MatDialog,
    public translate: TranslateService,
    public sorter: StorageService ) {

    dragulaService.setOptions('pool-vdev', {
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
    dragulaService.out.subscribe((value) => { console.log(value); });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['pk']) {
        this.pk = params['pk'];
        this.isNew = false;
      }
    });
    if (!this.isNew) {
      this.rest.get(this.resource_name + this.pk + '/', {}).subscribe((res) => {
        this.name = res.data.vol_name;
        this.vol_encrypt = res.data.vol_encrypt;
        if (this.vol_encrypt > 0) {
          this.isEncrypted = true;
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
    if (!this.isNew) {
      this.dialog.confirm(T("Warning"), T("Extending your pool will stripe additional \
        vdevs onto your pool resulting in a larger pool.  It is recommended that \
        you only stripe vdevs of the same size and type as the ones that are already \
        in the existing pool, this operation cannot be reversed.  \
        Do you wish to continue?")).subscribe((res) => {
        if (!res) {
           this.goBack();
        }
      });
    }
  }

  ngOnDestroy() {
    this.dragulaService.destroy("pool-vdev");
  }

  addVdev(group) {
    this.dirty = true;
    this.vdevs[group].push({});
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
  }

  doSubmit() {
    this.dialog.confirm(T("Warning"), T("The existing contents of all the disks you have added will be erased.")).subscribe((res) => {
      if (res) {
        this.error = null;

        let layout = [];
        this.vdevComponents.forEach((vdev) => {
          let disks = [];
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
                this.dialog.errorReport(res.code, res.error.error_message, res.error.error_message)
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
      this.dialog.confirm(T("Warning"), this.encryption_message).subscribe((res) => {
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
     this.disks = this.sorter.mySorter(this.disks, 'devname');
  }

  removeDisk(disk: any) {
    this.disks.splice(this.disks.indexOf(disk), 1);
    this.disks = [...this.disks];
    this.temp.splice(this.temp.indexOf(disk), 1);
    this.dirty = true;
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
}
