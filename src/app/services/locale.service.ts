import { Injectable } from '@angular/core';
import * as moment from 'moment-timezone';
import { PreferencesService } from 'app/core/services/preferences.service';
import { SystemGeneralService } from '../services';
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
    dateTimeFormatChange$ = new Subject();
    public target: Subject<CoreEvent> = new Subject();

    constructor(public prefService: PreferencesService, public sysGeneralService: SystemGeneralService, 
        private core: CoreService) {
        this.sysGeneralService.getGeneralConfig.subscribe(res => {
            this.timeZone = res.timezone;
        })
        if (window.localStorage.dateFormat) {
            this.dateFormat = window.localStorage.getItem('dateFormat')
        }
        if (window.localStorage.timeFormat) {
            this.timeFormat = window.localStorage.getItem('timeFormat')
        }
        this.getPrefs();
     };

     getPrefs() {
        this.core.emit({name:"UserPreferencesRequest", sender:this});
        this.core.register({observerClass:this,eventName:"UserPreferencesReady"})
          .subscribe((evt:CoreEvent) => {
          if(this.isWaiting){
            this.target.next({name:"SubmitComplete", sender: this});
            this.isWaiting = false;
          }
          this.dateFormat = evt.data.dateFormat;
          this.timeFormat = evt.data.timeFormat;
          this.storeDateTimeFormat(this.dateFormat, this.timeFormat);
          this.dateTimeFormatChange$.next();
        });
    }

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
            { label: moment().format('DD/MM/YYYY'), value: 'DD/MM/YYYY' },
            { label: moment().format('DD.MM.YYYY'), value: 'DD.MM.YYYY' }
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
        return moment(date).format(`${this.dateFormat} ${this.timeFormat}`);
    }

    formatDateTimeWithNoTz(date) {      
        moment.tz.setDefault('')
        return moment(date).format(`${this.dateFormat} ${this.timeFormat}`);
    }

    getTimeOnly(date, seconds=true, tz?) {
        tz ? moment.tz.setDefault(tz) : moment.tz.setDefault(this.timeZone);
        let format: string;
        if (!seconds) {
            switch(this.timeFormat) {
                case 'HH:mm:ss':
                    format = 'HH:mm';
                    break;
                case 'hh:mm:ss a':
                    format = 'hh:mm a';
                    break;
                case 'hh:mm:ss A':
                    format = 'hh:mm A';
                    break;
                default:
                    format = this.timeFormat;
            }
        }
        else {
            format = this.timeFormat;
        }
        return moment(date).format(format);
    }

    saveDateTimeFormat(dateFormat, timeFormat) {
        this.dateFormat = dateFormat;
        this.timeFormat = timeFormat;
        this.storeDateTimeFormat(this.dateFormat, this.timeFormat);
        this.dateTimeFormatChange$.next();

        this.core.emit({ name: 'ChangePreference', data: {
            key: 'dateFormat', value: dateFormat
        }, sender:this});
        this.core.emit({ name: 'ChangePreference', data: {
           key: 'timeFormat', value: timeFormat
        }, sender:this});
    }

    storeDateTimeFormat(dateFormat: string, timeFormat: string) {
        window.localStorage.setItem('dateFormat', dateFormat);
        window.localStorage.setItem('timeFormat', timeFormat);
    }

    getPreferredDateFormat() {
        return this.dateFormat;
    }

    getPreferredTimeFormat() {
        return this.timeFormat;
    }

    getDateAndTime(tz?) {
        if (tz) {
            moment.tz.setDefault(tz);
        }
        return [moment().format(this.dateFormat), moment().format(this.timeFormat)];
    }
    
    // Translates moment.js format to angular template format for use in special cases such as form-scheduler
    getAngularFormat() {
        let ngTimeFormat: string;
        // Renders lowercase am and pm
        ngTimeFormat = this.timeFormat === 'hh:mm:ss a' ?  'hh:mm:ss aaaaa\'m\'' : this.timeFormat;
        let tempStr = `${this.dateFormat} ${ngTimeFormat}`;
        let dateStr = '';
        for (let i = 0; i < tempStr.length; i++) {
            tempStr[i] === 'M' || tempStr[i] === 'Z' || tempStr[i] === 'H' ? dateStr += tempStr[i] :
                dateStr += tempStr[i].toLowerCase();
        }
        return dateStr;
    }

    getCopyrightYearFromBuildTime(): string {
        const buildTime = localStorage.getItem('buildtime').trim();
        const buildTimeInMillis = parseInt(buildTime);
        return new Date(buildTimeInMillis).getFullYear().toString();
    }
}