def mat_Option(option):
    return f'//mat-option[contains(.,"{option}")]'


class active_Directory:
    title = '//h3[@class="ix-formtitle" and contains(text(),"Active Directory")]'
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
    title = '//h3[contains(text(),"Add Dataset")]'
    create_Smb_Checkbox = '//*[@data-test="checkbox-create-smb"]'
    name_Textarea = '//textarea[@data-test="textarea-name"]'
    share_Type_Select = '//mat-select[@data-test="select-share-type"]'
    share_Type_Select_Text = '//mat-select[@data-test="select-share-type"]//mat-select-trigger'
    share_Type_SMB_Option = '//mat-option[contains(.,"SMB")]'


class add_Group:
    title = '//h3[contains(.,"Add Group")]'
    edit_Title = '//h3[contains(.,"Edit Group")]'
    name_Input = '//ix-input[@formcontrolname="name"]//input'
    gid_Input = '//ix-input[@formcontrolname="gid"]//input'
    allow_Duplicate_Gid_Checkbox = '//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox'


class add_Kerberos_Keytab:
    title = '//h3[contains(text(),"Add Kerberos Keytab")]'
    name_Input = '//ix-input[@formcontrolname="name"]//input'
    file_input = '//ix-file-input[@formcontrolname="file"]//input'


class add_NFS:
    title = '//h3[contains(text(),"Add NFS Share")]'
    path_Input = '//ix-explorer[@formcontrolname="path"]//input'
    mapall_User_Combobox = '//ix-combobox[@formcontrolname="mapall_user"]//input'
    mapall_Group_Combobox = '//ix-combobox[@formcontrolname="mapall_group"]//input'


class add_User:
    authentication_Legend = '//legend[normalize-space(text())="Authentication"]'
    auxiliary_Groups_Select = '//*[@data-test="input-groups"]'
    bash_Shell_Option = '//mat-option[contains(.,"bash")]'
    confirm_Password_Input = '//ix-input[@formcontrolname="password_conf"]//input'
    create_Home_Directory_Checkbox = '//ix-checkbox[@formcontrolname="home_create"]//mat-checkbox'
    edit_Title = '//h3[contains(text(),"Edit User")]'
    email_Error_Message = '//div[contains(.,"Value must be a valid email address")]'
    email_Input = '//ix-input[@formcontrolname="email"]//input'
    ericbsd_Root_Chip = '//mat-chip-row[contains(.,"root")]'
    full_Name_Input = '//ix-input[@formcontrolname="full_name"]//input'
    games_Group_Option = '//mat-option[contains(.,"games")]'
    games_Is_Selected = '//mat-chip-row[contains(.,"games")]'
    home_Input = '//ix-explorer[@formcontrolname="home"]//input'
    home_Mode_Group_Exec_Checkbox = '//mat-checkbox[@data-test="checkbox-group-execute"]'
    home_Mode_Group_Read_Checkbox = '//mat-checkbox[@data-test="checkbox-group-read"]'
    home_Mode_Group_Write_Checkbox = '//mat-checkbox[@data-test="checkbox-group-write"]'
    home_Mode_Other_Exec_Checkbox = '//mat-checkbox[@data-test="checkbox-other-execute"]'
    home_Mode_Other_Read_Checkbox = '//mat-checkbox[@data-test="checkbox-other-read"]'
    home_Mode_Other_Write_Checkbox = '//mat-checkbox[@data-test="checkbox-other-write"]'
    home_Mode_Owner_Exec_Checkbox = '//mat-checkbox[@data-test="checkbox-user-execute"]'
    home_Mode_Owner_Read_Checkbox = '//mat-checkbox[@data-test="checkbox-user-write"]'
    home_Mode_Owner_Write_Checkbox = '//mat-checkbox[@data-test="checkbox-user-read"]'
    identification_Legend = '//legend[normalize-space(text())="Identification"]'
    password_Disabled_Slide = '//*[@data-test="toggle-password-disabled"]'
    password_Input = '//ix-input[@formcontrolname="password"]//input'
    qatest_Group_Option = '//mat-option[contains(.,"qatest")]'
    root_Group_Option = '//mat-option[contains(.,"root")]'
    samba_Authentication_Checkbox = '//*[@data-test="checkbox-smb"]'
    shell_Select = '//mat-select[@data-test="select-shell"]'
    ssh_Password_Enabled_Checkbox = '//*[@data-test="checkbox-ssh-password-enabled"]'
    ssh_Pubkey_Textarea = '//ix-textarea[@formcontrolname="sshpubkey"]//textarea'
    sudo_Checkbox = '//mat-checkbox[contains(.,"Allow all sudo commands")]'
    title = '//h3[contains(text(),"Add User")]'
    user_Id_And_Groups = '//legend[contains(text(),"User ID and Groups")]'
    username_Input = '//ix-input[@formcontrolname="username"]//input'
    wheel_Group_Option = '//mat-option[contains(.,"wheel")]'
    wheel_Is_Selected = '//mat-select[contains(.,"wheel")]'


class add_Zvol:
    title = '//h3[contains(text(),"Add Zvol")]'
    name_Input = '//ix-input[@formcontrolname="name"]//input'
    size_Input = '//ix-input[@formcontrolname="volsize"]//input'


class advanced:
    title = '//h1[contains(.,"Advanced")]'
    system_Dataset_Pool_Card = '//h3[contains(text(),"Storage")]'
    system_Dataset_Pool_Configure_Button = '//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]'

    @staticmethod
    def system_Dataset_Pool_Pool(pool_name: str) -> str:
        return f'//div[contains(.,"System Dataset Pool:")]//span[contains(text(),"{pool_name}")]'


class alert():
    title = '//h3[text()="Alerts"]'
    panel_Open = '//mat-sidenav[contains(.,"Alerts") and contains(@class,"mat-drawer-opened")]'
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
    done = '//*[@data-test="button-done"]'
    edit = '//button[contains(.,"Edit")]'
    save = '//button[normalize-space(span/text())="Save"]'
    settings = '//button[contains(.,"Settings")]'
    Continue = '//button[@data-test="button-dialog-confirm"]'
    CONTINUE = '//button[contains(*/text(),"CONTINUE")]'
    close = '//button[contains(.,"Close")]'
    CLOSE = '//button[contains(.,"CLOSE")]'
    close_Icon = '//ix-icon[@id="ix-close-icon"]'
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
    reload_Now = '//button[@data-test="button-dialog-confirm"]'
    dialog_Cancel = '//button[@data-test="button-dialog-cancel"]'
    save_changes = '//*[@data-test="button-save-changes"]'


class certificates:
    title = '//h1[text()="Certificates"]'
    csr_Card_Title = '//h3[contains(text(),"Certificate Signing Requests")]'
    csr_Add_Button = '//mat-card[contains(.,"Certificate Signing Requests")]//button[contains(.,"Add")]'
    csr_Title = ''

    def next_Button(name):
        return f'//div[contains(.,"{name}") and contains(@class,"mat-step")]//button[@data-test="button-next"]'

    identifier_Next_Button = next_Button('Identifier and Type')
    cert_Options_Next_Button = next_Button('Certificate Options')
    cert_Subject_Next_Button = next_Button('Certificate Subject')
    import_Certificate_Next_Button = '(//div[contains(.,"Import Certificate") and contains(@class,"mat-step")]//button[@data-test="button-next"])[2]'
    extra_Constraints_Next_Button = next_Button('Extra Constraints')
    key_Type_Select = '//mat-select[@data-test="select-key-type"]'
    key_Type_RSA_Option = '//mat-option[@data-test="option-key-type-rsa"]'
    state_Input = '//input[@data-test="input-state"]'
    locality_Input = '//input[@data-test="input-city"]'
    organization_Input = '//input[@data-test="input-organization"]'
    organizational_Unit_Input = '//input[@data-test="input-organizational-unit"]'
    email_Input = '//input[@data-test="input-email"]'
    common_Name_Input = '//input[@data-test="input-common"]'
    subject_Alternate_Names_Input = '//input[@data-test="input-san"]'

    extended_Key_Usage_Checkbox = '//mat-checkbox[contains(.,"Extended Key Usage")]'
    usages_Select = '//mat-select[@data-test="select-usages"]'
    usages_Any_Extended_Key_Usage_Option = '//mat-option[@data-test="option-usages-any-extended-key-usage"]'
    critical_Extension_Checkbox = '//mat-checkbox[contains(.,"Critical Extension")]'
    key_Usage_Checkbox = '//mat-checkbox[contains(.,"Key Usage") and not(contains(.,"Extended"))]'
    key_Usage_Config_Select = '//mat-select[@data-test="select-key-usage"]'
    Key_Usage_Config_Digital_Signature_Option = '//mat-option[@data-test="option-key-usage-digital-signature"]'
    type_select = '//mat-select[@data-test="select-create-type"]'
    type_Internal_CA_Option = '//mat-option[@data-test="option-create-type-internal-ca"]'
    type_Internal_Certificate_Option = '//mat-option[@data-test="option-create-type-internal-certificate"]'
    signing_Certificate_Authority_Select = '//mat-select[@data-test="select-signedby"]'
    ca1_Delete_Button = '//tr[contains(.,"ca1")]//button[@data-test="button-table-delete"]'
    csr1_Delete_Button = '//tr[contains(.,"csr1")]//button[@data-test="button-table-delete"]'
    cert1_Delete_Button = '//tr[contains(.,"cert1")]//button[@data-test="button-table-delete"]'


class checkbox:
    enabled = '//*[@data-test="checkbox-enabled"]'
    enable = '//ix-checkbox[@formcontrolname="enable"]//mat-checkbox'
    old_Confirm = '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]'
    new_Confirm = '//mat-checkbox[@data-test="checkbox-confirm"]'
    confirm = '//ix-checkbox[@formcontrolname="confirm"]//mat-checkbox'
    sudo = '//ix-checkbox[@formcontrolname="sudo_commands_all"]//mat-checkbox'
    force = '//ix-checkbox[@formcontrolname="force"]//mat-checkbox'


class chosse_Pool_For_App:
    title = '//h1[contains(.,"Choose a pool for Apps")]'
    pool_Select = '//ix-select[@formcontrolname="pool"]//mat-select'
    tank_Pool_Option = '//mat-option[contains(.,"tank")]'


class common_Input():
    def get_Input(input_name):
        return f'//*[@data-test="input-{input_name}"]'

    name = get_Input('name')


class dashboard:
    title = '//h1[contains(.,"Dashboard")]'
    system_Info_Card_Title = '//span[text()="System Information"]'
    help_Card_Title = '//*[text()="TrueNAS Help"]'
    system_Information_Standby_Title = '//span[contains(.,"System Information Standby")]'


class dataset:
    title = '//h1[text()="Datasets"]'
    add_Dataset_Button = '//button[contains(*/text(),"Add Dataset")]'
    permission_Title = '//h3[contains(text(),"Permissions")]'
    permission_Edit_Button = '//*[@data-test="button-edit-permissions"]'
    add_Zvol_Button = '//button[normalize-space(span/text())="Add Zvol"]'
    zfs_Encryption_Title = '//h3[contains(text(),"ZFS Encryption")]'
    zfs_Encryption_Edit_button = '//mat-card-header[contains(.,"ZFS Encryption")]//a[normalize-space(*/text())="Edit"]'
    lock_Button = '//button[contains(.,"Lock")]'
    unlock_Button = '//a[contains(.,"Unlock")]'
    lock_Pool_Icon = '//ix-dataset-node[contains(.,"encrypted_pool")]//ix-icon[@fonticon="mdi-lock"]'
    unlock_Pool_Icon = '//ix-dataset-node[contains(.,"encrypted_pool")]//ix-icon[@fonticon="mdi-lock-open-variant"]'
    return_To_Pool_List_Button = '//button[contains(.,"Return to pool list")]'

    @staticmethod
    def pool_Tree_Name(pool_name: str) -> str:
        return f'//span[text()=" {pool_name} " and contains(@class,"name")]'

    @staticmethod
    def pool_Selected(pool_name: str) -> str:
        return f'//span[text()="{pool_name}" and contains(@class,"own-name")]'

    @staticmethod
    def pool_Tree(pool_name: str) -> str:
        return f'//ix-dataset-node[contains(.,"{pool_name}")]/div'

    def dataset_Name(dataset_name):
        return f'//span[contains(text(),"{dataset_name}")]'

    def dataset_Tree(dataset_name):
        return f'//ix-dataset-node[contains(.,"{dataset_name}")]/div'

    def dataset_expand(pool_name, dataset_name):
        return f'//*[@data-test="button-toggle-row-{pool_name}-{dataset_name}"]'

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
    directory_Disable_Title = '//h3[contains(text(),"Active Directory and LDAP are disabled.")]'
    configure_AD_Button = '//button[contains(.,"Configure Active Directory")]'
    configure_Ldap_Button = '//button[contains(.,"Configure LDAP")]'
    show_Button = '//button[contains(*/text(),"Show")]'
    warning_Dialog = '//h1[text()="Warning"]'
    delete_AD03_Realm_Button = '//tr[contains(.,"AD03")]//button'
    delete_Dialog = '//h1[text()="Delete"]'
    delete_Confirm_Checkbox = '//mat-checkbox[@name="confirm_checkbox"]'
    delete_Confirm_Button = '//button[@id="confirm-dialog__action-button"]'
    delete_AD_Account_Button = '//tr[contains(.,"AD_MACHINE_ACCOUNT")]//button'
    ldap_Card_Title = '//mat-card//h3[contains(text(),"LDAP")]'
    service_Status = '//span[contains(.,"Status:") and contains(.,"HEALTHY")]'
    kerberos_Keytab_Add_Button = '//button[@data-test="button-add-kerberos-keytabs"]'

    def ldap_Hostname(hostname):
        return f'//span[contains(.,"Hostname:") and contains(.,"{hostname}")]'

    def ad_Domain(domain):
        return f'//span[contains(.,"Domain Name:") and contains(.,"{domain}")]'


class disks:
    title = '//h1[text()="Disks"]'
    all_Disk = '//div[contains(text(),"sd")]'
    wipe_Button = '//mat-dialog-container//button[contains(.,"Wipe")]'

    def disk_Expander(disk):
        return f'//tr[@data-test="row-{disk}"]/td[2]'

    def wipe_Disk_Button(disk):
        return f'//button[@data-test="button-{disk}-wipe"]'

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
    builtin_Users_Cancel = '//div[contains(.,"Group - builtin_users") and contains(@class,"ace")]//ix-icon[text()="cancel"]'
    builtin_Administrators_Cancel = '//div[contains(.,"Group - builtin_administrators") and contains(@class,"ace")]//ix-icon[text()="cancel"]'
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
    user_Combobox = '//*[@data-test="input-uid"]'
    user_Apply_Checkbox = '//*[@data-test="checkbox-apply-user"]'
    group_Combobox = '//*[@data-test="input-gid"]'
    group_Apply_Checkbox = '//*[@data-test="checkbox-apply-group"]'


class error:
    def message_Text(message):
        return f'//mat-error[contains(.,"{message}")]'


class export_Disconnect_Pool:
    title = '//h1[contains(text(),"Export/disconnect pool")]'
    destroy_Checkbox = '//ix-checkbox[@formcontrolname="destroy"]//mat-checkbox'
    confirm_Checkbox = '//ix-checkbox[@formcontrolname="confirm"]//mat-checkbox'
    pool_Name_Input = '//ix-input[@formcontrolname="nameInput"]//input'
    export_Disconnect_Button = '//mat-dialog-container//button[contains(.,"Export/Disconnect")]'


class general:
    title = '//h1[contains(text(),"General")]'
    support_title = '//h3[contains(text(),"Support")]'
    license_dialog_title = '//h3[contains(.,"License")]'
    add_licence_button = '//*[@data-test="button-set-license"]'


class global_Configuration:
    title = '//h3[contains(text(),"Edit Global Configuration")]'
    nameserver1_Input = '//ix-input[contains(.,"Nameserver 1")]//input'
    nameserver2_Input = '//ix-input[contains(.,"Nameserver 2")]//input'
    nameserver3_Input = '//ix-input[contains(.,"Nameserver 3")]//input'
    nameserver1_Delete = '//ix-input[contains(.,"Nameserver 1")]//ix-icon[@fonticon="mdi-close-circle"]'
    nameserver2_Delete = '//ix-input[contains(.,"Nameserver 2")]//ix-icon[@fonticon="mdi-close-circle"]'
    nameserver3_Delete = '//ix-input[contains(.,"Nameserver 3")]//ix-icon[@fonticon="mdi-close-circle"]'
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
    critical_Checkbox = '//mat-checkbox[contains(.,"Critical")]'
    failover_Group_Select = '//ix-select[@formcontrolname="failover_group"]//mat-select'
    failover_Group_Option = '//mat-option[@id="mat-option-1"]'
    failover_Group_Selected = '//ix-select[@formcontrolname="failover_group"]//mat-select//span[contains(.,"1")]'
    add_Allias_Button = '//button[@data-test="button-add-item-aliases"]'
    ip_Address_Input = '//ix-ip-input-with-netmask//input'
    failover_Address_Input = '//ix-input[@formcontrolname="failover_address"]//input'
    failover_Virtual_Address = '//ix-input[@formcontrolname="failover_virtual_address"]//input'
    netmask_Select = '//ix-ip-input-with-netmask//mat-select'

    def netmask_Option(number):
        return f'//mat-option[contains(.,"{number}")]'


class iscsi:
    title = '//h1[text()="iSCSI"]'
    protals_Tab = '//a[@data-test="link-portals"]'
    targets_Tab = '//a[@data-test="link-targets"]'
    extents_Tab = '//a[@data-test="link-extents"]'
    iscsitest1_Text = '//div[contains(.,"iscsitest1")]'


class iscsi_Wizard:
    """iscsi_Wizard contains xpaths for the iSCSI Wizard"""
    title = '//h3[contains(text(),"iSCSI Wizard")]'
    block_Device_Title = '//mat-step-header[contains(.,"Create or Choose Block Device") and @tabindex="0"]'
    device_Name_Input = '//input[@data-test="input-name"]'
    extent_Type_Select = '//mat-select[@data-test="select-type"]'
    extent_Type_Device_Option = mat_Option('Device')
    device_Dropdown = '//mat-select[@data-test="select-disk"]'
    create_New_Button = '//mat-option[@data-test="option-disk-create-new"]'
    pool_Dataset_Input = '//input[@data-test="input-dataset"]'
    size_Input = '//input[@data-test="input-volsize"]'
    size_Select_Contain_GiB = '//mat-select[contains(.,"GiB")]'
    block_Device_Next_Button = '(//button[@data-test="button-next"])[1]'
    portal_Title = '//mat-step-header[contains(.,"Portal") and @tabindex="0"]'
    portal_Select = '//mat-select[@data-test="select-portal"]'
    create_New_Option = '//mat-option[@data-test="option-portal-create-new"]'
    discovery_Authentication_Method_Select = '//mat-select[@data-test="select-discovery-authmethod"]'
    none_Option = mat_Option('NONE')
    add_Ip_Address_Button = '//button[@data-test="button-add-item-ip-address"]'
    ip_Address_Select = '//mat-select[@data-test="select"]'
    zero_Ip_Option = mat_Option('0.0.0.0')
    portal_Next_Button = '(//button[@data-test="button-next"])[2]'
    initiator_Title = '//mat-step-header[contains(.,"Initiator") and @tabindex="0"]'
    initiator_Input = '//input[@data-test="input-initiators"]'
    initiator_Next_Button = '(//button[@data-test="button-save"])[2]'
    confirm_Options_Title = '//mat-step-header[contains(.,"Confirm Options") and @tabindex="0"]'
    iscsi_Summary = '//div[contains(text(),"iSCSI Summary")]'
    summary_Name = '//div[contains(text(),"Name: iscsitest1")]'
    extent_new_Device = '//div[contains(text(),"New Device: tank/iscsitest1(1 G)")]'
    portal_listen = '//div[contains(text(),"Listen: 0.0.0.0")]'


class ldap():
    title = '//h3[@class="ix-formtitle" and contains(text(),"LDAP")]'
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
    global_Configuration_Title = '//h3[contains(text(),"Global Configuration")]'
    interface_Card_Title = '//h3[contains(.,"Interfaces")]'
    test_Changes_Button = '//*[@data-test="button-test-changes"]'
    test_Changes_Dialog_Title = '//h1[contains(text(),"Test Changes")]'

    def interface_Row(interface: str) -> str:
        return f'//td[contains(.,"{interface}")]'

    def interface_Edit_Button(interface: str) -> str:
        return f'//*[@data-test="button-interface-{interface}-edit-row-action"]'


class pool_manager:
    title = '//div[contains(.,"Pool Manager")]'
    name_Input = '//input[@id="pool-manager__name-input-field"]'
    first_Disk_Checkbox = '(//mat-checkbox[contains(@id,"pool-manager__disks-sd")])[1]'
    vdev_Add_Button = '//button[@id="vdev__add-button"]'
    force_Checkbox = '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]'
    create_Button = '//button[@name="create-button"]'
    create_Pool_Button = '//button[@data-test="button-dialog-confirm"]'
    create_Pool_Popup = '//h1[contains(.,"Create Pool")]'
    encryption_Checkbox = '//mat-checkbox[@id="pool-manager__encryption-checkbox"]'


class popup:
    smb_Restart_Title = '//h3[contains(text(),"Restart SMB Service")]'
    restart_Service_Button = '//button[contains(*/text(),"Restart Service")]'
    smb_Start_Title = '//h1[text()="Start SMB Service"]'
    nfs_Start_Title = '//h1[text()="Start NFS Service"]'
    iscsi_Start_Title = '//h1[text()="Start iSCSI Service"]'
    # data-test is not proper but work since it is the only one like that in the UI.
    enable_Service_To_Start_Automatically_Checkbox = '//mat-checkbox[@data-test="checkbox"]'
    enable_Service_Title = '//h1[text()="Enable service"]'
    enable_Service_Button = '//button[contains(*/text(),"Enable Service")]'
    start_Service_Button = '//button[contains(*/text(),"Start")]'
    license_Agrement_Title = '//h1[contains(.,"End User License Agreement - TrueNAS")]'
    please_Wait = '//h6[contains(.,"Please wait")]'
    active_Directory = '//h1[text()="Active Directory"]'
    warning = '//h1[contains(.,"Warning")]'
    saving_Permissions = '//h1[text()="Saving Permissions"]'
    updating_Acl = '//h1[text()="Updating ACL"]'
    setting_Ldap = '//h1[text()="Setting up LDAP"]'
    configuring = '//h1[contains(.,"Configuring...")]'
    installing = '//h1[contains(.,"Installing")]'
    deleting = '//*[contains(.,"Deleting")]'
    save_changes = '//h1[contains(.,"Save Changes")]'


class progress:
    progressbar = '//mat-progress-bar'
    spinner = '//mat-spinner'
    progress_Spinner = '//mat-progress-spinner'


class services:
    title = '//h1[text()="Services"]'

    def service_Tr(serivce):
        return f'//tr[contains(.,"{serivce}")]'

    def service_autostart(serivce: str) -> str:
        return f'//*[@data-test="toggle-start-automatically-service-{serivce}-row-toggle"]'

    def service_edit_button(serivce: str) -> str:
        return f'//*[@data-test="button-service-{serivce}-edit-row-action"]'

    def service_running(serivce: str) -> str:
        return f'//*[@data-test="toggle-running-service-{serivce}-row-toggle"]'

    iscsi_Service = service_Tr('iSCSI')
    iscsi_edit_button = service_edit_button('iscsi')
    iscsi_autostart_toggle = service_autostart('iscsi')
    iscsi_running_toggle = service_running('iscsi')
    nfs_Service = service_Tr('NFS')
    nfs_edit_button = service_edit_button('nfs')
    nfs_autostart_toggle = service_autostart('nfs')
    nfs_running_toggle = service_running('nfs')
    smb_Service = service_Tr('SMB')
    smb_edit_button = service_edit_button('smb')
    smb_autostart_toggle = service_autostart('smb')
    smb_running_toggle = service_running('smb')
    ssh_Service = service_Tr('SSH')
    ssh_edit_button = service_edit_button('ssh')
    ssh_autostart_toggle = service_autostart('ssh')
    ssh_running_toggle = service_running('ssh')


class sharing:
    title = '//h1[text()="Shares"]'
    smb_Panel_Title = '//h3[contains(text(),"Windows (SMB) Shares")]'
    smb_Add_Button = '//*[@data-test="button-smb-share-add"]'
    smb_Service_Status = '//mat-toolbar-row[contains(.,"Windows (SMB) Shares")]//span[contains(text(),"RUNNING")]'

    nfs_Panel_Title = '//h3[contains(text(),"UNIX (NFS) Shares")]'
    nfs_Add_Button = '//*[@data-test="button-nfs-share-add"]'
    nfs_Service_Status = '//mat-toolbar-row[contains(.,"UNIX (NFS) Shares")]//span[contains(text(),"RUNNING")]'

    iscsi_Wizard_Button = '//*[@data-test="button-iscsi-share-wizard"]'
    iscsi_Configure_Button = '//*[@data-test="button-iscsi-share-configure"]'
    iscsi_Burger_Button = '//mat-toolbar-row[contains(.,"Block (iSCSI) Shares Targets")]//button[contains(.,"more_vert")]'
    iscsi_Service_Status = '//mat-toolbar-row[contains(.,"Block (iSCSI) Shares Targets")]//span[contains(text(),"RUNNING")]'
    turn_On_Service_Button = '//button[contains(.,"Turn On Service")]'

    def smb_Share_Name(share_name):
        return f'//*[normalize-space(text())="{share_name}"]'


class side_Menu:
    def menu_Anchor(menu_Item):
        return f'//a[@name="{menu_Item}-menu"]'

    def submenu_Anchor(menu_Item):
        return f'//div[contains(@class,"lidein-nav-md")]//a[normalize-space(text())="{menu_Item}"]'

    """xpath for the menu on the left side"""
    dashboard = menu_Anchor('Dashboard')
    old_dashboard = menu_Anchor('Dashboard_(old)')
    storage = menu_Anchor('Storage')
    datasets = menu_Anchor('Datasets')
    shares = menu_Anchor('Shares')
    network = menu_Anchor('Network')
    credentials = menu_Anchor('Credentials')
    local_User = submenu_Anchor('Local Users')
    local_Group = submenu_Anchor('Local Groups')
    certificates = submenu_Anchor('Certificates')
    directory_Services = submenu_Anchor('Directory Services')
    apps = menu_Anchor('Apps')
    system_Setting = menu_Anchor('System')
    general = submenu_Anchor('General Settings')
    advanced = submenu_Anchor('Advanced Settings')
    failover = submenu_Anchor('Failover')
    services = submenu_Anchor('Services')


class smb:
    addTitle = '//h3[contains(text(),"Add SMB")]'
    description_Input = '//ix-input[@formcontrolname="comment"]//input'
    path_Input = '//ix-explorer[@formcontrolname="path"]//input'
    name_Input = '//ix-input[@formcontrolname="name"]//input'


class smb_Service:
    title = '//h1[contains(text(),"SMB")]'
    auxiliary_Parameters_Textarea = '//ix-textarea[@formcontrolname="smb_options"]//textarea'


class storage:
    title = '//h1[contains(text(),"Storage Dashboard")]'
    create_Pool_Button = '//*[@data-test="link-create-pool-legacy"]'
    disks_Button = '//a[*/text()=" Disks "]'
    encrypted_Pool = '//h2[text()="encrypted_pool"]'
    export_Disconnect_Button = '//ix-dashboard-pool[contains(.,"encrypted_pool")]//button[contains(.,"Export/Disconnect")]'

    def manage_Dataset_Button(pool_name):
        return f'//ix-dashboard-pool[contains(.,"{pool_name}")]//a[normalize-space(span/text())="Manage Datasets"]'


class system_Dataset:
    title = '//h3[contains(text(),"Storage Settings")]'
    pool_Select = '//mat-select[@data-test="select-pool"]'

    def pool_Option(pool_name):
        return f'//mat-option[contains(.,"{pool_name}")]'


class toolbar:
    ha_Disabled = '//ix-icon[@data-mat-icon-name="ha_disabled"]'
    ha_Enabled = '//ix-icon[@data-mat-icon-name="ha_enabled"]'
    notification = '//ix-icon[normalize-space(text())="notifications"]'
    notification_Button = '//button[contains(.,"notifications")]'
    notification_Text = '//button[contains(.,"notifications")]//span[@class="mat-badge-content mat-badge-active"]'

    def notification_Count(text):
        return f'//span[contains(.,"notifications")]//span[contains(text(),"{text}")]'


class unlock_Dataset:
    title = '//h1[contains(.,"Unlock Datasets")]'
    dataset_Passphrase_Input = '//input[@data-test="input-passphrase"]'
    unlock_Datasets_Message1 = '//p[contains(.,"These datasets will be unlocked with the provided credentials.")]'
    unlock_Datasets_Message2 = '//p[contains(.,"These datasets were successfully unlocked.")]'


class users:
    title = '//h1[text()="Users"]'
    eric_User = '//tr[contains(.,"ericbsd")]/td'
    eric_Edit_Button = '//button[@data-test="button-edit-ericbsd"]'
    eric_Allowed_Sudo_Commands = '//tr[contains(.,"ericbsd")]/following-sibling::tr//dt[contains(.,"Allowed Sudo Commands:")]/../dd'
    root_User = '//tr[contains(.,"root")]/td'
    root_Edit_Button = '//button[@data-test="button-edit-root"]'
    user_Bash_Shell = '//dd[contains(.,"/usr/bin/bash")]'
    eric_Home_Directory = '//tr[contains(.,"ericbsd")]/following-sibling::tr//dt[contains(text(),"Home Directory")]'
    eric_Home_Directory_Text = '//tr[contains(.,"ericbsd")]/following-sibling::tr//dd[contains(text(),"/mnt/tank/ericbsd")]'
    eric_Password_Disable = '//tr[contains(.,"ericbsd")]/following-sibling::tr//dt[contains(.,"Password Disabled:")]'
    eric_Password_Disable_Text = '//tr[contains(.,"ericbsd")]/following-sibling::tr//dt[contains(.,"Password Disabled:")]/../dd'
