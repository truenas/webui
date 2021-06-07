import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { MaterialModule } from 'app/appMaterial.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AppConfirmModule } from 'app/services/app-confirm/app-confirm.module';
import { UserService } from 'app/services/user.service';
import { EntityModule } from '../common/entity/entity.module';
import { ServiceDDNSComponent } from './components/service-dynamicdns';
import { ServiceFTPComponent } from './components/service-ftp';
import { ServiceLLDPComponent } from './components/service-lldp';
import { ServiceNFSComponent } from './components/service-nfs';
import { ServiceRSYNCComponent } from './components/service-rsync';
import { CconfigureRYSNCComponent } from './components/service-rsync/rsyncconfiguration/configure_rsync';
import { RSYNCconfigurationListComponent } from './components/service-rsync/rsyncconfiguration/rsyncconfiguration-list';
import { RYSNCConfigurationFormComponent } from './components/service-rsync/rsyncconfiguration/rsyncmodule';
import { ServiceS3Component } from './components/service-s3';
import { ServiceSMARTComponent } from './components/service-smart';
import { ServiceSMBComponent } from './components/service-smb';
import { ServiceSNMPComponent } from './components/service-snmp';
import { ServiceSSHComponent } from './components/service-ssh';
import { ServiceTFTPComponent } from './components/service-tftp';
import { ServiceUPSComponent } from './components/service-ups';
import { ServiceWebdavComponent } from './components/service-webdav';
import { Services } from './services.component';
import { routing } from './services.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EntityModule,
    routing,
    MaterialModule,
    AppConfirmModule,
    NgxDatatableModule,
    TranslateModule,
    CommonDirectivesModule,
  ],
  declarations: [
    Services,
    ServiceSSHComponent,
    ServiceFTPComponent,
    ServiceLLDPComponent,
    ServiceRSYNCComponent,
    CconfigureRYSNCComponent,
    RSYNCconfigurationListComponent,
    RYSNCConfigurationFormComponent,
    ServiceSMARTComponent,
    ServiceNFSComponent,
    ServiceTFTPComponent,
    ServiceUPSComponent,
    ServiceDDNSComponent,
    ServiceSMBComponent,
    ServiceSNMPComponent,
    ServiceWebdavComponent,
    ServiceS3Component,
  ],
  providers: [UserService],
})
export class ServicesModule {
}
