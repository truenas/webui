import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/pages/common/ix-tables/ix-table.module';
import { ServiceDynamicDnsComponent } from 'app/pages/services/components/service-dynamic-dns/service-dynamic-dns.component';
import { ServiceFTPComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceLLDPComponent } from 'app/pages/services/components/service-lldp/service-lldp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { RsyncConfigureComponent } from 'app/pages/services/components/service-rsync/rsync-configure/rsync-configure.component';
import { RsyncModuleFormComponent } from 'app/pages/services/components/service-rsync/rsync-module-form/rsync-module-form.component';
import { RsyncModuleListComponent } from 'app/pages/services/components/service-rsync/rsync-module-list/rsync-module-list.component';
import { ServiceRSYNCComponent } from 'app/pages/services/components/service-rsync/service-rsync.component';
import { ServiceS3Component } from 'app/pages/services/components/service-s3/service-s3.component';
import { ServiceSMBComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSNMPComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceTFTPComponent } from 'app/pages/services/components/service-tftp/service-tftp.component';
import { ServiceUPSComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { ServiceWebdavComponent } from 'app/pages/services/components/service-webdav/service-webdav.component';
import { AppConfirmModule } from 'app/services/app-confirm/app-confirm.module';
import { EntityModule } from '../common/entity/entity.module';
import { ServiceSmartComponent } from './components/service-smart/service-smart.component';
import { ServicesComponent } from './services.component';
import { routing } from './services.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EntityModule,
    routing,
    MaterialModule,
    AppConfirmModule,
    TranslateModule,
    CommonDirectivesModule,
    IxFormsModule,
    ReactiveFormsModule,
    IxTableModule,
  ],
  declarations: [
    ServicesComponent,
    ServiceSshComponent,
    ServiceFTPComponent,
    ServiceLLDPComponent,
    ServiceRSYNCComponent,
    RsyncConfigureComponent,
    RsyncModuleListComponent,
    RsyncModuleFormComponent,
    ServiceSmartComponent,
    ServiceNfsComponent,
    ServiceTFTPComponent,
    ServiceUPSComponent,
    ServiceDynamicDnsComponent,
    ServiceSMBComponent,
    ServiceSNMPComponent,
    ServiceWebdavComponent,
    ServiceS3Component,
  ],
})
export class ServicesModule {
}
