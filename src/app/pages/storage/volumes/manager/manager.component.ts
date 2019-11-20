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
import { MatDialog, MatDialogRef } from '@angular/material';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { TranslateService } from '@ngx-translate/core';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { StorageService } from '../../../../services/storage.service'
import { EntityUtils } from '../../../common/entity/utils';
import { DownloadKeyModalDialog } from '../../../../components/common/dialog/downloadkey/downloadkey-dialog.component';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/storage/volumes/manager/manager';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';


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
  @ViewChild('disksdnd', { static: true}) disksdnd;
  @ViewChildren(VdevComponent) vdevComponents: QueryList < VdevComponent > ;
  @ViewChildren(DiskComponent) diskComponents: QueryList < DiskComponent > ;
  @ViewChild(DatatableComponent, { static: false}) table: DatatableComponent;
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

  public vdevdisksError = false;
  public vdevdisksSizeError = false;

  public diskAddWarning = helptext.manager_diskAddWarning;
  public diskExtendWarning = helptext.manager_diskExtendWarning;

  first_data_vdev_type: string;
  first_data_vdev_disknum = 0;
  first_data_vdev_disksize: number;
  first_data_vdev_disktype: string;

  private duplicable_disks = [];

  public canDuplicate = false;

  public busy: Subscription;

  public name_tooltip = helptext.manager_name_tooltip;

  public encryption_tooltip = helptext.manager_encryption_tooltip;

  public suggested_layout_tooltip = helptext.manager_suggested_layout_tooltip;

  public encryption_message = helptext.manager_encryption_message;

  public startingHeight: any;
  public expandedRows: any;
  public swapondrive = 2;

  constructor(
    private rest: RestService,
    private ws: WebSocketService,
    private router: Router,
//    private dragulaService: DragulaService,
    private dialog:DialogService,
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

  duplicate() {
    const duplicable_disks = this.duplicable_disks;
    let maxVdevs = 0;
    if (this.first_data_vdev_disknum && this.first_data_vdev_disknum > 0) {
      maxVdevs = Math.floor(this.duplicable_disks.length / this.first_data_vdev_disknum);
    }
    const vdevs_options = [];
    for (let i = maxVdevs; i > 0; i--) {
      vdevs_options.push({label: i, value: i});
    }
    const self = this;
    const conf: DialogFormConfiguration = {
      title: helptext.manager_duplicate_title,
      fieldConfig: [
        {
          type: 'select',
          name: 'vdevs',
          value: maxVdevs,
          placeholder: helptext.manager_duplicate_vdevs_placeholder,
          tooltip: helptext.manager_duplicate_vdevs_tooltip,
          options: vdevs_options
        },
        {
          type: 'paragraph',
          name: 'copy_desc',
          paraText: '',
        },
      ],

      saveButtonText: helptext.manager_duplicate_button,
      customSubmit: function (entityDialog) {
        const value = entityDialog.formValue;
        const origVdevs = self.vdevComponents.toArray();
        // handle case of extending with zero vdevs filled out
        if (origVdevs.length === 1 && origVdevs[0].disks.length === 0) {
          const vdev = origVdevs[0];
          value.vdevs = value.vdevs - 1;
          for (let i = 0; i < self.first_data_vdev_disknum; i++) {
            const disk = duplicable_disks.shift();
            vdev.addDisk(disk);
            self.removeDisk(disk);
          }
        }
        for (let i = 0; i < value.vdevs; i++) {
          const vdev_values = {disks:[], type:self.first_data_vdev_type};
          for (let j = 0; j < self.first_data_vdev_disknum; j++) {
            const disk = duplicable_disks.shift();
            vdev_values['disks'].push(disk);
            // remove disk from selected
            self.selected = _.remove(self.selected, function(d) {
              return d.devname !== disk.devname;
            });
          }
          self.addVdev('data', vdev_values);
        }
        entityDialog.dialogRef.close(true);
      },
      parent: this,
      afterInit: function(entityDialog) {
        const copy_desc = _.find(this.fieldConfig, {'name':'copy_desc'});
        const parent = entityDialog.parent;
        const setParatext = function(vdevs) {
          const used = parent.first_data_vdev_disknum * vdevs;
          const remaining = parent.duplicable_disks.length - used;
          const size = (<any>window).filesize(parent.first_data_vdev_disksize, {standard : "iec"});
          const type = parent.first_data_vdev_disktype;
          const vdev_type = parent.first_data_vdev_type;
          const paraText = "Create " + vdevs + " new " + vdev_type + " data vdevs using " + used +
            " (" + size + ") " + type + "s and leaving " + remaining + " of those drives unused."
          copy_desc.paraText = paraText;
        }
        setParatext(entityDialog.formGroup.controls['vdevs'].value);
        entityDialog.formGroup.controls['vdevs'].valueChanges.subscribe((vdevs) => {
          setParatext(vdevs);
        });
      }
    };
    this.dialog.dialogForm(conf);
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

          let first_disk;
          if (this.first_data_vdev_disknum === 0 &&
              this.first_data_vdev_type === 'disk') {
            this.first_data_vdev_disknum = 1;
            this.first_data_vdev_type = 'stripe';
            first_disk = res[0].topology.data[0];
          } else {
            first_disk = res[0].topology.data[0].children[0];
          }
          this.ws.call('disk.query', [[["name", "=", first_disk.disk]]]).subscribe(disk => {
            if (disk[0]) {
              this.first_data_vdev_disksize = disk[0].size;
              this.first_data_vdev_disktype = disk[0].type;
            }
            this.getDuplicableDisks();
          });
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
    this.ws.call('system.advanced.config').subscribe(res => {
      this.swapondrive = res.swapondrive;
    });
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
    this.ws.call("disk.get_unused",[]).subscribe((res) => {
      this.loader.close();
      this.loaderOpen = false;
      this.disks = [];
      for (let i in res) {
        res[i]['real_capacity'] = res[i]['size'];
        res[i]['capacity'] = (<any>window).filesize(res[i]['size'], {standard : "iec"});
        const details = [];
        if (res[i]['rotationrate']) {
          details.push({label:T('Rotation Rate'), value:res[i]['rotationrate']});
        }
        details.push({label:T('Model'), value:res[i]['model']});
        details.push({label:T('Serial'), value:res[i]['serial']});
        if (res[i]['enclosure']) {
          details.push({label:T('Enclosure'), value:res[i]['enclosure']['number']});
        }
        res[i]['details'] = details;
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
      this.getDuplicableDisks();
    }, (err) => {
      this.loader.close();
      new EntityUtils().handleWSError(this, err, this.dialog)
    });
    this.ws.call('system.advanced.config').subscribe((res)=> {
      if (res) {
        this.isFooterConsoleOpen = res.consolemsg;
      }
    });

  }

  ngOnDestroy() {
    //this.dragulaService.destroy("pool-vdev");
  }

  addVdev(group, initial_values={}) {
    this.dirty = true;
    this.vdevs[group].push(initial_values);
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
    this.vdevdisksError = false;
    this.vdevdisksSizeError = false;

    this.vdevComponents.forEach((vdev, i) => {
      if (vdev.group === 'data') {
        if (i === 0 && this.isNew) {
          this.first_data_vdev_type = vdev.type;
          data_vdev_type = vdev.type;
          if (vdev.disks.length > 0) {
            this.first_data_vdev_disknum = vdev.disks.length;
            this.first_data_vdev_disksize = vdev.disks[0].size;
            this.first_data_vdev_disktype = vdev.disks[0].type;
            this.canDuplicate = true;
          } else {
            this.first_data_vdev_disknum = 0;
            this.first_data_vdev_disksize = null;
            this.first_data_vdev_disktype = null;
            this.canDuplicate = false;
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
      if (vdev.vdev_disks_error) {
        this.vdevdisksError = true;
      }
      if (vdev.vdev_disks_size_error) {
        this.vdevdisksSizeError = true;
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

    this.getDuplicableDisks();
  }

  getDuplicableDisks() {
    this.duplicable_disks = [];
    for (let i = 0; i < this.disks.length; i++) {
      const disk = this.disks[i];
      if (disk.size === this.first_data_vdev_disksize && disk.type === this.first_data_vdev_disktype) {
        this.duplicable_disks.push(disk);
      }
    }
    if (!this.first_data_vdev_disknum || this.duplicable_disks.length < this.first_data_vdev_disknum) {
      this.canDuplicate = false;
    } else {
      this.canDuplicate = true;
    }
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
    if (this.vdevdisksError) {
      return false;
    }
    if (this.vdevdisksSizeError) {
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
                dialogRef.componentInstance.fileName = 'pool_' + res.data.name + '_encryption.key';
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

  toggleExpandRow(row) {
    //console.log('Toggled Expand Row!', row);
    if (!this.startingHeight) {
      this.startingHeight = document.getElementsByClassName('ngx-datatable')[0].clientHeight;
    }
    this.table.rowDetail.toggleExpandRow(row);
    setTimeout(() => {
      this.expandedRows = (document.querySelectorAll('.datatable-row-detail').length);
      const newHeight = (this.expandedRows * 100) + this.startingHeight;
      const heightStr = `height: ${newHeight}px`;
      document.getElementsByClassName('ngx-datatable')[0].setAttribute('style', heightStr);
    }, 100)
  }
}
