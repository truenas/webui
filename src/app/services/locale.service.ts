import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
import { PreferencesService } from 'app/core/services/preferences.service';
import { WebSocketService } from './ws.service';
import { Subject } from 'rxjs';
import { CoreEvent, CoreService } from 'app/core/services/core.service';
import { T } from "app/translate-marker";

@Injectable()
export class LocaleService {
    t24 = T('(24 Hours)');
    timeZone: string;
    isWaiting =  false;
    dateFormat = 'YYYY-MM-DD';
    timeFormat = 'HH:mm:ss';
    public target: Subject<CoreEvent> = new Subject();

    constructor(public prefService: PreferencesService, public ws: WebSocketService, private core: CoreService) {
        this.ws.call('system.general.config').subscribe(res => {
            this.timeZone = res.timezone;
            this.core.emit({name:"UserPreferencesRequest", sender:this});
            this.core.register({observerClass:this,eventName:"UserPreferencesReady"}).subscribe((evt:CoreEvent) => {
              if(this.isWaiting){
                this.target.next({name:"SubmitComplete", sender: this});
                this.isWaiting = false;
              }
              this.dateFormat = evt.data.dateFormat;
              this.timeFormat = evt.data.timeFormat;
            });
        })
     };

    getDateFormatOptions(tz?: string) {
        if (tz) {
            moment.tz.setDefault(tz);
        }
        const options = [
            { label: moment().format('YYYY-MM-DD'), value: 'YYYY-MM-DD' },     
            { label: moment().format('MMMM D, YYYY'), value: 'MMMM D, YYYY' },
            { label: moment().format('D MMMM, YYYY'), value: 'D MMMM, YYYY' },
            { label: moment().format('MMM D, YYYY'), value: 'MMM D, YYYY' },
            { label: moment().format('D MMM YYYY'), value: 'D MMM YYYY' },
            { label: moment().format('MM/DD/YYYY'), value: 'MM/DD/YYYY' },
            { label: moment().format('DD/MM/YYYY'), value: 'DD/MM/YYYY' }
          ];
          return options;
    }

    getTimeFormatOptions(tz?: string) {
        if (tz) {
            moment.tz.setDefault(tz);
        }
        const options = [
            { label: `${moment().format('HH:mm:ss')} ${this.t24}`, value: 'HH:mm:ss' },
            { label: moment().format('hh:mm:ss a'), value: 'hh:mm:ss a' },
            { label: moment().format('hh:mm:ss A'), value: 'hh:mm:ss A' }
        ];
        return options;
    }

    formatDateTime(date, tz?) {      
        tz ? moment.tz.setDefault(tz) : moment.tz.setDefault(this.timeZone);
        return moment(date).format(`${this.prefService.preferences.dateFormat} ${this.prefService.preferences.timeFormat}`);
    }

    saveDateTimeFormat(dateFormat, timeFormat) {
        this.core.emit({ name: 'ChangePreference', data: {
            key: 'dateFormat', value: dateFormat
        }, sender:this});
        this.core.emit({ name: 'ChangePreference', data: {
           key: 'timeFormat', value: timeFormat
        }, sender:this});
    }

    getPreferredDateFormat() {
        return this.dateFormat;
    }

    getPreferredTimeFormat() {
        return this.timeFormat;
    }
    
    // Translates moment.js format to angular template format for use in special cases such as form-scheduler
    getAngularFormat() {
        let tempStr = `${this.dateFormat} ${this.timeFormat}`
        let dateStr = '';
        for (let i = 0; i < tempStr.length; i++) {
            tempStr[i] === 'M' || tempStr[i] === 'Z' || tempStr[i] === 'H' ? dateStr += tempStr[i] :
                dateStr += tempStr[i].toLowerCase();
        }
        return dateStr;
    }

}