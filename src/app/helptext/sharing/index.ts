import { T } from "app/translate-marker";

export * from "./afp/afp";
export * from "./iscsi/iscsi";
export * from "./nfs/nfs";
export * from "./smb/smb";
export * from "./webdav/webdav";

export const shared = {
    delete_share_message: T("The sharing configuration will be removed.\
    Data in the share dataset will not be affected."),

    dialog_title: T("Enable service"),
    dialog_message: T("Enable this service?"),
    dialog_button: T("Enable Service"),
  
    dialog_started_title: T(' Service'),
    dialog_started_message: T(' service has been enabled and started.')
    
}


