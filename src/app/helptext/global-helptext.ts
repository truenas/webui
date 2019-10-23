import { T } from '../translate-marker';

export default {
    copyright_year: '2019',
    dockerhost: T('Docker Host'),

    ctrlr: T('TrueNAS controller'),
    ctrlrs: T('TrueNAS controllers'),
    Ctrlr: T('TrueNAS Controller'),
    Ctrlrs: T('TrueNAS Controllers'),
    thisCtlr: T('This Controller'),
    unknownCtrl: T('The active controller cannot be detected.'),

    legacyUIWarning: T('The legacy user interface is deprecated.\
 All management should be performed through the new user interface.'),

sys_update_message: T('This system will restart when the update completes.'),

human_readable: {
    input_error: T('Invalid value. Valid values are numbers followed by optional unit letters, \
 like <samp>256k</samp> or <samp>1 G</samp> or <samp>2 MiB</samp>.'),

 suggestion_label: '(Ex. 500 KiB/s, 500M, 2 TB)',
},

closed_job_message: T('See task manager for progress updates.'),

noLogDilaog: {
    title: T('No Logs'),
    message: T('No logs are available for this task.'),
}

}
