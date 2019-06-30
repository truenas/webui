import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import {
    regexValidator
  } from '../../../pages/common/entity/entity-form/validators/regex-validation';

export default {
    global_paratext: T('Global Settings'),

    history: {
        placeholder: T('History'),
        tooltip: T('The number of <samp>entries</samp> the netdata daemon will\
 by default keep in memory for each chart dimension. Default is 86400.'),
     validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    update_every: {
        placeholder : T('Update Frequency'),
        tooltip: T('The frequency, in seconds, for data collection.'),
        validation: [Validators.required, regexValidator(/^\d+$/) ]
    },
    http_port_listen_backlog: {
        placeholder : T('HTTP Port Listen Backlog'),
        tooltip: T('The port backlog'),
        validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    bind: {
        placeholder : T('Bind to'),
        tooltip: T('Select one or more IP addresses to which to bind the Netdata service.')
    },
    port: {
        placeholder : T('Bind to port'),
        tooltip: T('The port which will be used with selected bind to IP addresses'),
        validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    additional_params: {
        placeholder : T('Additional parameters'),
        tooltip: T('Define other sections and their respective key/value pairs (if any). Enclose each\
 section name in square brackets, and put each key/value pair on a new line. Example: <br>\
 [system.intr] <br> \
 history=86400 <br> \
 enabled=yes')
    },

    alarms: {
        placeholder : T('Alarms'),
        tooltip: T('Click on alarms to select or unselect.')
    },

    streaming_paratext: T('Streaming Metrics'),

    stream_mode: {
        placeholder : T('Stream Mode'),
        tooltip: T('Select a stream mode if system is to be used for streaming')
    },
    destination: {
        placeholder : T('Destination'),
        tooltip: T('Please provide line/space separated list of destinations where the\
 collected metrics are to be sent in the format HOST:PORT (port is optional). Netdata\
 will use the first working destination.'),
        validation: [Validators.required]
    },
    api_key: {
        placeholder : T('API Key'),
        tooltip: T('The API_KEY to use (as the sender). This must be a valid UUID, and\
 can be generated in command line by typing "uuidgen".'),
        validation: [Validators.required]
    },
    allow_from: {
        placeholder : T('Allow from'),
        tooltip: T('A list of simple patterns matching the IPs of the servers that will\
 be pushing metrics using this API key.'),
        validation: [Validators.required]
    }

}
