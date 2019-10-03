import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MaterialModule} from '../../appMaterial.module';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import {EntityModule} from '../common/entity/entity.module';
import {AppConfirmModule} from "../../services/app-confirm/app-confirm.module";

import {ServiceAFPComponent} from './components/service-afp';
import {ServiceDDNSComponent} from './components/service-dynamicdns';
import {ServiceFTPComponent} from './components/service-ftp';
import {ServiceLLDPComponent} from './components/service-lldp';
import {ServiceNFSComponent} from './components/service-nfs';
import {ServiceRSYNCComponent} from './components/service-rsync';
import {RSYNCconfigurationListComponent} from './components/service-rsync/rsyncconfiguration/rsyncconfiguration-list';
import {CconfigureRYSNCComponent} from './components/service-rsync/rsyncconfiguration/configure_rsync';
import {RYSNCConfigurationFormComponent} from './components/service-rsync/rsyncconfiguration/rsyncmodule';
import {ServiceS3Component} from './components/service-s3';
import {ServiceSMARTComponent} from './components/service-smart';
import {ServiceSMBComponent} from './components/service-smb';
import {ServiceSNMPComponent} from './components/service-snmp';
import {ServiceSSHComponent} from './components/service-ssh';
import {ServiceTFTPComponent} from './components/service-tftp';
import {ServiceUPSComponent} from './components/service-ups';
import {ServiceWebdavComponent} from './components/service-webdav';
import {Services} from './services.component';
import { ServicesTableComponent } from './services-table.component';
import {routing} from './services.routing';
import { TranslateModule } from '@ngx-translate/core';

import { UserService } from '../../services/user.service';

@NgModule({
  imports : [ CommonModule, FormsModule, EntityModule, routing, MaterialModule, AppConfirmModule, NgxDatatableModule, TranslateModule ],
  declarations : [
    Services, ServiceSSHComponent, ServiceAFPComponent,
    ServiceFTPComponent, ServiceLLDPComponent,
    ServiceRSYNCComponent, CconfigureRYSNCComponent,RSYNCconfigurationListComponent, RYSNCConfigurationFormComponent,
    ServiceSMARTComponent, ServiceNFSComponent, ServiceTFTPComponent, ServiceUPSComponent,
    ServiceDDNSComponent, ServiceSMBComponent, ServiceSNMPComponent,
    ServiceWebdavComponent, ServiceS3Component, ServicesTableComponent
  ],
  providers : [UserService]
})
export class ServicesModule {
}
