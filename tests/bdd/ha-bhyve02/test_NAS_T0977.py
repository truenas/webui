# coding=utf-8
"""High Availability (tn-bhyve03) feature tests."""

import reusableSeleniumCode as rsc
import xpaths
import time
import random
import string
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)

MOUNT_POINT = f'/tmp/iscsi_{"".join(random.choices(string.digits, k=3))}'


def click_summit(driver):
    assert wait_on_element(driver, 5, xpaths.button.summit, 'clickable')
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element_disappear(driver, 15, xpaths.popup.please_wait)


@scenario('features/NAS-T977.feature', 'Verify that iSCSI connection on HA works')
def test_setting_up_an_iscsi_share(driver):
    """Setting up an ISCSI share."""


@given(parsers.parse('the browser is open navigate to "{nas_hostname}"'))
def the_browser_is_open_navigate_to_nas_hostname(driver, nas_hostname):
    """The browser is open navigate to "{nas_hostname}"."""
    if nas_hostname not in driver.current_url:
        driver.get(f"http://{nas_hostname}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('if login page appear enter "{nas_user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, nas_user, password):
    """If login page appear enter "{nas_user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 5, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(nas_user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 7, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('you should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    assert wait_on_element(driver, 20, xpaths.dashboard.system_information)


@then('go to sharing then click iscsi the iscsi page should open')
def go_to_sharing_then_click_iscsi_the_iscsi_page_should_open(driver):
    """go to sharing then click iscsi the iscsi page should open."""
    assert wait_on_element(driver, 7, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Block Shares (iSCSI)"]').click()
    assert wait_on_element(driver, 7, '//a[contains(.,"iSCSI")]')


@then('click Authorized Access tab, then click Add and Authorized AccessAdd Add page should open')
def click_authorized_access_tab_then_click_add_and_authorized_accessadd_add_page_should_open(driver):
    """click Authorized Access tab, then click Add and Authorized AccessAdd Add page should open."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Authorized Access"]').click()
    assert wait_on_element(driver, 7, xpaths.isqsi.authorized_Access_Title)
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Group")]')


@then(parsers.parse('input Group ID "{gid}", User "{user}", secret * "{password}",'))
def input_group_id_1_user_user_secret__password(driver, gid, user, password):
    """input Group ID "1", User "user", secret * "password",."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Group ID"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Group ID"]').send_keys(gid)
    driver.find_element_by_xpath('//input[@ix-auto="input__User"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__User"]').send_keys(user)
    driver.find_element_by_xpath('//input[@ix-auto="input__Secret"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Secret"]').send_keys(password)


@then(parsers.parse('input secret (Confirm) "{passwordc}", Peer user "{peer_user}",'))
def input_secret_confirm_password_peer_user_peertest(driver, passwordc, peer_user):
    """input secret (Confirm) "passwordc", Peer user "peertest",."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Secret (Confirm)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Secret (Confirm)"]').send_keys(passwordc)
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer User"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer User"]').send_keys(peer_user)


@then(parsers.parse('input Peer secret "{password}", Peer secret (Confirm) "{passwordc}"'))
def input_peer_secret_password_peer_secret_confirm_passwordc(driver, password, passwordc):
    """input Peer secret "password", Peer secret (Confirm) "passwordc"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer Secret"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer Secret"]').send_keys(password)
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer Secret (Confirm)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Peer Secret (Confirm)"]').send_keys(passwordc)


@then('click Summit and the new authorized access should be in Authorized Access list')
def click_summit_and_the_new_authorized_access_should_be_in_authorized_access_list(driver):
    """click Summit and the new authorized access should be in Authorized Access list."""
    click_summit(driver)
    assert wait_on_element(driver, 7, xpaths.isqsi.authorized_Access_Title)
    assert wait_on_element(driver, 7, '//span[contains(.,"usertest")]')


@then('click Portals tab, then click Add and the Portal Add page should open')
def click_portals_tab_then_click_add_and_the_portal_add_page_should_open(driver):
    """click Portals tab, then click Add and the Portal Add page should open."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Portals"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Portals")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic Info")]')


@then(parsers.parse('input Description "{description}", select Discovery Auth Method "{method}"'))
def input_description_my_iscsi_select_discovery_auth_method_chap(driver, description, method):
    """input Description "my iscsi", select Discovery Auth Method "Chap"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Discovery Authentication Method"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Discovery Authentication Method_{method}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Discovery Authentication Method_{method}"]').click()


@then(parsers.parse('select Discovery Auth Group "{gid}", IP address "{ip}", Port "{ports}"'))
def select_discovery_auth_group_1_ip_address_0000_port_3260(driver, gid, ip, ports):
    """select Discovery Auth Group "1", IP address "0.0.0.0", Port "3260"."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Discovery Authentication Group"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Discovery Authentication Group_{gid}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Discovery Authentication Group_{gid}"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__IP Address"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__IP Address_{ip}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__IP Address_{ip}"]').click()
    actions = ActionChains(driver)
    actions.send_keys(Keys.ESCAPE)
    actions.perform()
    driver.find_element_by_xpath('//input[@ix-auto="input__Port"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Port"]').send_keys(ports)


@then('click Summit and the new portal should be on the Portals list')
def click_summit_and_the_new_portal_should_be_on_the_portals_list(driver):
    """click Summit and the new portal should be on the Portals list."""
    click_summit(driver)
    assert wait_on_element(driver, 7, '//div[contains(.,"Portals")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"my iscsi")]')


@then('click Initiators Group tab, then click Add and the Initiators Add page should open')
def click_initiators_group_tab_then_click_add_and_the_initiators_add_page_should_open(driver):
    """click Initiators Group tab, then click Add and the Initiators Add page should open."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Initiators Groups"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Initiators Groups")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//span[contains(.,"Allow All Initiators")]')


@then(parsers.parse('input "{description}" in Description, input "{initiator}" in Allowed Initiators then click +'))
def input_group_id_1_in_description_input_iqn199801comvmwareiscsids1_in_allowed_initiators_then_click_plus(driver, description, initiator):
    """input "Group ID 1" in Description, input "iqn.1998-01.com.vmware.iscsi:ds1" in Allowed Initiators then click +."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    driver.find_element_by_xpath('//input[@ix-auto="input__Allowed Initiators (IQN)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Allowed Initiators (IQN)"]').send_keys(initiator)
    driver.find_element_by_xpath('(//button[contains(.,"add")])[1]').click()


@then(parsers.parse('input "{ip}" in Authorized networks then click +'))
def input_ip_in_authorized_networks_then_click_plus(driver, ip):
    """input "ip" in Authorized networks then click +."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Authorized Networks"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Authorized Networks"]').send_keys(ip)
    driver.find_element_by_xpath('(//button[contains(.,"add")])[2]').click()


@then('click Save and the new initiator should be on the Initiators Group list')
def click_save_and_the_new_initiator_should_be_on_the_initiators_group_list(driver):
    """click Save and the new initiator should be on the Initiators Group list."""
    driver.find_element_by_xpath('//button[contains(.,"Save")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Initiators Groups")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"Group ID 1")]')


@then('click Targets tab, then click Add and the Target Add page should open')
def click_targets_tab_then_click_add_and_the_target_add_page_should_open(driver):
    """click Targets tab, then click Add and the Target Add page should open."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Targets"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Targets")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic Info")]')


@then(parsers.parse('input Target name "{target_name}", Target alias "{target_alias}", Portal Group ID select "{group}"'))
def input_target_name_ds1_target_alias_ds1_portal_group_id_select_1(driver, target_name, target_alias, group):
    """input Target name "ds1", Target alias "ds1", Portal Group ID select "1"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Name"]').send_keys(target_name)
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Alias"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Target Alias"]').send_keys(target_alias)
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Portal Group ID"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Portal Group ID"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Portal Group ID_{group}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Portal Group ID_{group}"]').click()


@then(parsers.parse('Initiator Group ID select "{initiator_group}", Auth Method Select "{method}", Authentication Group Number Select "{gid}"'))
def initiator_group_id_select_1_auth_method_select_mutual_chap_authentication_group_number_select_1(driver, initiator_group, method, gid):
    """Initiator Group ID select "1", Auth Method Select "Mutual Chap", Authentication Group Number Select "1"."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Initiator Group ID"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Initiator Group ID_{initiator_group}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Initiator Group ID_{initiator_group}"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Authentication Method"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Authentication Method_{method}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Authentication Method_{method}"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Authentication Group Number"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Authentication Group Number_{gid}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Authentication Group Number_{gid}"]').click()


@then('click Summit and the new target should be on the Targets list')
def click_summit_and_the_new_target_should_be_on_the_targets_list(driver):
    """click Summit and the new target should be on the Targets list."""
    click_summit(driver)
    assert wait_on_element(driver, 7, '//div[contains(.,"Targets")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"ds1")]')


@then('click Extents tab, then click Add and Extents Add page should open')
def click_extents_tab_then_click_add_and_extents_add_page_should_open(driver):
    """click Extents tab, then click Add and Extents Add page should open."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Extents"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Extents")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Basic Info")]')


@then(parsers.parse('input Extent name "{name}", select "{extent_type}" for Extent Type, select "{device}" for Device'))
def input_extent_name_ds1__extent_type_device_device__tankds1(driver, name, extent_type, device):
    """input Extent name "ds1", select "Device" for Extent Type select "tank/ds1 (1.00G)" for Device."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(name)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Extent Type"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Extent Type_{extent_type}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Extent Type_{extent_type}"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Device"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Device_{device}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Device_{device}"]').click()


@then('click Summit and the new extent should be on the Extents list')
def click_summit_and_the_new_extent_should_be_on_the_extents_list(driver):
    """click Summit and the new extent should be on the Extents list."""
    click_summit(driver)
    assert wait_on_element(driver, 7, '//div[contains(.,"Extents")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"ds1")]')


@then('click Associated Targets tab, then click Add and Associated Targets Add page should open')
def click_associated_targets_tab_then_click_add_and_associated_targets_add_page_should_open(driver):
    """click Associated Targets tab, then click Add and Associated Targets Add page should open."""
    driver.find_element_by_xpath('//a[@ix-auto="tab__Associated Targets"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Associated Targets")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Associated Target")]')


@then(parsers.parse('select "{target}" for Target, input "{lun_id}" for LUN ID, select "{extent}" for Extent'))
def select_ds1_Target_input_1_for_lun_id_select_ds1_extent(driver, target, lun_id, extent):
    """select "ds1" for Target, input "1" for LUN ID, select "ds1" for Extent."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Target"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Target_{target}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Target_{target}"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__LUN ID"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__LUN ID"]').send_keys(lun_id)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Extent"]').click()
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__Extent_{extent}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Extent_{extent}"]').click()


@then('click Summit and the new associated target should be on the Associated Targets list')
def click_summit_and_the_new_associated_target_should_be_on_the_associated_targets_list(driver):
    """click Summit and the new associated target should be on the Associated Targets list."""
    click_summit(driver)
    assert wait_on_element(driver, 7, '//div[contains(.,"Associated Targets")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"ds1")]')


@then('click on Services on the side menu and the Services page should open')
def click_on_services_on_the_side_menu_and_the_services_page_should_open(driver):
    """click on Services on the side menu and the Services page should open."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Services"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()
    assert wait_on_element(driver, 7, '//services')


@then('if the SCSI service is not started, start the service')
def if_the_scsi_service_is_not_started_start_the_service(driver):
    """if the SCSI service is not started, start the service."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="value__iSCSI"]')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__iSCSI_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__iSCSI_Running"]').click()
    time.sleep(2)


@then(parsers.parse('SSH to <host> with <host_password> and connect with iscsictl, "{target}",  "{user}" and "{secret}"'))
def ssh_to_host_with_password_connect_with_iscsictl_ds1__usertest_and_testing123abc(nas_hostname, host_password, host, target, user, secret):
    """SSH to <host> with <password> connect with iscsictl, "ds1",  "usertest" and "testing123abc"."""
    cmd = f'iscsictl -A -p {nas_hostname}:3260 -t iqn.2005-10.org.freenas.ctl:{target} -u {user} -s {secret}'
    login_results = ssh_cmd(cmd, 'root', host_password, host)
    assert login_results['result'], str(login_results)


@then('find the iscsi device with iscsictl -L and format the device newfs')
def find_the_iscsi_device_with_iscsictl_L_and_format_the_device_newfs(nas_hostname, host_password, host):
    """find the iscsi device with iscsictl -L and format the device newfs."""
    global device
    cmd = f'iscsictl -L | grep {nas_hostname}:3260'
    for num in list(range(15)):
        iscsictl_results = ssh_cmd(cmd, 'root', host_password, host)
        assert iscsictl_results['result'], str(iscsictl_results)
        iscsictl_list = iscsictl_results['output'].strip().split()
        if iscsictl_list[2] == "Connected:":
            device = f"/dev/{iscsictl_list[3]}"
            assert True
            break
        time.sleep(1)
    else:
        assert False
    time.sleep(1)
    cmd = f'newfs {device}'
    format_results = ssh_cmd(cmd, 'root', host_password, host)
    assert format_results['result'], str(format_results)


@then('create a mount point, then mount the iscsi device to it')
def create_a_mount_point_then_mount_the_device_to_it(host_password, host):
    """create a mount point, then mount the device to it."""
    cmd = f"mkdir -p {MOUNT_POINT}"
    mkdir_results = ssh_cmd(cmd, 'root', host_password, host)
    assert mkdir_results['result'], str(mkdir_results)
    cmd = f"mount {device} {MOUNT_POINT}"
    mount_results = ssh_cmd(cmd, 'root', host_password, host)
    assert mount_results['result'], str(mount_results)


@then('create a file in the mount point unmount it and verify the file is missing in the mount point')
def create_a_file_in_the_mount_point_unmount_it_and_verify_the_file_is_missing_in_the_mount_point(host_password, host):
    """create a file in the mount point unmount it and verify the file is missing in the mount point."""
    cmd = f"touch {MOUNT_POINT}/test.text"
    touch_results = ssh_cmd(cmd, 'root', host_password, host)
    assert touch_results['result'], str(touch_results)
    cmd = f"test -f {MOUNT_POINT}/test.text"
    touch_results = ssh_cmd(cmd, 'root', host_password, host)
    assert touch_results['result'], str(touch_results)
    cmd = f"umount {MOUNT_POINT}"
    unmount_results = ssh_cmd(cmd, 'root', host_password, host)
    assert unmount_results['result'], str(unmount_results)
    cmd = f"test -f {MOUNT_POINT}/test.text"
    test_results = ssh_cmd(cmd, 'root', host_password, host)
    assert not test_results['result'], str(test_results)


@then('then remount the iscsi device, the file should be in the mount point')
def then_remount_the_iscsi_device_the_file_should_be_in_the_mount_point(host_password, host):
    """then remount the iscsi device, the file should be in the mount point."""
    cmd = f"mount {device} {MOUNT_POINT}"
    mount_results = ssh_cmd(cmd, 'root', host_password, host)
    assert mount_results['result'], str(mount_results)
    cmd = f"test -f {MOUNT_POINT}/test.text"
    touch_results = ssh_cmd(cmd, 'root', host_password, host)
    assert touch_results['result'], str(touch_results)


@then(parsers.parse('unmount and remove the mount point, disconnect with "{iscsictl_command}"'))
def unmount_and_remove_the_mount_point_disconnect_with_iscsictl_r_t_iqn200510orgfreenasctlds1(iscsictl_command, host, host_password):
    """unmount and remove the mount point, disconnect with "iscsictl -R -t iqn.2005-10.org.freenas.ctl:ds1"."""
    cmd = f"umount {MOUNT_POINT}"
    umount_results = ssh_cmd(cmd, 'root', host_password, host)
    assert umount_results['result'], str(umount_results)
    cmd = f"rm -rf {MOUNT_POINT}"
    mount_results = ssh_cmd(cmd, 'root', host_password, host)
    assert mount_results['result'], str(mount_results)
    remove_results = ssh_cmd(iscsictl_command, 'root', host_password, host)
    assert remove_results['result'], str(remove_results)
