import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { ServiceDynamicDnsComponent } from 'app/pages/services/components/service-dynamic-dns/service-dynamic-dns.component';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { ServiceLldpComponent } from 'app/pages/services/components/service-lldp/service-lldp.component';
import { ServiceNfsComponent } from 'app/pages/services/components/service-nfs/service-nfs.component';
import { RsyncConfigureComponent } from 'app/pages/services/components/service-rsync/rsync-configure/rsync-configure.component';
import { RsyncModuleFormComponent } from 'app/pages/services/components/service-rsync/rsync-module-form/rsync-module-form.component';
import { RsyncModuleListComponent } from 'app/pages/services/components/service-rsync/rsync-module-list/rsync-module-list.component';
import { ServiceRsyncComponent } from 'app/pages/services/components/service-rsync/service-rsync.component';
import { ServiceS3Component } from 'app/pages/services/components/service-s3/service-s3.component';
import { ServiceSmbComponent } from 'app/pages/services/components/service-smb/service-smb.component';
import { ServiceSnmpComponent } from 'app/pages/services/components/service-snmp/service-snmp.component';
import { ServiceSshComponent } from 'app/pages/services/components/service-ssh/service-ssh.component';
import { ServiceTftpComponent } from 'app/pages/services/components/service-tftp/service-tftp.component';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';
import { ServiceWebdavComponent } from 'app/pages/services/components/service-webdav/service-webdav.component';
import { AppConfirmModule } from 'app/services/app-confirm/app-confirm.module';
import { EntityModule } from '../../modules/entity/entity.module';
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
    ServiceFtpComponent,
    ServiceLldpComponent,
    ServiceRsyncComponent,
    RsyncConfigureComponent,
    RsyncModuleListComponent,
    RsyncModuleFormComponent,
    ServiceSmartComponent,
    ServiceNfsComponent,
    ServiceTftpComponent,
    ServiceUpsComponent,
    ServiceDynamicDnsComponent,
    ServiceSmbComponent,
    ServiceSnmpComponent,
    ServiceWebdavComponent,
    ServiceS3Component,
  ],
})
export class ServicesModule {
}
