import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { CoreEvent } from './core.service';
import { SystemProfileService } from './system-profile.service';

/*
 * This is a collection of services that will 
 * make calls when UI initializes and cache it
 * for later use
 * */

@Injectable({
  providedIn: 'root'
})
export class DataService {

  constructor(
    private sysInfo: SystemProfileService
  ) {  
  }
}
