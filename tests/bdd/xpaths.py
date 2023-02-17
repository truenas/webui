
CHECKBOX = '//mat-checkbox'
TOGGLE = '//mat-slide-toggle'
BUTTON = '//button'


def mat_Option(option):
    return f'//mat-option[contains(.,"{option}")]'


class active_Directory:
    title = '//h3[@class="ix-formtitle" and text()="Active Directory"]'
    enable_Checkbox = '//ix-checkbox[@formcontrolname="enable"]//mat-checkbox'
    domain_Input = '//ix-input[@formcontrolname="domainname"]//input'
    account_Input = '//ix-input[@formcontrolname="bindname"]//input'
    password_Input = '//ix-input[@formcontrolname="bindpw"]//input'
    ca_Ou_Input = '//ix-input[@formcontrolname="createcomputer"]//input'
    netbios_Name_Input = '//ix-input[@formcontrolname="netbiosname"]//input'


class add_Catalog:
    title = '//h3[text()="Add Catalog"]'
    catalog_Name_Input = '//ix-input[@formcontrolname="label"]//input'
    repository_Input = '//ix-input[@formcontrolname="repository"]//input'
    train_Input = '//ix-chips[@formcontrolname="preferred_trains"]//input'
    branch_Input = '//ix-input[@formcontrolname="branch"]//input'


class add_Dataset:
    title = '//h3[text()="Add Dataset"]'
    name_Textarea = '//div[@id="name"]//textarea'
    share_Type_Select = '//mat-select[@ix-auto="select__Share Type"]'
    share_Type_Select_Text = '//mat-select[@ix-auto="select__Share Type"]//span[contains(@class,"mat-select-min-line")]'
    share_Type_SMB_Option = '//mat-option[@ix-auto="option__Share Type_SMB"]'


class add_Group:
    title = '//h3[contains(.,"Add Group")]'
    edit_Title = '//h3[contains(.,"Edit Group")]'
    name_Input = '//ix-input[@formcontrolname="name"]//input'
    gid_Input = '//ix-input[@formcontrolname="gid"]//input'
    allow_Duplicate_Gid_Checkbox = '//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox'


class add_Kerberos_Keytab:
    title = '//h3[text()="Add Kerberos Keytab"]'
    name_Input = '//ix-input[@formcontrolname="name"]//input'
    file_input = '//ix-file-input[@formcontrolname="file"]//input'


class add_NFS:
    title = '//h3[text()="Add NFS Share"]'
    path_Input = '//ix-explorer[@formcontrolname="path"]//input'
    mapall_User_Combobox = '//ix-combobox[@formcontrolname="mapall_user"]//input'
    mapall_Group_Combobox = '//ix-combobox[@formcontrolname="mapall_group"]//input'


class add_User:
    title = '//h3[text()="Add User"]'
    edit_Title = '//h3[text()="Edit User"]'
    full_Name_Input = '//ix-input[@formcontrolname="full_name"]//input'
    username_Input = '//ix-input[@formcontrolname="username"]//input'
    password_Input = '//ix-input[@formcontrolname="password"]//input'
    confirm_Password_Input = '//ix-input[@formcontrolname="password_conf"]//input'
    shell_Select = '//ix-combobox[@formcontrolname="shell"]//input'
    bash_Shell_Option = '//mat-option[contains(.,"bash")]'
    sudo_Checkbox = '//mat-checkbox[contains(.,"Allow all sudo commands")]'
    email_Input = '//ix-input[@formcontrolname="email"]//input'
    auxiliary_Groups_Select = '//ix-select[@formcontrolname="groups"]//mat-select'
    root_Group_Option = '//mat-option[contains(.,"root")]'
    wheel_Group_Option = '//mat-option[contains(.,"wheel")]'
    qatest_Group_Option = '//mat-option[contains(.,"qatest")]'
    games_Group_Option = '//mat-option[contains(.,"games")]'
    home_Input = '//ix-explorer[@formcontrolname="home"]//input'
    password_Disabled_Slide = '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle'
    home_Mode_Owner_Write_Checkbox = '(//tr[contains(.,"User")]//mat-checkbox)[1]'
    home_Mode_Owner_Read_Checkbox = '(//tr[contains(.,"User")]//mat-checkbox)[2]'
    home_Mode_Owner_Exec_Checkbox = '(//tr[contains(.,"User")]//mat-checkbox)[3]'
    home_Mode_Group_Read_Checkbox = '(//tr[contains(.,"Group")]//mat-checkbox)[1]'
    home_Mode_Group_Write_Checkbox = '(//tr[contains(.,"Group")]//mat-checkbox)[2]'
    home_Mode_Group_Exec_Checkbox = '(//tr[contains(.,"Group")]//mat-checkbox)[3]'
    home_Mode_Other_Read_Checkbox = '(//tr[contains(.,"Other")]//mat-checkbox)[1]'
    home_Mode_Other_Write_Checkbox = '(//tr[contains(.,"Other")]//mat-checkbox)[2]'
    home_Mode_Other_Exec_Checkbox = '(//tr[contains(.,"Other")]//mat-checkbox)[3]'
    ssh_Pubkey_Textarea = '//ix-textarea[@formcontrolname="sshpubkey"]//textarea'


class add_Zvol:
    title = '//h3[text()="Add Zvol"]'
    name_Input = '//ix-input[@formcontrolname="name"]//input'
    size_Input = '//ix-input[@formcontrolname="volsize"]//input'


class advanced:
    title = '//h1[contains(.,"Advanced")]'
    system_Dataset_Pool_Card = '//h3[text()="System Dataset Pool"]'
    system_Dataset_Pool_Configure_Button = '//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]'

    def system_Dataset_Pool_Pool(pool_name):
        return f'//div[contains(.,"System Dataset Pool:")]//span[contains(text(),"{pool_name}")]'


class alert():
    title = '//h3[text()="Alerts"]'
    degraded_Critical_Level = '//ix-alert[contains(.,"DEGRADED")]//h3[contains(.,"Critical")]'
    degraded_Pool_Text = '//h4[contains(.,"Pool tank state is DEGRADED")]'
    close_Button = '//button[contains(.,"clear")]'


class applications:
    title = '//h1[text()="Applications"]'
    available_Applications_Tab = '//div[contains(text(),"Available Applications")]'
    manage_Catalogs_Tab = '//div[contains(text(),"Manage Catalogs")]'

    def card(app_name):
        return f'//mat-card[contains(.,"{app_name}")]'

    def install_Button(app_name):
        return f'//mat-card[contains(.,"{app_name}")]//span[contains(.,"Install")]'


class app_Setup:
    app_Name_Input = '//ix-input[contains(.,"Application Name")]//input'
    password_Input = '//ix-input[contains(.,"Password for WebUI")]//input'
    certificate_Select = '//ix-select[contains(.,"Certificate")]//mat-select//div'
    truenas_Certificate_Option = '//mat-option[contains(.,"truenas_default")]'
    root_User_Input = '//ix-input[contains(.,"Root User")]//input'
    root_Password_Input = '//ix-input[contains(.,"Root Password")]//input'
    enable_Flax_Checkbox = '//ix-checkbox[contains(.,"Enable Flax")]//mat-checkbox'

    image_Repository_Input = '//ix-input[contains(.,"Image repository")]//input'
    image_Tag_Input = '//ix-input[contains(.,"Image Tag")]//input'
    add_Port_Forwading_Button = '//ix-fieldset[contains(.,"Port Forwarding")]//button'
    container_Port_Input = '//ix-input[contains(.,"Container Port")]//input'
    node_Port_Input = '//ix-input[contains(.,"Node Port")]//input'
    container_Port2_Input = '(//ix-input[contains(.,"Container Port")]//input)[2]'
    node_Port2_Input = '(//ix-input[contains(.,"Node Port")]//input)[2]'

    def title(app_name):
        return f'//h3[contains(.,"{app_name}") and @class="ix-formtitle"]'


class button:
    add = '//button[contains(.,"Add")]'
    cancel = '//button[normalize-space(span/text())="Cancel"]'
    choose = '//button[normalize-space(span/text())="Choose"]'
    delete = '//button[contains(.,"Delete")]'
    edit = '//button[contains(.,"Edit")]'
    save = '//button[normalize-space(span/text())="Save"]'
    settings = '//button[contains(.,"Settings")]'
    Continue = '//button[contains(*/text(),"Continue")]'
    CONTINUE = '//button[contains(*/text(),"CONTINUE")]'
    close = '//button[contains(.,"Close")]'
    CLOSE = '//button[contains(.,"CLOSE")]'
    close_Icon = '//mat-icon[@id="ix-close-icon"]'
    advanced_Option = '//button[contains(*/text(),"Advanced Options")]'
    advanced_Settings = '//button[contains(.,"Advanced Settings")]'
    ok = '//button[@name="ok_button"]'
    power = '//button[@name="Power"]'
    restart = '//button[@name="power-restart"]'
    unset_Pool = '//button[contains(.,"Unset Pool")]'
    unset = '//button[contains(.,"Unset")]'
    chosse_Pool = '//button[contains(.,"Choose Pool")]'
    add_Catalog = '//button[contains(.,"Add Catalog")]'
    launch_Docker_Image = '//span[contains(.,"Launch Docker Image")]'
    initiate_Failover = '//button[contains(*/text(),"Initiate Failover") and contains(@class,"mat-default")]'
    leave_Domain = '//button[contains(.,"Leave Domain")]'


class certificates:
    title = '//h1[text()="Certificates"]'
    csr_Card_Title = '//h3[contains(text(),"Certificate Signing Requests")]'
    csr_Add_Button = '//mat-card[contains(.,"Certificate Signing Requests")]//button[contains(.,"Add")]'
    csr_Title = ''
    email_Input = '//input[@ix-auto="input__Email"]'


class checkbox:
    enabled = '//ix-checkbox[@formcontrolname="enabled"]//mat-checkbox'
    enable = '//ix-checkbox[@formcontrolname="enable"]//mat-checkbox'
    old_Confirm = '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]'
    confirm = '//ix-checkbox[@formcontrolname="confirm"]//mat-checkbox'
    sudo = '//ix-checkbox[@formcontrolname="sudo_commands_all"]//mat-checkbox'
    force = '//ix-checkbox[@formcontrolname="force"]//mat-checkbox'


class chosse_Pool_For_App:
    title = '//h1[contains(.,"Choose a pool for Apps")]'
    pool_Select = '//ix-select[@formcontrolname="pool"]//mat-select'
    tank_Pool_Option = '//mat-option[contains(.,"tank")]'


class dashboard:
    title = '//h1[contains(.,"Dashboard")]'
    system_Info_Card_Title = '//span[text()="System Information"]'
    system_Information_Standby_Title = '//span[contains(.,"System Information Standby")]'


class dataset:
    title = '//h1[text()="Datasets"]'
    add_Dataset_Button = '//button[contains(*/text(),"Add Dataset")]'
    permission_Title = '//h3[text()="Permissions"]'
    permission_Edit_Button = '//mat-card-header[contains(.,"Permissions")]//a[normalize-space(*/text())="Edit"]'
    add_Zvol_Button = '//button[normalize-space(span/text())="Add Zvol (New)"]'
    zfs_Encryption_Title = '//h3[text()="ZFS Encryption"]'
    zfs_Encryption_Edit_button = '//mat-card-header[contains(.,"ZFS Encryption")]//a[normalize-space(*/text())="Edit"]'
    lock_Button = '//button[contains(.,"Lock")]'
    unlock_Button = '//a[contains(.,"Unlock")]'
    lock_Pool_Icon = '//ix-dataset-node[contains(.,"encrypted_pool")]//mat-icon[@fonticon="mdi-lock"]'
    unlock_Pool_Icon = '//ix-dataset-node[contains(.,"encrypted_pool")]//mat-icon[@fonticon="mdi-lock-open-variant"]'

    def pool_Tree_Name(pool_name):
        return f'//span[text()=" {pool_name} " and contains(@class,"name")]'

    def pool_Selected(pool_name):
        return f'//span[text()="{pool_name}" and contains(@class,"own-name")]'

    def pool_Tree(pool_name):
        return f'//ix-dataset-node[contains(.,"{pool_name}")]/div'

    def dataset_Name(dataset_name):
        return f'//span[contains(text(),"{dataset_name}")]'

    def dataset_Tree(dataset_name):
        return f'//ix-dataset-node[contains(.,"{dataset_name}")]/div'

    def permission_At_Owner(user_name):
        return f'//div[text()="owner@ - {user_name}"]'

    def permission_At_Group(group_name):
        return f'//div[text()="group@ - {group_name}"]'

    def permission_User(user_name):
        return f'//div[text()="User - {user_name}"]'


class delete_Group:
    title = '//h1[text()="Delete Group"]'
    delete_Button = '//mat-dialog-container//button[normalize-space(*/text())="Delete"]'


class directory_Services:
    title = '//h1[text()="Directory Services"]'
    directory_Disable_Title = '//h3[text()="Active Directory and LDAP are disabled."]'
    configure_AD_Button = '//button[contains(.,"Configure Active Directory")]'
    configure_Ldap_Button = '//button[contains(.,"Configure LDAP")]'
    show_Button = '//button[contains(*/text(),"Show")]'
    warning_Dialog = '//h1[text()="Warning"]'
    delete_AD02_Realm_Button = '//tr[contains(.,"AD02")]//button'
    delete_Dialog = '//h1[text()="Delete"]'
    delete_Confirm_Checkbox = '//mat-checkbox[@name="confirm_checkbox"]'
    delete_Confirm_Button = '//button[@id="confirm-dialog__action-button"]'
    delete_AD_Account_Button = '//tr[contains(.,"AD_MACHINE_ACCOUNT")]//button'
    ldap_Card_Title = '//mat-card//h3[text()="LDAP"]'
    ldap_Status = '//span[contains(.,"Status:") and contains(.,"HEALTHY")]'
    kerberos_Keytab_Add_Button = '//mat-card[contains(.,"Kerberos Keytab")]//span[contains(text(),"Add")]'

    def ldap_Hostname(hostname):
        return f'//span[contains(.,"Hostname:") and contains(.,"{hostname}")]'


class disks:
    title = '//h1[text()="Disks"]'
    all_Disk = '//div[contains(text(),"sd")]'
    wipe_Button = '//mat-dialog-container//button[contains(.,"Wipe")]'

    def disk_Expander(disk):
        return f'//tr[@ix-auto="expander__{disk}"]/td[2]'

    def wipe_Disk_Button(disk):
        return f'//button[@ix-auto="button__WIPE_{disk}_{disk}"]'

    def confirm_Box_Title(disk):
        return f'//h1[contains(.,"Wipe Disk {disk}")]'


class edit_Acl:
    title = '//h1[text()="Edit ACL"]'
    owner_Combobox = '//ix-combobox[@formcontrolname="owner"]//input'
    owner_Apply_Checkbox = '//mat-checkbox[contains(.,"Apply Owner")]'
    group_Combobox = '//ix-combobox[@formcontrolname="ownerGroup"]//input'
    group_Apply_Checkbox = '//mat-checkbox[contains(.,"Apply Group")]'
    save_Acl_Button = '//button[contains(*/text(),"Save Access Control List")]'
    add_Item_Button = '//button[contains(.,"Add Item")]'
    who_Select = '//ix-select[@formcontrolname="tag"]//mat-select'
    who_User_Option = '//mat-option[contains(.,"User")]'
    user_Combobox = '//ix-combobox[@formcontrolname="user"]//input'
    builtin_Users_Cancel = '//div[contains(.,"Group - builtin_users") and contains(@class,"ace")]//mat-icon[text()="cancel"]'
    builtin_Administrators_Cancel = '//div[contains(.,"Group - builtin_administrators") and contains(@class,"ace")]//mat-icon[text()="cancel"]'
    recursive_Checkbox = '//ix-checkbox[@formcontrolname="recursive"]//mat-checkbox'
    traverse_Checkbox = '//ix-checkbox[@formcontrolname="traverse"]//mat-checkbox'
    permission_Select = '//ix-select[@formcontrolname="basicPermission"]//mat-select'
    permission_Read_Option = '//mat-option[contains(.,"Read")]'

    def combobox_Option(option):
        return f'//mat-option[contains(.,"{option}")]'

    def user_In_Acl(user_name):
        return f'//div[text()="User - {user_name}"]'


class edit_Encryption:
    title = '//h1[contains(.,"Edit Encryption Options")]'
    encryption_Type_Checkbox = '//ix-select[@formcontrolname="encryption_type"]//mat-select'
    encryption_Type_Passphrase_Option = '//mat-option[contains(.,"Passphrase")]'
    passphrase_Input = '//ix-input[@formcontrolname="passphrase"]//input'
    confirm_Passphrase_Input = '//ix-input[@formcontrolname="confirm_passphrase"]//input'
    confirm_Checkbox = '//ix-checkbox[@formcontrolname="confirm"]//mat-checkbox'


class edit_Permissions:
    title = '//h1[text()="Edit Permissions"]'
    user_Combobox = '//ix-combobox[@formcontrolname="user"]//input'
    user_Apply_Checkbox = '//mat-checkbox[contains(.,"Apply User")]'
    group_Combobox = '//ix-combobox[@formcontrolname="group"]//input'
    group_Apply_Checkbox = '//mat-checkbox[contains(.,"Apply Group")]'


class error:
    def message_Text(message):
        return f'//mat-error[contains(.,"{message}")]'


class export_Disconnect_Pool:
    title = '//h1[contains(text(),"Export/disconnect pool")]'
    destroy_Checkbox = '//ix-checkbox[@formcontrolname="destroy"]//mat-checkbox'
    confirm_Checkbox = '//ix-checkbox[@formcontrolname="confirm"]//mat-checkbox'
    pool_Name_Input = '//ix-input[@formcontrolname="nameInput"]//input'
    export_Disconnect_Button = '//mat-dialog-container//button[contains(.,"Export/Disconnect")]'


class global_Configuration:
    title = '//h3[text()="Edit Global Configuration"]'
    nameserver1_Input = '//ix-input[contains(.,"Nameserver 1")]//input'
    nameserver2_Input = '//ix-input[contains(.,"Nameserver 2")]//input'
    nameserver3_Input = '//ix-input[contains(.,"Nameserver 3")]//input'
    nameserver1_Delete = '//ix-input[contains(.,"Nameserver 1")]//mat-icon[@fonticon="mdi-close-circle"]'
    nameserver2_Delete = '//ix-input[contains(.,"Nameserver 2")]//mat-icon[@fonticon="mdi-close-circle"]'
    nameserver3_Delete = '//ix-input[contains(.,"Nameserver 3")]//mat-icon[@fonticon="mdi-close-circle"]'
    ipv4_Default_Gateway_Input = '//ix-input[contains(.,"IPv4 Default Gateway")]//input'
    hostname_Input = '//ix-input[contains(.,"Hostname")]//input'


class groups:
    title = '//h1[contains(text(),"Groups")]'
    edit_Button = '//button[contains(.,"Edit")]'
    qetest_Name = '//div[contains(.,"qetest")]'
    qetest_Expend = '//tr[contains(.,"qetest")]/td'
    qatest_Name = '//div[contains(.,"qatest")]'
    qatest_Expend = '//tr[contains(.,"qatest")]/td'
    gidtest_Name = '//div[contains(.,"gidtest")]'
    gidtestdupe_Name = '//div[contains(.,"gidtestdupe")]'
    gidtestdupe_Expend = '//tr[contains(.,"gidtestdupe")]/td'


class interface:
    title = '//h3[contains(text(),"Edit Interface")]'
    dhcp_Checkbox = '//mat-checkbox[contains(.,"DHCP")]'
    add_Allias = '//div[@class="label-container" and contains(.,"Aliases")]//button'
    ip_Address_Input = '//ix-ip-input-with-netmask//input'
    netmask_Select = '//ix-ip-input-with-netmask//mat-select'
    netmask_Option = '//mat-option[contains(.,"24")]'


class iscsi:
    title = '//h1[text()="iSCSI"]'
    protals_Tab = '//a[normalize-space(text())="Portals"]'
    targets_Tab = '//a[normalize-space(text())="Targets"]'
    extents_Tab = '//a[normalize-space(text())="Extents"]'
    iscsitest1_Text = '//div[normalize-space(text())="iscsitest1"]'


class iscsi_Wizard:
    """iscsi_Wizard contains xpaths for the iSCSI Wizard"""
    title = '//h1[text()="Wizard"]'
    block_Device_Title = '//mat-step-header[contains(.,"Create or Choose Block Device") and @tabindex="0"]'
    device_Name_Input = '//input[@ix-auto="input__Name"]'
    extent_Type_Select = '//mat-select[@ix-auto="select__Extent Type"]'
    extent_Type_Device_Option = mat_Option('Device')
    device_Dropdown = '//span[@id="disk-select"]'
    create_New_Button = '//button[contains(.,"Create New")]'
    pool_Dataset_Input = '//input[@data-placeholder="Pool/Dataset"]'
    size_Input = '//input[@ix-auto="input__Size"]'
    size_Select_Contain_GiB = '//mat-select[contains(.,"GiB")]'
    block_Device_Next_Button = '//button[@id="goforward_button_0"]'
    portal_Title = '//mat-step-header[contains(.,"Portal") and @tabindex="0"]'
    portal_Select = '//mat-select[@ix-auto="select__Portal"]'
    create_New_Option = '//mat-option[contains(.,"Create New")]'
    discovery_Authentication_Method_Select = '//mat-select[@ix-auto="select__Discovery Authentication Method"]'
    none_Option = mat_Option('NONE')
    ip_Address_Select = '//mat-select[@ix-auto="select__IP Address"]'
    zero_Ip_Option = mat_Option('0.0.0.0')
    portal_Next_Button = '//button[@id="goforward_button_1"]'
    initiator_Title = '//mat-step-header[contains(.,"Initiator") and @tabindex="0"]'
    initiator_Input = '//input[@placeholder="Initiators"]'
    initiator_Next_Button = '//button[@id="goforward_button_2"]'
    confirm_Options_Title = '//mat-step-header[contains(.,"Confirm Options") and @tabindex="0"]'
    iscsi_Summary = '//div[contains(text(),"iSCSI Summary")]'
    summary_Name = '//div[contains(text(),"Name: iscsitest1")]'
    extent_new_Device = '//div[contains(text(),"New Device: tank/iscsitest1(1 G)")]'
    portal_listen = '//div[contains(text(),"Listen: 0.0.0.0")]'


class ldap():
    title = '//h3[@class="ix-formtitle" and text()="LDAP"]'
    hostname_Input = '//ix-chips[@formcontrolname="hostname"]//input'
    basedn_Input = '//ix-input[@formcontrolname="basedn"]//input'
    binddn_Input = '//ix-input[@formcontrolname="binddn"]//input'
    bindpw_Input = '//ix-input[@formcontrolname="bindpw"]//input'
    samba_Schema_Checkbox = '//ix-checkbox[@formcontrolname="has_samba_schema"]//mat-checkbox'
    encryption_Mode_Select = '//ix-select[@formcontrolname="ssl"]//mat-select'
    encryption_Mode_On_Option = '//mat-option[contains(.,"ON")]'


class lock_Dataset:
    title = '//h1[text()="Lock Dataset"]'
    force_Unmount_Checkbox = '//ix-checkbox[contains(.,"Force unmount")]'
    lock_Button = '//mat-dialog-container//button[contains(.,"Lock")]'


class login:
    user_Input = '//ix-input[@formcontrolname="username"]//input'
    password_Input = '//ix-input[@formcontrolname="password"]//input'
    signin_Button = '//button[contains(.,"Log In")]'
    ha_Status_Enable = '//p[text()="HA is enabled."]'


class network:
    title = '//h1[contains(.,"Network")]'
    global_Configuration_Title = '//h3[text()="Global Configuration"]'
    interface = '//mat-icon[@id="enp0s8"]'


class pool_manager:
    title = '//div[contains(.,"Pool Manager")]'
    name_Input = '//input[@id="pool-manager__name-input-field"]'
    first_Disk_Checkbox = '(//mat-checkbox[contains(@id,"pool-manager__disks-sd")])[1]'
    vdev_Add_Button = '//button[@id="vdev__add-button"]'
    force_Checkbox = '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]'
    create_Button = '//button[@name="create-button"]'
    create_Pool_Button = '//button[@ix-auto="button__CREATE POOL"]'
    create_Pool_Popup = '//h1[contains(.,"Create Pool")]'
    encryption_Checkbox = '//mat-checkbox[@id="pool-manager__encryption-checkbox"]'


class popup:
    smb_Restart_Title = '//h3[text()="Restart SMB Service"]'
    smb_Restart_Button = '//button[contains(*/text(),"Restart Service")]'
    smb_Start_Title = '//h1[text()="Start SMB Service"]'
    enable_Service_Title = '//h1[text()="Enable service"]'
    enable_Service_Button = '//button[contains(*/text(),"Enable Service")]'
    please_Wait = '//h6[contains(.,"Please wait")]'
    active_Directory = '//h1[text()="Active Directory"]'
    warning = '//h1[contains(.,"Warning")]'
    saving_Permissions = '//h1[text()="Saving Permissions"]'
    updatin_Acl = '//h1[text()="Updating ACL"]'
    setting_Ldap = '//h1[text()="Setting up LDAP"]'
    configuring = '//h1[contains(.,"Configuring...")]'
    installing = '//h1[contains(.,"Installing")]'


class progress:
    progressbar = '//mat-progress-bar'
    spinner = '//mat-spinner'


class services:
    title = '//h1[text()="Services"]'

    def service_Tr(serivce):
        return f'//tr[contains(.,"{serivce}")]'

    iscsi_Service = service_Tr('iSCSI')
    iscsi_Service_Button = iscsi_Service + BUTTON
    iscsi_Service_Checkbox = iscsi_Service + CHECKBOX
    iscsi_Service_Toggle = iscsi_Service + TOGGLE
    nfs_Service = service_Tr('NFS')
    nfs_Service_Button = nfs_Service + BUTTON
    nfs_Service_Checkbox = nfs_Service + CHECKBOX
    nfs_Service_Toggle = nfs_Service + TOGGLE
    smb_Service = service_Tr('SMB')
    smb_Service_Button = smb_Service + BUTTON
    smb_Service_Checkbox = smb_Service + CHECKBOX
    smb_Service_Toggle = smb_Service + TOGGLE
    ssh_Service = service_Tr('SSH')
    ssh_Service_Button = ssh_Service + BUTTON
    ssh_Service_Checkbox = ssh_Service + CHECKBOX
    ssh_Service_Toggle = ssh_Service + TOGGLE


class sharing:
    title = '//h1[text()="Sharing"]'
    smb_Panel_Title = '//a[contains(text(),"Windows (SMB) Shares")]'
    smb_Add_Button = '//span[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]'
    smb_Service_Status = '//span[contains(.,"Windows (SMB) Shares")]//span[contains(text(),"RUNNING")]'

    nfs_Panel_Title = '//a[contains(text(),"UNIX (NFS) Shares")]'
    nfs_Add_Button = '//span[contains(.,"UNIX (NFS) Shares")]//button[contains(.,"Add")]'
    nfs_Service_Status = '//span[contains(.,"UNIX (NFS) Shares")]//span[contains(text(),"RUNNING")]'

    iscsi_Wizard_Button = '//button[contains(.,"Wizard")]'
    iscsi_Burger_Button = '//span[contains(.,"Block (iSCSI) Shares Targets")]//button[contains(.,"more_vert")]'
    iscsi_Service_Status = '//span[contains(.,"Block (iSCSI) Shares Targets")]//span[contains(text(),"RUNNING")]'
    turn_On_Service_Button = '//button[contains(.,"Turn On Service")]'

    def smb_Share_Name(share_name):
        return f'//div[contains(text(),"{share_name}")]'


class side_Menu:
    """xpath for the menu on the left side"""
    dashboard = '//mat-list-item[@ix-auto="option__Dashboard"]'
    datasets = '//mat-list-item[@ix-auto="option__Datasets"]'
    shares = '//mat-list-item[@ix-auto="option__Shares"]'
    system_Setting = '//mat-list-item[@ix-auto="option__System Settings"]'
    advanced = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Advanced"]'
    services = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]'
    credentials = '//mat-list-item[@ix-auto="option__Credentials"]'
    local_Group = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]'
    local_User = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]'
    certificates = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]'
    directory_Services = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]'
    network = '//mat-list-item[@ix-auto="option__Network"]'
    storage = '//mat-list-item[@ix-auto="option__Storage"]'
    apps = '//mat-list-item[@ix-auto="option__Apps"]'


class smb:
    addTitle = '//h3[text()="Add SMB"]'
    description_Input = '//ix-input[@formcontrolname="comment"]//input'
    path_Input = '//ix-explorer[@formcontrolname="path"]//input'
    name_Input = '//ix-input[@formcontrolname="name"]//input'


class smb_Service:
    title = '//h1[contains(text(),"SMB")]'
    auxiliary_Parameters_Textarea = '//ix-textarea[@formcontrolname="smb_options"]//textarea'


class storage:
    title = '//h1[contains(text(),"Storage Dashboard")]'
    create_Pool_Button = '//a[contains(.,"Create Pool")]'
    disks_Button = '//a[*/text()=" Disks "]'
    encrypted_Pool = '//h2[text()="encrypted_pool"]'
    export_Disconnect_Button = '//ix-dashboard-pool[contains(.,"encrypted_pool")]//button[contains(.,"Export/Disconnect")]'

    def manage_Dataset_Button(pool_name):
        return f'//ix-dashboard-pool[contains(.,"{pool_name}")]//a[normalize-space(span/text())="Manage Datasets"]'


class systemDataset:
    title = '//h3[text()="System Dataset Pool" and @class="ix-formtitle"]'
    pool_Select = '//mat-select'

    def pool_Option(pool_name):
        return f'//mat-option[contains(.,"{pool_name}")]'


class toolbar:
    ha_Disabled = '//mat-icon[@data-mat-icon-name="ha_disabled"]'
    ha_Enabled = '//mat-icon[@data-mat-icon-name="ha_enabled"]'
    notification = '//mat-icon[normalize-space(text())="notifications"]'
    notification_Button = '//button[contains(.,"notifications")]'
    notification_Text = '//button[contains(.,"notifications")]//mat-icon/span'

    def notification_Count(text):
        return f'//span[contains(.,"notifications")]//span[contains(text(),"{text}")]'


class unlock_Dataset:
    title = '//h1[contains(.,"Unlock Datasets")]'
    dataset_Passphrase_Input = '//input[@ix-auto="input__Dataset Passphrase"]'
    unlock_Datasets_Message1 = '//p[contains(.,"These datasets will be unlocked with the provided credentials.")]'
    unlock_Datasets_Message2 = '//p[contains(.,"These datasets were successfully unlocked.")]'


class users:
    title = '//h1[text()="Users"]'
    eric_User = '//tr[contains(.,"ericbsd")]/td'
    eric_Edit_Button = '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]'
    eric_Allowed_Sudo_Commands = '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(.,"Allowed Sudo Commands:")]/../dd'
    root_User = '//tr[contains(.,"root")]/td'
    root_Edit_Button = '//tr[contains(.,"root")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]'
