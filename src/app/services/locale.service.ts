import { Injectable } from '@angular/core';
import * as moment from 'moment';
import { PreferencesService } from 'app/core/services/preferences.service';

@Injectable()
export class LocaleService {

    constructor(public prefService: PreferencesService) { };

    getDateFormatOptions() {
        let options = [
            { label: moment().format('MMMM D, YYYY'), value: 'MMMM D, YYYY' },
            { label: moment().format('D MMMM, YYYY'), value: 'D MMMM, YYYY' },
            { label: moment().format('MMM D, YYYY'), value: 'MMM D, YYYY' },
            { label: moment().format('D MMM YYYY'), value: 'D MMM YYYY' },
            { label: moment().format('MM/DD/YYYY'), value: 'MM/DD/YYYY' },
            { label: moment().format('DD/MM/YYYY'), value: 'DD/MM/YYYY' },     
          ];
          return options;
    }

    formatDate(date) {
        return moment(date).format(this.prefService.preferences.dateFormat);
    }

    saveDateFormat(format) {
        this.prefService.preferences.dateFormat = format;
        this.prefService.savePreferences();
    }

    getPreferredDateFormat() {
        return this.prefService.preferences.dateFormat;
    }

}