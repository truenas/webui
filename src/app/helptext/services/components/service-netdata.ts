import { T } from '../../../translate-marker';
import { Validators } from '@angular/forms';
import {
    regexValidator
  } from '../../../pages/common/entity/entity-form/validators/regex-validation';

export default {
    global_paratext: T('Global Settings'),

    history: {
        placeholder: T('History'),
        tooltip: T('The number of entries the netdata daemon keeps\
 in memory for each chart dimension. Default is 86400.'),
     validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    update_every: {
        placeholder : T('Update Frequency'),
        tooltip: T('Data collection frequency, in seconds.'),
        validation: [Validators.required, regexValidator(/^\d+$/) ]
    },
    http_port_listen_backlog: {
        placeholder : T('HTTP Port Listen Backlog'),
        tooltip: T('The port backlog'),
        validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    bind: {
        placeholder : T('Bind to'),
        tooltip: T('One or more IP addresses to which to bind the Netdata service.')
    },
    port: {
        placeholder : T('Bind to Port'),
        tooltip: T('TCP port to use on bind to IP addresses'),
        validation: [ Validators.required, regexValidator(/^\d+$/) ]
    },
    additional_params: {
        placeholder : T('Additional Parameters'),
        tooltip: T('Define other sections and their key/value pairs. Enclose each\
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
        tooltip: T('Select a stream mode if system is to be used for streaming.')
    },
    destination: {
        placeholder : T('Destination'),
        tooltip: T('Please provide a line- or space-separated list of destinations where the\
 collected metrics are to be sent. Use the format HOST:PORT (port is optional). Netdata\
 uses the first working destination.'),
        validation: [Validators.required]
    },
    api_key: {
        placeholder : T('API Key'),
        tooltip: T('The API_KEY to use as the sender. This must be a valid UUID.\
 It can be generated from the command line by typing <samp>uuidgen</samp>.'),
        validation: [Validators.required]
    },
    allow_from: {
        placeholder : T('Allow from'),
        tooltip: T('A list of simple patterns matching the IPs of the servers that will\
 be pushing metrics using this API key.'),
        validation: [Validators.required]
    }

}
