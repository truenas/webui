
class active_directory:
    title = '//h3[@class="ix-formtitle" and text()="Active Directory"]'
    enableCheckbox = '//ix-checkbox[@formcontrolname="enable"]//mat-checkbox'
    domain_input = '//ix-input[@formcontrolname="domainname"]//input'
    account_input = '//ix-input[@formcontrolname="bindname"]//input'
    password_input = '//ix-input[@formcontrolname="bindpw"]//input'
    ca_ou_input = '//ix-input[@formcontrolname="createcomputer"]//input'
    netbiosname_input = '//ix-input[@formcontrolname="netbiosname"]//input'


class addCatalog:
    title = '//h3[text()="Add Catalog"]'
    catalogName_input = '//ix-input[@formcontrolname="label"]//input'
    repository_input = '//ix-input[@formcontrolname="repository"]//input'
    train_input = '//ix-chips[@formcontrolname="preferred_trains"]//input'
    branch_input = '//ix-input[@formcontrolname="branch"]//input'


class addDataset:
    title = '//h3[text()="Add Dataset"]'
    name_textarea = '//div[@id="name"]//textarea'
    select_share_type = '//mat-select[@ix-auto="select__Share Type"]'
    shareTypeSMB_option = '//mat-option[@ix-auto="option__Share Type_SMB"]'


class addGroup:
    title = '//h3[contains(.,"Add Group")]'
    edit_title = '//h3[contains(.,"Edit Group")]'
    name_input = '//ix-input[@formcontrolname="name"]//input'
    gid_input = '//ix-input[@formcontrolname="gid"]//input'
    allowDuplicateGid_checkbox = '//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox'


class addKerberosKeytab:
    title = '//h3[text()="Add Kerberos Keytab"]'
    name_input = '//ix-input[@formcontrolname="name"]//input'
    file_input = '//ix-file-input[@formcontrolname="file"]//input'


class addUser:
    title = '//h3[text()="Add User"]'
    edit_title = '//h3[text()="Edit User"]'
    fullName_input = '//ix-input[@formcontrolname="full_name"]//input'
    username_input = '//ix-input[@formcontrolname="username"]//input'
    password_input = '//ix-input[@formcontrolname="password"]//input'
    confirm_password_input = '//ix-input[@formcontrolname="password_conf"]//input'
    select_shell = '//ix-combobox[@formcontrolname="shell"]//input'
    shell_option = '//mat-option[contains(.,"bash")]'
    sudo_checkbox = '//mat-checkbox[contains(.,"Permit Sudo")]'
    email_input = '//ix-input[@formcontrolname="email"]//input'
    auxiliaryGroups_select = '//ix-select[@formcontrolname="groups"]//mat-select'
    rootGroup_option = '//mat-option[contains(.,"root")]'
    wheelGroup_option = '//mat-option[contains(.,"wheel")]'
    qatestGroup_option = '//mat-option[contains(.,"qatest")]'
    home_input = '//ix-explorer[@formcontrolname="home"]//input'
    password_disabled_slide = '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle'
    home_mode_ownerWrite_checkbox = '(//tr[contains(.,"User")]//mat-checkbox)[1]'
    home_mode_ownerRead_checkbox = '(//tr[contains(.,"User")]//mat-checkbox)[2]'
    home_mode_ownerExec_checkbox = '(//tr[contains(.,"User")]//mat-checkbox)[3]'
    home_mode_groupRead_checkbox = '(//tr[contains(.,"Group")]//mat-checkbox)[1]'
    home_mode_groupWrite_checkbox = '(//tr[contains(.,"Group")]//mat-checkbox)[2]'
    home_mode_groupExec_checkbox = '(//tr[contains(.,"Group")]//mat-checkbox)[3]'
    home_mode_otherRead_checkbox = '(//tr[contains(.,"Other")]//mat-checkbox)[1]'
    home_mode_otherWrite_checkbox = '(//tr[contains(.,"Other")]//mat-checkbox)[2]'
    home_mode_otherExec_checkbox = '(//tr[contains(.,"Other")]//mat-checkbox)[3]'
    sshpubkey_textarea = '//ix-textarea[@formcontrolname="sshpubkey"]//textarea'


class addZvol:
    title = '//h3[text()="Add Zvol"]'
    name_input = '//ix-input[@formcontrolname="name"]//input'
    size_input = '//ix-input[@formcontrolname="volsize"]//input'


class advanced:
    title = '//h1[contains(.,"Advanced")]'
    systemDatasetPool_card = '//h3[text()="System Dataset Pool"]'
    systemDatasetPool_configure_button = '//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]'

    def system_datasetPool_pool(pool_name):
        return f'//div[contains(.,"System Dataset Pool:")]//span[contains(text(),"{pool_name}")]'


class applications:
    title = '//h1[text()="Applications"]'
    availableApplications_tab = '//div[contains(text(),"Available Applications")]'
    manageCatalogs_tab = '//div[contains(text(),"Manage Catalogs")]'

    def card(app_name):
        return f'//mat-card[contains(.,"{app_name}")]'

    def install_button(app_name):
        return f'//mat-card[contains(.,"{app_name}")]//span[contains(.,"Install")]'


class appSetup:
    appName_input = '//ix-input[contains(.,"Application Name")]//input'
    password_input = '//ix-input[contains(.,"Password for WebUI")]//input'
    certificate_select = '//ix-select[contains(.,"Certificate")]//mat-select//div'
    truenasCertificate_option = '//mat-option[contains(.,"truenas_default")]'
    rootUser_input = '//ix-input[contains(.,"Root User")]//input'
    rootPassword_input = '//ix-input[contains(.,"Root Password")]//input'
    enableFlax_checkbox = '//ix-checkbox[contains(.,"Enable Flax")]//mat-checkbox'

    imageRepository_input = '//ix-input[contains(.,"Image repository")]//input'
    imageTag_input = '//ix-input[contains(.,"Image Tag")]//input'
    addPortForwading_button = '//ix-fieldset[contains(.,"Port Forwarding")]//button'
    containerPort_input = '//ix-input[contains(.,"Container Port")]//input'
    nodePort_input = '//ix-input[contains(.,"Node Port")]//input'
    containerPort2_input = '(//ix-input[contains(.,"Container Port")]//input)[2]'
    nodePort2_input = '(//ix-input[contains(.,"Node Port")]//input)[2]'

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
    close_icon = '//mat-icon[@id="ix-close-icon"]'
    advanced_option = '//button[contains(*/text(),"Advanced Options")]'
    advanced_settings = '//button[contains(.,"Advanced Settings")]'
    ok = '//button[@name="ok_button"]'
    power = '//button[@name="Power"]'
    restart = '//button[@name="power-restart"]'
    unsetPool = '//button[contains(.,"Unset Pool")]'
    unset = '//button[contains(.,"Unset")]'
    chossePool = '//button[contains(.,"Choose Pool")]'
    addCatalog = '//button[contains(.,"Add Catalog")]'
    launchDockerImage = '//span[contains(.,"Launch Docker Image")]'
    Initiate_Failover = '//button[contains(*/text(),"Initiate Failover") and contains(@class,"mat-default")]'
    Leave_Domain = '//button[contains(.,"Leave Domain")]'


class certificates:
    title = '//h1[text()="Certificates"]'
    csrCard_title = '//h3[contains(text(),"Certificate Signing Requests")]'
    csrAdd_button = '//mat-card[contains(.,"Certificate Signing Requests")]//button[contains(.,"Add")]'
    csr_title = ''
    email_input = '//input[@ix-auto="input__Email"]'


class checkbox:
    enabled = '//ix-checkbox[@formcontrolname="enabled"]//mat-checkbox'
    enable = '//ix-checkbox[@formcontrolname="enable"]//mat-checkbox'
    old_confirm = '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]'
    confirm = '//ix-checkbox[@formcontrolname="confirm"]//mat-checkbox'
    sudo = '//ix-checkbox[@formcontrolname="sudo"]//mat-checkbox'
    force = '//ix-checkbox[@formcontrolname="force"]//mat-checkbox'


class chossePoolForApp:
    title = '//h1[contains(.,"Choose a pool for Apps")]'
    pool_select = '//ix-select[@formcontrolname="pool"]//mat-select'
    tankPool_option = '//mat-option[contains(.,"tank")]'


class dashboard:
    title = '//h1[contains(.,"Dashboard")]'
    systemInfoCardTitle = '//span[text()="System Information"]'
    System_Information_Standby_Title = '//span[contains(.,"System Information Standby")]'


class dataset:
    title = '//h1[text()="Datasets"]'
    add_dataset_button = '//button[contains(*/text(),"Add Dataset")]'
    permission_tile = '//h3[text()="Permissions"]'
    permission_edit_button = '//mat-card-header[contains(.,"Permissions")]//a[normalize-space(*/text())="Edit"]'
    addZvol_button = '//button[normalize-space(span/text())="Add Zvol (New)"]'
    zfsEncryption_title = '//h3[text()="ZFS Encryption"]'
    zfsEncryption_edit_button = '//mat-card-header[contains(.,"ZFS Encryption")]//a[normalize-space(*/text())="Edit"]'
    lock_button = '//button[contains(.,"Lock")]'
    unlock_button = '//a[contains(.,"Unlock")]'
    lockPool_icon = '//ix-dataset-node[contains(.,"encrypted_pool")]//mat-icon[@fonticon="mdi-lock"]'
    unlockPool_icon = '//ix-dataset-node[contains(.,"encrypted_pool")]//mat-icon[@fonticon="mdi-lock-open-variant"]'

    def pool_tree_name(pool_name):
        return f'//span[text()=" {pool_name} " and contains(@class,"name")]'

    def pool_selected(pool_name):
        return f'//span[text()="{pool_name}" and contains(@class,"own-name")]'

    def pool_tree(pool_name):
        return f'//ix-dataset-node[contains(.,"{pool_name}")]/div'

    def dataset_name(dataset_name):
        return f'//span[contains(text(),"{dataset_name}")]'

    def dataset_tree(dataset_name):
        return f'//ix-dataset-node[contains(.,"{dataset_name}")]/div'

    def permissionAtOwner(user_name):
        return f'//div[text()="owner@ - {user_name}"]'

    def permissionAtGroup(group_name):
        return f'//div[text()="group@ - {group_name}"]'

    def permissionUser(user_name):
        return f'//div[text()="User - {user_name}"]'


class deleteGroup:
    title = '//h1[text()="Delete Group"]'
    delete_button = '//mat-dialog-container//button[normalize-space(*/text())="Delete"]'


class directory_services:
    title = '//h1[text()="Directory Services"]'
    directory_disable_title = '//h3[text()="Active Directory and LDAP are disabled."]'
    configureAD_button = '//button[contains(.,"Configure Active Directory")]'
    configureLdap_button = '//button[contains(.,"Configure LDAP")]'
    showButton = '//button[contains(*/text(),"Show")]'
    warningDialog = '//h1[text()="Warning"]'
    deleteAD02RealmButton = '//tr[contains(.,"AD02")]//button'
    deleteDialog = '//h1[text()="Delete"]'
    deleteConfirmCheckbox = '//mat-checkbox[@name="confirm_checkbox"]'
    deleteConfirmButton = '//button[@id="confirm-dialog__action-button"]'
    deleteADAccountButton = '//tr[contains(.,"AD_MACHINE_ACCOUNT")]//button'
    ldapCard_title = '//mat-card//h3[text()="LDAP"]'
    ldapStatus = '//span[contains(.,"Status:") and contains(.,"HEALTHY")]'
    kerberosKeytabAdd_button = '//mat-card[contains(.,"Kerberos Keytab")]//span[contains(text(),"Add")]'

    def ldapHostname(hostname):
        return f'//span[contains(.,"Hostname:") and contains(.,"{hostname}")]'


class disks:
    title = '//h1[text()="Disks"]'
    all_disk = '//div[contains(text(),"sd")]'
    wipe_button = '//mat-dialog-container//button[contains(.,"Wipe")]'

    def disk_expander(disk):
        return f'//tr[@ix-auto="expander__{disk}"]/td[2]'

    def wipe_disk_button(disk):
        return f'//button[@ix-auto="button__WIPE_{disk}_{disk}"]'

    def confirm_box_title(disk):
        return f'//h1[contains(.,"Wipe Disk {disk}")]'


class editAcl:
    title = '//h1[text()="Edit ACL"]'
    owner_combobox = '//ix-combobox[@formcontrolname="owner"]//input'
    ownerApply_checkbox = '//mat-checkbox[contains(.,"Apply Owner")]'
    group_combobox = '//ix-combobox[@formcontrolname="ownerGroup"]//input'
    gourpApply_checkbox = '//mat-checkbox[contains(.,"Apply Group")]'
    saveAcl_button = '//button[contains(*/text(),"Save Access Control List")]'
    addItem_button = '//button[contains(.,"Add Item")]'
    who_select = '//ix-select[@formcontrolname="tag"]//mat-select'
    whoUser_option = '//mat-option[contains(.,"User")]'
    user_combobox = '//ix-combobox[@formcontrolname="user"]//input'
    builtinUsers_cancel = '//div[contains(.,"Group - builtin_users") and contains(@class,"ace")]//mat-icon[text()="cancel"]'
    builtinAdministrators_cancel = '//div[contains(.,"Group - builtin_administrators") and contains(@class,"ace")]//mat-icon[text()="cancel"]'
    recursive_checkbox = '//ix-checkbox[@formcontrolname="recursive"]//mat-checkbox'
    traverse_checkbox = '//ix-checkbox[@formcontrolname="traverse"]//mat-checkbox'

    def combobox_option(option):
        return f'//mat-option[contains(.,"{option}")]'

    def userInAcl(user_name):
        return f'//div[text()="User - {user_name}"]'


class editEncryption:
    title = '//h1[contains(.,"Edit Encryption Options")]'
    encryptionType_checkbox = '//ix-select[@formcontrolname="encryption_type"]//mat-select'
    encryptionType_passphrase_option = '//mat-option[contains(.,"Passphrase")]'
    passphrase_input = '//ix-input[@formcontrolname="passphrase"]//input'
    confirmPassphrase_input = '//ix-input[@formcontrolname="confirm_passphrase"]//input'
    confirm_checkbox = '//ix-checkbox[@formcontrolname="confirm"]//mat-checkbox'


class error:
    def message_text(message):
        return f'//mat-error[contains(.,"{message}")]'


class exportDisconnectPool:
    title = '//h1[contains(text(),"Export/disconnect pool")]'
    destroy_checkbox = '//ix-checkbox[@formcontrolname="destroy"]//mat-checkbox'
    confirm_checkbox = '//ix-checkbox[@formcontrolname="confirm"]//mat-checkbox'
    poolName_input = '//ix-input[@formcontrolname="nameInput"]//input'
    exportDisconnect_button = '//mat-dialog-container//button[contains(.,"Export/Disconnect")]'


class global_configuration:
    title = '//h3[text()="Edit Global Configuration"]'
    nameserver1_input = '//ix-input[contains(.,"Nameserver 1")]//input'
    nameserver2_input = '//ix-input[contains(.,"Nameserver 2")]//input'
    nameserver3_input = '//ix-input[contains(.,"Nameserver 3")]//input'
    nameserver1_delete = '//ix-input[contains(.,"Nameserver 1")]//mat-icon[@fonticon="mdi-close-circle"]'
    nameserver2_delete = '//ix-input[contains(.,"Nameserver 2")]//mat-icon[@fonticon="mdi-close-circle"]'
    nameserver3_delete = '//ix-input[contains(.,"Nameserver 3")]//mat-icon[@fonticon="mdi-close-circle"]'
    ipv4_defaultGateway_input = '//ix-input[contains(.,"IPv4 Default Gateway")]//input'
    hostname_input = '//ix-input[contains(.,"Hostname")]//input'


class groups:
    title = '//h1[contains(text(),"Groups")]'
    edit_button = '//button[contains(.,"Edit")]'
    qetest_name = '//div[contains(.,"qetest")]'
    qetest_expemnd = '//tr[contains(.,"qetest")]/td'
    qatest_name = '//div[contains(.,"qatest")]'
    qatest_expemnd = '//tr[contains(.,"qatest")]/td'
    gidtest_name = '//div[contains(.,"gidtest")]'
    gidtestdupe_name = '//div[contains(.,"gidtestdupe")]'
    gidtestdupe_expemnd = '//tr[contains(.,"gidtestdupe")]/td'


class interface:
    title = '//h3[contains(text(),"Edit Interface")]'
    dhcp_checkbox = '//mat-checkbox[contains(.,"DHCP")]'
    add_allias = '//div[@class="label-container" and contains(.,"Aliases")]//button'
    ipAddress_input = '//ix-ip-input-with-netmask//input'
    netmask_select = '//ix-ip-input-with-netmask//mat-select'
    netmask_option = '//mat-option[contains(.,"24")]'


class ldap():
    title = '//h3[@class="ix-formtitle" and text()="LDAP"]'
    hostname_input = '//ix-chips[@formcontrolname="hostname"]//input'
    basedn_input = '//ix-input[@formcontrolname="basedn"]//input'
    binddn_input = '//ix-input[@formcontrolname="binddn"]//input'
    bindpw_input = '//ix-input[@formcontrolname="bindpw"]//input'
    sambaSchema_checkbox = '//ix-checkbox[@formcontrolname="has_samba_schema"]//mat-checkbox'
    encryptionMode_select = '//ix-select[@formcontrolname="ssl"]//mat-select'
    encryptionModeOn_option = '//mat-option[contains(.,"ON")]'


class lockDataset:
    title = '//h1[text()="Lock Dataset"]'
    forceUnmount_checkbox = '//ix-checkbox[contains(.,"Force unmount")]'
    lock_button = '//mat-dialog-container//button[contains(.,"Lock")]'


class login:
    user_input = '//ix-input[@formcontrolname="username"]//input'
    password_input = '//ix-input[@formcontrolname="password"]//input'
    signin_button = '//button[contains(.,"Log In")]'
    HA_Status_Enable = '//p[text()="HA is enabled."]'


class network:
    title = '//h1[contains(.,"Network")]'
    global_configurationTitle = '//h3[text()="Global Configuration"]'
    interface = '//mat-icon[@id="enp0s8"]'


class pool_manager:
    title = '//div[contains(.,"Pool Manager")]'
    name_input = '//input[@id="pool-manager__name-input-field"]'
    firstDisk_checkbox = '(//mat-checkbox[contains(@id,"pool-manager__disks-sd")])[1]'
    vdevAdd_button = '//button[@id="vdev__add-button"]'
    force_checkbox = '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]'
    create_button = '//button[@name="create-button"]'
    create_pool_button = '//button[@ix-auto="button__CREATE POOL"]'
    create_pool_popup = '//h1[contains(.,"Create Pool")]'
    encryption_checkbox = '//mat-checkbox[@id="pool-manager__encryption-checkbox"]'


class popup:
    smbRestart_title = '//h3[text()="Restart SMB Service"]'
    smbRestart_button = '//button[contains(*/text(),"Restart Service")]'
    smbStart_title = '//h1[text()="Start SMB Service"]'
    enableService_button = '//button[contains(*/text(),"Enable Service")]'
    pleaseWait = '//h6[contains(.,"Please wait")]'
    active_directory = '//h1[text()="Active Directory"]'
    warning = '//h1[contains(.,"Warning")]'
    updatingAcl = '//h1[text()="Updating ACL"]'
    settingLdap = '//h1[text()="Setting up LDAP"]'
    configuring = '//h1[contains(.,"Configuring...")]'
    installing = '//h1[contains(.,"Installing")]'


class progress:
    progressbar = '//mat-progress-bar'
    spinner = '//mat-spinner'


class services:
    title = '//h1[text()="Services"]'
    smbtoggle = '//tr[contains(.,"SMB")]//mat-slide-toggle'
    smb_service_name = '//td[contains(text(),"SMB")]'
    smb_service_button = '//tr[contains(.,"SMB")]//button'
    sshService_toggle = '//tr[contains(.,"SSH")]//mat-slide-toggle'
    sshService_button = '//tr[contains(.,"SSH")]//button'
    sshService_name = '//td[contains(text(),"SSH")]'


class sideMenu:
    """xpath for the menu on the left side"""
    dashboard = '//mat-list-item[@ix-auto="option__Dashboard"]'
    datasets = '//mat-list-item[@ix-auto="option__Datasets"]'
    shares = '//mat-list-item[@ix-auto="option__Shares"]'
    systemSetting = '//mat-list-item[@ix-auto="option__System Settings"]'
    advanced = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Advanced"]'
    services = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]'
    credentials = '//mat-list-item[@ix-auto="option__Credentials"]'
    local_group = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]'
    local_user = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]'
    certificates = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]'
    directory_services = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]'
    network = '//mat-list-item[@ix-auto="option__Network"]'
    storage = '//mat-list-item[@ix-auto="option__Storage"]'
    apps = '//mat-list-item[@ix-auto="option__Apps"]'


class sharing:
    title = '//h1[text()="Sharing"]'
    smbPanelTitle = '//a[contains(text(),"Windows (SMB) Shares")]'
    smbAddButton = '//span[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]'
    smb_serviceStatus = '//span[contains(.,"Windows (SMB) Shares")]//span[contains(text(),"RUNNING")]'

    def smbShareName(share_name):
        return f'//div[contains(text(),"{share_name}")]'


class smb:
    addTitle = '//h3[text()="Add SMB"]'
    description_input = '//ix-input[@formcontrolname="comment"]//input'
    path_input = '//ix-explorer[@formcontrolname="path"]//input'
    name_input = '//ix-input[@formcontrolname="name"]//input'


class smb_service:
    title = '//h1[contains(text(),"SMB")]'
    auxiliaryParameters_textarea = '//ix-textarea[@formcontrolname="smb_options"]//textarea'


class storage:
    title = '//h1[contains(text(),"Storage Dashboard")]'
    create_pool_button = '//a[contains(.,"Create Pool")]'
    disks_button = '//a[*/text()=" Disks "]'
    encryptedPool = '//h2[text()="encrypted_pool"]'
    exportDisconnect_button = '//ix-dashboard-pool[contains(.,"encrypted_pool")]//button[contains(.,"Export/Disconnect")]'

    def manageDataset_button(pool_name):
        return f'//ix-dashboard-pool[contains(.,"{pool_name}")]//a[normalize-space(span/text())="Manage Datasets"]'


class systemDataset:
    title = '//h3[text()="System Dataset Pool" and @class="ix-formtitle"]'
    select_pool = '//mat-select'

    def pool_option(pool_name):
        return f'//mat-option[contains(.,"{pool_name}")]'


class toolbar:
    ha_disabled = '//mat-icon[@data-mat-icon-name="ha_disabled"]'
    ha_enabled = '//mat-icon[@data-mat-icon-name="ha_enabled"]'


class unlockDataset:
    title = '//h1[contains(.,"Unlock Datasets")]'
    datasetPassphrase_input = '//input[@ix-auto="input__Dataset Passphrase"]'
    unlockDatasets_message1 = '//p[contains(.,"These datasets will be unlocked with the provided credentials.")]'
    unlockDatasets_message2 = '//p[contains(.,"These datasets were successfully unlocked.")]'


class users:
    title = '//h1[text()="Users"]'
    eric_user = '//tr[contains(.,"ericbsd")]/td'
    eric_edit_button = '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]'
    root_user = '//tr[contains(.,"root")]/td'
    root_edit_button = '//tr[contains(.,"root")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]'
