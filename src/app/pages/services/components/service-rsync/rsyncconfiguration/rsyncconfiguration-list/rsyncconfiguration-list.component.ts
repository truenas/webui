import { Component, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs/Subscription';
import { MatSnackBar } from '@angular/material';

import { WebSocketService } from '../../../../../../services/ws.service';
import { DialogService } from '../../../../../../services/';
import { debug } from 'util';
import { AppLoaderService } from '../../../../../../services/app-loader/app-loader.service';
import { EntityJobComponent } from '../../../../../common/entity/entity-job/entity-job.component';

@Component({
    selector : 'app-module-list',
    template : `<entity-table [title]="title" [conf]="this"></entity-table>`
  })
  export class RSYNCconfigurationListComponent {

  }