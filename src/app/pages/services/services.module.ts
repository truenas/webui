import { NgModule }      from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../theme/nga.module';

import { Service } from './components/service.component';
import { Services } from './services.component';
import { routing }       from './services.routing';
import { EntityModule } from '../common/entity/entity.module';
import { ServiceSSHComponent } from './components/service-ssh';
import { ServiceAFPComponent } from './components/service-afp';
import { ServiceDCComponent } from './components/service-dc';
<<<<<<< HEAD
import { ServiceFTPComponent } from './components/service-ftp';
import { ServiceLLDPComponent } from './components/service-lldp';
import { ServiceRSYNCComponent } from './components/service-rsync';
import { ServiceSMARTComponent } from './components/service-smart';
=======
>>>>>>> 101a9c456999bc675c9a0199fbc49c1798709bf5
import { ServiceNFSComponent } from './components/service-nfs';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NgaModule,
    EntityModule,
    routing
  ],
  declarations: [
    Service,
    Services,
    ServiceSSHComponent,
    ServiceAFPComponent,
    ServiceDCComponent,
<<<<<<< HEAD
    ServiceFTPComponent,
    ServiceLLDPComponent,
    ServiceRSYNCComponent,
    ServiceSMARTComponent,
=======
>>>>>>> 101a9c456999bc675c9a0199fbc49c1798709bf5
    ServiceNFSComponent
  ],
  providers: [
  ]
})
export class ServicesModule {}
