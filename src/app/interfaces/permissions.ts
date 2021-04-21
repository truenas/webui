export interface Permissions {
    READ_DATA: boolean;
    WRITE_DATA: boolean;
    APPEND_DATA: boolean;
    READ_NAMED_ATTRS: boolean;
    WRITE_NAMED_ATTRS: boolean;
    EXECUTE: boolean;
    DELETE_CHILD: boolean;
    READ_ATTRIBUTES: boolean;
    WRITE_ATTRIBUTES: boolean;
    DELETE: boolean;
    READ_ACL: boolean;
    WRITE_ACL: boolean;
    WRITE_OWNER: boolean;
    SYNCHRONIZE: boolean;
    BASIC: boolean;
  }