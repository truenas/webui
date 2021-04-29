export interface Group {
    id: number;
    bsdgrp_gid: number;
    bsdgrp_group: string;
    bsdgrp_builtin: boolean;
    bsdgrp_sudo: boolean;
    bsdgrp_sudo_nopasswd: boolean;
    bsdgrp_sudo_commands: { [property: string]: any }[]
    bsdgrp_smb: boolean;
}