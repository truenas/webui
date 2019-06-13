import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import {
    regexValidator
  } from '../../../pages/common/entity/entity-form/validators/regex-validation';

export default {
    global_paratext: T('Global Settings'),

    history: {
        placeholder: T('History'),
        tooltip: T('The number of entries the netdata daemon will\
 by default keep in memory for each chart dimension.'),
     validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    update_frequency: {
        placeholder : T('Update Frequency'),
        tooltip: T('The frequency in seconds, for data collection.'),
        validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    http_port_listen_backlog: {
        placeholder : T('HTTP Port Listen Backlog'),
        tooltip: T('The port backlog'),
        validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    bind_to: {
        placeholder : T('Bind to'),
        tooltip: T('Select one or more IP addresses to which to bind the Netdata service.')
    },
    bind_to_port: {
        placeholder : T('Bind to port'),
        tooltip: T('The port which will be used with selected bind to IP addresses'),
        validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    additional_params: {
        placeholder : T('Additional parameters'),
        tooltip: T('Instructions on adding keys and values')
    },

    alarms_paratext: T('Alarms'),

    alarms: {
        placeholder : T('Placeholder for dynamically created alarms'),
        tooltip: T('Instructions on alarms')
    },

    streaming_paratext: T('Streaming Metrics'),

    stream_mode: {
        placeholder : T('Stream Mode'),
        tooltip: T('Select a stream mode if system is to be used for streaming')
    },
    destination: {
        placeholder : T('Destination'),
        tooltip: T('Please provide line/space separated list of destinations where the\
 collected metrics are to be sent in the format HOST:PORT')
    },
    api_key: {
        placeholder : T('API Key'),
        tooltip: T('The API_KEY to use (as the sender)')
    },
    allow_from: {
        placeholder : T('Allow from'),
        tooltip: T('A list of simple patterns matching the IPs of the servers that will\
 be pushing metrics using this API key.')
    }                 

}