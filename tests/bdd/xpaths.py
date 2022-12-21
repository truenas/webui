
class activeDirectory:
    title = '//h3[@class="ix-formtitle" and text()="Active Directory"]'
    enableCheckbox = '//ix-checkbox[@formcontrolname="enable"]//mat-checkbox'
    domain_input = '//ix-input[@formcontrolname="domainname"]//input'
    account_input = '//ix-input[@formcontrolname="bindname"]//input'
    password_input = '//ix-input[@formcontrolname="bindpw"]//input'
    ca_ou_input = '//ix-input[@formcontrolname="createcomputer"]//input'


class addUser:
    title = '//h3[text()="Add User"]'
    edit_title = '//h3[text()="Edit User"]'
    fullName_input = '//ix-input[@formcontrolname="full_name"]//input'
    username_input = '//ix-input[@formcontrolname="username"]//input'
    password_input = '//ix-input[@formcontrolname="password"]//input'
    confirm_password_input = '//ix-input[@formcontrolname="password_conf"]//input'
    select_shell = '//ix-combobox[@formcontrolname="shell"]//input'
    shell_option = '//mat-option[contains(.,"zsh")]'
    sudo_checkbox = '//mat-checkbox[contains(.,"Permit Sudo")]'
    email_input = '//ix-input[@formcontrolname="email"]//input'
    auxiliaryGroups_select = '//ix-select[@formcontrolname="groups"]//mat-select'
    rootGroup_option = '//mat-option[contains(.,"root")]'
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


class advanced:
    title = '//h1[contains(.,"Advanced")]'
    systemDatasetPool_card = '//h3[text()="System Dataset Pool"]'
    systemDatasetPool_configure_button = '//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]'

    def systemDatasetPool_pool(pool_name):
        return f'//div[contains(.,"System Dataset Pool:")]//span[contains(text(),"{pool_name}")]'


class button:
    add = '//button[contains(.,"Add")]'
    save = '//button[normalize-space(span/text())="Save"]'
    settings = '//button[contains(.,"Settings")]'
    Continue = '//button[contains(*/text(),"Continue")]'
    close = '//button[contains(.,"Close")]'
    close_icon = '//mat-icon[@id="ix-close-icon"]'
    advanced_option = '//button[contains(*/text(),"Advanced Options")]'


class checkbox:
    enable = '//ix-checkbox[@formcontrolname="enabled"]//mat-checkbox'
    confirm = '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]'


class dashboard:
    title = '//h1[contains(.,"Dashboard")]'
    systemInfoCardTitle = '//span[text()="System Information"]'


class dataset:
    title = '//h1[text()="Datasets"]'
    add_dataset_button = '//button[contains(*/text(),"Add Dataset")]'

    def pool_tree_name(pool_name):
        return f'//span[text()=" {pool_name} " and contains(@class,"name")]'

    def pool_selected(pool_name):
        return f'//span[text()="{pool_name}" and contains(@class,"own-name")]'

    def pool_tree(pool_name):
        return f'//ix-dataset-node[contains(.,"{pool_name}")]/div'


class directoryServices:
    title = '//h1[text()="Directory Services"]'
    directory_disable_title = '//h3[text()="Active Directory and LDAP are disabled."]'
    configureAD_button = '//button[contains(.,"Configure Active Directory")]'
    showButton = '//button[contains(*/text(),"Show")]'
    warningDialog = '//h1[text()="Warning"]'
    deleteAD02RealmButton = '//tr[contains(.,"AD02")]//button'
    deleteDialog = '//h1[text()="Delete"]'
    deleteConfirmCheckbox = '//mat-checkbox[@name="confirm_checkbox"]'
    deleteConfirmButton = '//button[@id="confirm-dialog__action-button"]'
    deleteADAccountButton = '//tr[contains(.,"AD_MACHINE_ACCOUNT")]//button'


class disks:
    title = '//h1[text()="Disks"]'
    all_disk = '//div[contains(text(),"sd")]'
    wipe_button = '//div[@class="form-actions"]//button[contains(.,"Wipe")]'

    def disk_expander(disk):
        return f'//tr[@ix-auto="expander__{disk}"]/td[2]'

    def wipe_disk_button(disk):
        return f'//button[@ix-auto="button__WIPE_{disk}_{disk}"]'

    def confirm_box_title(disk):
        return f'//h1[contains(.,"Wipe Disk {disk}")]'


class globalConfiguration:
    title = '//h3[text()="Edit Global Configuration"]'
    nameserver1_input = '//ix-input[contains(.,"Nameserver 1")]//input'
    nameserver2_input = '//ix-input[contains(.,"Nameserver 2")]//input'
    nameserver3_input = '//ix-input[contains(.,"Nameserver 3")]//input'
    ipv4_defaultGateway_input = '//ix-input[contains(.,"IPv4 Default Gateway")]//input'
    hostname_input = '//ix-input[contains(.,"Hostname")]//input'


class interface:
    title = '//h3[contains(text(),"Edit Interface")]'
    dhcp_checkbox = '//mat-checkbox[contains(.,"DHCP")]'
    add_allias = '//div[@class="label-container" and contains(.,"Aliases")]//button'
    ipAddress_input = '//ix-ip-input-with-netmask//input'
    netmask_select = '//ix-ip-input-with-netmask//mat-select'
    netmask_option = '//mat-option[contains(.,"24")]'


class login:
    user_input = '//input[@data-placeholder="Username"]'
    password_input = '//input[@data-placeholder="Password"]'
    signin_button = '//button[@name="signin_button"]'


class network:
    title = '//h1[contains(.,"Network")]'
    globalConfigurationTitle = '//h3[text()="Global Configuration"]'
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


class popup:
    smbRestartTitle = '//h3[text()="Restart SMB Service"]'
    smbRestartButton = '//button[contains(*/text(),"Restart Service")]'
    pleaseWait = '//h6[contains(.,"Please wait")]'
    activeDirectory = '//h1[text()="Active Directory"]'
    warning = '//h1[contains(.,"Warning")]'


class progress:
    progressbar = '//mat-progress-bar'


class services:
    title = '//h1[text()="Services"]'
    smbtoggle = '//tr[contains(.,"SMB")]//mat-slide-toggle'


class sideMenu:
    """xpath for the menu on the left side"""
    dashboard = '//mat-list-item[@ix-auto="option__Dashboard"]'
    datasets = '//mat-list-item[@ix-auto="option__Datasets"]'
    shares = '//mat-list-item[@ix-auto="option__Shares"]'
    systemSetting = '//mat-list-item[@ix-auto="option__System Settings"]'
    advanced = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Advanced"]'
    Services = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]'
    credentials = '//mat-list-item[@ix-auto="option__Credentials"]'
    local_user = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]'
    directoryServices = '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]'
    network = '//mat-list-item[@ix-auto="option__Network"]'
    storage = '//mat-list-item[@ix-auto="option__Storage"]'


class sharing:
    title = '//h1[text()="Sharing"]'
    smbPanelTitle = '//a[contains(text(),"Windows (SMB) Shares")]'
    smbAddButton = '//span[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]'
    smbServiceStatus = '//span[contains(.,"Windows (SMB) Shares")]//span[contains(text(),"RUNNING")]'

    def smbShareName(share_name):
        return f'//div[contains(text(),"{share_name}")]'


class smb:
    addTitle = '//h3[text()="Add SMB"]'
    description = '//ix-input[@formcontrolname="comment"]//input'
    path = '//ix-explorer[@formcontrolname="path"]//input'
    name = '//ix-input[@formcontrolname="name"]//input'


class storage:
    title = '//h1[contains(text(),"Storage Dashboard")]'
    create_pool_button = '//a[contains(.,"Create Pool")]'
    disks_button = '//a[*/text()=" Disks "]'


class system_dataset:
    title = '//h3[text()="System Dataset Pool" and @class="ix-formtitle"]'
    select_pool = '//mat-select'

    def pool_option(pool_name):
        return f'//mat-option[contains(.,"{pool_name}")]'


class toolbar:
    ha_disabled = '//mat-icon[@data-mat-icon-name="ha_disabled"]'
    ha_enabled = '//mat-icon[@data-mat-icon-name="ha_enabled"]'


class users:
    title = '//h1[text()="Users"]'
    eric_user = '//tr[contains(.,"ericbsd")]/td'
    eric_edit_button = '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]'
    root_user = '//tr[contains(.,"root")]/td'
    root_edit_button = '//tr[contains(.,"root")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]'
