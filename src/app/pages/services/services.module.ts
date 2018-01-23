import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {MaterialModule} from '../../appMaterial.module';

import {EntityModule} from '../common/entity/entity.module';
import {AppConfirmModule} from "../../services/app-confirm/app-confirm.module";

import {ServiceAFPComponent} from './components/service-afp';
import {ServiceCIFSComponent} from './components/service-cifs';
import {ServiceDCComponent} from './components/service-dc';
import {ServiceDDNSComponent} from './components/service-dynamicdns';
import {ServiceFTPComponent} from './components/service-ftp';
import {ServiceLLDPComponent} from './components/service-lldp';
import {ServiceNFSComponent} from './components/service-nfs';
import {ServiceRSYNCComponent} from './components/service-rsync';
import {ServiceS3Component} from './components/service-s3';
import {ServiceSMARTComponent} from './components/service-smart';
import {ServiceSMBComponent} from './components/service-smb';
import {ServiceSNMPComponent} from './components/service-snmp';
import {ServiceSSHComponent} from './components/service-ssh';
import {ServiceTFTPComponent} from './components/service-tftp';
import {ServiceUPSComponent} from './components/service-ups';
import {ServiceWebdavComponent} from './components/service-webdav';
import {Service} from './components/service.component';
import {Services} from './services.component';
import {routing} from './services.routing';

@NgModule({
  imports : [ CommonModule, FormsModule, EntityModule, routing, MaterialModule, AppConfirmModule ],
  declarations : [
    Service, Services, ServiceSSHComponent, ServiceAFPComponent,
    ServiceDCComponent, ServiceFTPComponent, ServiceLLDPComponent,
    ServiceRSYNCComponent, ServiceSMARTComponent, ServiceNFSComponent,
    ServiceTFTPComponent, ServiceUPSComponent, ServiceDDNSComponent,
    ServiceCIFSComponent, ServiceSMBComponent, ServiceSNMPComponent,
    ServiceWebdavComponent, ServiceS3Component
  ],
  providers : []
})
export class ServicesModule {
}
