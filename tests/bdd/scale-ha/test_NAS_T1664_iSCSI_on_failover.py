"""SCALE High Availability (tn-bhyve06) feature tests."""

import pytest
import random
import reusableSeleniumCode as rsc
import string
import time
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    run_cmd,
    get
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends

MOUNT_POINT = f'/tmp/iscsi_{"".join(random.choices(string.digits, k=3))}'


@pytest.fixture(scope='module')
def host_info():
    return {}


@pytest.fixture(scope='module')
def device():
    return {}


@pytest.fixture(scope='module')
def checksum():
    return {}


@scenario('features/NAS-T1664.feature', 'iSCSI sharing and service works after failover')
def test_iscsi_sharing_and_service_works_after_failover():
    """iSCSI sharing and service works after failover."""


@given(parsers.parse('the browser is open to {nas_hostname} login with {user} and {password}'))
def the_browser_is_open_to_nas_hostname_login_with_user_and_password(driver, nas_vip, user, password, request):
    """the browser is open to <nas_hostname> login with <user> and <password>."""
    depends(request, ["Setup_HA"], scope='session')
    global admin_User, admin_Password
    admin_User = user
    admin_Password = password
    if nas_vip not in driver.current_url:
        driver.get(f"http://{nas_vip}/ui/signin")

    rsc.Login_If_Not_On_Dashboard(driver, user, password)


@when('on the Dashboard, click Shares on the left side menu')
def on_the_dashboard_click_shares_on_the_left_side_menu(driver):
    """on the Dashboard, click Shares on the left side menu."""
    rsc.Verify_The_Dashboard(driver)

    assert wait_on_element(driver, 5, xpaths.side_Menu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.shares).click()


@then('on the Sharing page should appear, click on Block (iSCSI) Shares Targets Wizard button')
def on_the_sharing_page_should_appear_click_on_block_iscsi_shares_targets_wizard_button(driver):
    """on the Sharing page should appear, click on Block (iSCSI) Shares Targets Wizard button."""
    assert wait_on_element(driver, 7, xpaths.sharing.title)
    assert wait_on_element(driver, 5, xpaths.sharing.iscsi_Wizard_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.iscsi_Wizard_Button).click()


@then('the Wizard should appear on Create or Choose Block Device')
def the_wizard_should_appear_on_create_or_choose_block_device(driver):
    """the Wizard should appear on Create or Choose Block Device."""
    assert wait_on_element(driver, 5, xpaths.iscsi_Wizard.title)
    assert wait_on_element_disappear(driver, 5, xpaths.popup.please_Wait)
    assert is_element_present(driver, xpaths.iscsi_Wizard.block_Device_Title)


@then(parsers.parse('input "{target_name}" as Name, select Device as Extent Type'))
def input_iscsitest1_as_name_select_device_as_extent_type(driver, target_name):
    """input "iscsitest1" as Name, select Device as Extent Type."""
    rsc.Wait_For_Inputable_And_Input_Value(driver, xpaths.iscsi_Wizard.device_Name_Input, target_name)
    driver.find_element_by_xpath(xpaths.iscsi_Wizard.extent_Type_Select).click()
    rsc.Select_Option(driver, xpaths.iscsi_Wizard.extent_Type_Device_Option)


@then('click on the Device drop, select Create New and input and "tank" in Pool/Dataset')
def click_on_the_device_drop_select_create_new_and_input_and_tank_in_pooldataset(driver):
    """click on the Device drop, select Create New and input and "tank" in Pool/Dataset."""
    assert wait_on_element(driver, 5, xpaths.iscsi_Wizard.device_Dropdown, 'clickable')
    driver.find_element_by_xpath(xpaths.iscsi_Wizard.device_Dropdown).click()
    assert wait_on_element(driver, 5, xpaths.iscsi_Wizard.create_New_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.iscsi_Wizard.create_New_Button).click()
    rsc.Wait_For_Inputable_And_Input_Value(driver, xpaths.iscsi_Wizard.pool_Dataset_Input, '/mnt/tank')


@then('input 1 GiB for Size, leave the rest to default, and click Next')
def input_1_gib_for_size_leave_the_rest_to_default_and_click_next(driver):
    """input "1" GiB for Size, leave the rest to default, and click Next."""
    rsc.Input_Value(driver, xpaths.iscsi_Wizard.size_Input, '1 GiB')

    driver.find_element_by_xpath(xpaths.iscsi_Wizard.block_Device_Next_Button).click()


@then('on Portal, click the drop and Create New, then select Discovery Auth Method "None"')
def on_portal_click_the_drop_and_create_new_then_select_discovery_auth_method_none(driver):
    """on Portal, click the drop and Create New, then select Discovery Auth Method "None"."""
    assert wait_on_element(driver, 5, xpaths.iscsi_Wizard.portal_Title)
    assert wait_on_element(driver, 5, xpaths.iscsi_Wizard.portal_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.iscsi_Wizard.portal_Select).click()
    rsc.Select_Option(driver, xpaths.iscsi_Wizard.create_New_Option)

    assert wait_on_element(driver, 5, xpaths.iscsi_Wizard.discovery_Authentication_Method_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.iscsi_Wizard.discovery_Authentication_Method_Select).click()
    rsc.Select_Option(driver, xpaths.iscsi_Wizard.none_Option)


@then('on Add listen, set the IP Address to 0.0.0.0 and click Next')
def on_add_listen_set_the_ip_address_to_0000_and_click_next(driver):
    """on Add listen, set the IP Address to 0.0.0.0 and click Next."""
    driver.find_element_by_xpath(xpaths.iscsi_Wizard.add_Ip_Address_Button).click()

    assert wait_on_element(driver, 5, xpaths.iscsi_Wizard.ip_Address_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.iscsi_Wizard.ip_Address_Select).click()
    rsc.Select_Option(driver, xpaths.iscsi_Wizard.zero_Ip_Option)

    driver.find_element_by_xpath(xpaths.iscsi_Wizard.portal_Next_Button).click()


@then('on the Initiator, leave the input blank and click Next')
def on_the_initiator_leave_the_input_blank_and_click_next(driver):
    """on the Initiator, leave the input blank and click Next."""
    assert wait_on_element(driver, 5, xpaths.iscsi_Wizard.initiator_Title)

    assert wait_on_element(driver, 5, xpaths.iscsi_Wizard.initiator_Input)

    driver.find_element_by_xpath(xpaths.iscsi_Wizard.initiator_Next_Button).click()


@then('on the Confirm Options, verify and click Save')
def on_the_confirm_options_verify_and_click_save(driver):
    """on the Confirm Options, verify and click Save."""
    # This step was removed in Cobia
    assert wait_on_element(driver, 5, xpaths.progress.progressbar)
    rsc.Start_iSCSI_Service(driver)


@then('when it is saved, verify the Portal, Target, and Extent')
def when_it_is_saved_verify_the_portal_target_and_extent(driver):
    """when it is saved, verify the Portal, Target, and Extent"""
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.sharing.iscsi_Configure_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.iscsi_Configure_Button).click()
    assert wait_on_element(driver, 7, xpaths.iscsi.protals_Tab, 'clickable')
    driver.find_element_by_xpath(xpaths.iscsi.protals_Tab).click()
    assert wait_on_element(driver, 7, xpaths.iscsi.iscsitest1_Text)
    driver.find_element_by_xpath(xpaths.iscsi.targets_Tab).click()
    assert wait_on_element(driver, 5, xpaths.iscsi.iscsitest1_Text)
    driver.find_element_by_xpath(xpaths.iscsi.extents_Tab).click()
    assert wait_on_element(driver, 5, xpaths.iscsi.iscsitest1_Text)


# TODO: update this step in Jira when Bluefin is EOL
@then('go back to the Sharing page and turn on the iSCSI service')
def go_back_to_the_sharing_page_and_turn_on_the_iscsi_service(driver):
    """go back to the Sharing page and turn on the iSCSI service."""
    driver.find_element_by_xpath(xpaths.side_Menu.shares).click()
    assert wait_on_element(driver, 10, xpaths.sharing.iscsi_Service_Status)


@then('click on System Settings on the left sidebar, and click Services')
def click_on_system_settings_on_the_left_sidebar_and_click_services(driver):
    """click on System Settings on the left sidebar, and click Services."""
    rsc.Go_To_Service(driver)


@then('on the Service page, verify iSCSI is running and click the Start Automatically iSCSI checkbox')
def on_the_service_page_verify_iscsi_is_running_and_click_the_start_automatically_iscsi_checkbox(driver, nas_vip):
    """on the Service page, verify iSCSI is running and click the Start Automatically iSCSI checkbox."""
    assert wait_on_element(driver, 7, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.iscsi_running_toggle, 'clickable')
    assert wait_for_attribute_value(driver, 60, xpaths.services.iscsi_running_toggle, 'class', 'mat-mdc-slide-toggle-checked')

    results = get(nas_vip, '/service?service=iscsitarget', (admin_User, admin_Password))
    assert results.json()[0]['state'] == 'RUNNING', results.text

    value_exist = attribute_value_exist(driver, xpaths.services.iscsi_autostart_toggle, 'class', 'mat-mdc-slide-toggle-checked')
    if not value_exist:
        driver.find_element_by_xpath(xpaths.services.iscsi_autostart_toggle).click()
        assert wait_on_element_disappear(driver, 30, xpaths.popup.please_Wait)


@then(parsers.parse('SSH to {hostname} with {host_user} and {host_password} then connect to "iscsitest1"'))
def ssh_to_host_with_host_user_and_host_password_then_connect_to_iscsitest1(nas_vip, hostname, host_user, host_password, host_info):
    """SSH to <host> with <host_user> and <host_password> then connect to "iscsitest1"."""
    host_info['hostname'] = hostname
    host_info['host_user'] = host_user
    host_info['host_password'] = host_password

    cmd = f'iscsictl -A -p {nas_vip}:3260 -t iqn.2005-10.org.freenas.ctl:iscsitest1'
    login_results = run_cmd(cmd)
    assert login_results['result'], str(login_results)


@then('find the iscsi device with iscsictl -L and format the device newfs')
def find_the_iscsi_device_with_iscsictl_l_and_format_the_device_newfs(driver, host_info, device):
    """find the iscsi device with iscsictl -L and format the device newfs."""
    cmd = 'iscsictl -L | grep iqn.2005-10.org.freenas.ctl:iscsitest1'
    iscsictl_results = None
    for _ in list(range(15)):
        iscsictl_results = run_cmd(cmd)
        assert iscsictl_results['result'], str(iscsictl_results)
        iscsictl_list = iscsictl_results['output'].strip().split()
        if iscsictl_list[2] == "Connected:":
            device['iscsitest1'] = f"/dev/{iscsictl_list[3]}"
            break
        time.sleep(1)
    else:
        assert False, str(iscsictl_results)

    for _ in list(range(15)):
        cmd = f'test -e {device["iscsitest1"]}'
        results = run_cmd(cmd)
        if results['result']:
            break
        time.sleep(0.5)

    cmd = f'newfs {device["iscsitest1"]}'
    format_results = run_cmd(cmd)
    assert format_results['result'], str(format_results)


@then('create a mount point, then mount the iscsi device to it')
def create_a_mount_point_then_mount_the_iscsi_device_to_it(driver, host_info, device):
    """create a mount point, then mount the iscsi device to it."""
    cmd = f"mkdir -p {MOUNT_POINT}"
    mkdir_results = run_cmd(cmd)
    assert mkdir_results['result'], str(mkdir_results)
    cmd = f"mount {device['iscsitest1']} {MOUNT_POINT}"
    mount_results = run_cmd(cmd)
    assert mount_results['result'], str(mount_results)


@then('create a file in the mount point and get the checksum of the files to compare it after the failover')
def create_a_file_in_the_mount_point_and_get_the_checksum_of_the_files_to_compare_it_after_the_failover(driver, host_info, checksum):
    """create a file in the mount point and get the checksum of the files to compare it after the failover."""
    cmd = f"echo 'adding some text' > {MOUNT_POINT}/testfile.txt"
    touch_results = run_cmd(cmd)
    assert touch_results['result'], str(touch_results)

    cmd = f"test -f {MOUNT_POINT}/testfile.txt"
    test_results = run_cmd(cmd)
    assert test_results['result'], str(test_results)

    cmd = f'sha256 {MOUNT_POINT}/testfile.txt'
    results1 = run_cmd(cmd)
    assert results1['result'], f'{results1["output"]} \n {results1["stderr"]}'
    checksum['testfile.txt'] = results1["output"].partition('=')[2].strip()


@then('on the Dashboard, click Initiate Failover on the standby controller')
def on_the_dashboard_click_initiate_failover_on_the_standby_controller(driver):
    """on the Dashboard, click Initiate Failover on the standby controller."""
    rsc.Click_On_Element(driver, xpaths.side_Menu.old_dashboard)
    rsc.Verify_The_Dashboard(driver)
    time.sleep(20)

    rsc.Trigger_Failover(driver)


@then('on the Initiate Failover box, check the Confirm checkbox, then click Failover')
def on_the_initiate_failover_box_check_the_confirm_checkbox_then_click_failover(driver):
    """on the Initiate Failover box, check the Confirm checkbox, then click Failover."""
    rsc.Confirm_Failover(driver)


@then(parsers.parse('wait for the login to appear and HA to be enabled, login with {user} and {password}'))
def wait_for_the_login_to_appear_and_ha_to_be_enabled_login_with_user_and_password(driver, user, password):
    """wait for the login to appear and HA to be enabled, login with <user> and <password>."""
    rsc.HA_Login_Status_Enable(driver)

    rsc.Login(driver, user, password)


@then('once on the Dashboard, click on System Settings and click Services')
def once_on_the_dashboard_click_on_system_settings_and_click_services(driver):
    """once on the Dashboard, click on System Settings and click Services."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 180, xpaths.toolbar.ha_Enabled)
    # if there is prefious the License Agrement might show up
    rsc.License_Agrement(driver)
    rsc.Go_To_Service(driver)


@then('verify the iSCSI service is RUNNING in the UI and with the API')
def verify_the_iscsi_service_is_running_in_the_ui_and_with_the_api(driver, nas_vip):
    """verify the iSCSI service is RUNNING in the UI and with the API."""
    assert wait_on_element(driver, 7, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.iscsi_running_toggle, 'clickable')
    assert attribute_value_exist(driver, xpaths.services.iscsi_running_toggle, 'class', 'mat-mdc-slide-toggle-checked')

    results = get(nas_vip, '/service?service=iscsitarget', (admin_User, admin_Password))
    assert results.json()[0]['state'] == 'RUNNING', results.text


@then('verify the file verify iSCSI is still connected and the checksum in the mount point')
def verify_the_file_verify_iscsi_is_still_connected_and_the_checksum_in_the_mount_point(driver, host_info, checksum):
    """verify the file verify iSCSI is still connected and the checksum in the mount point."""
    cmd = f"test -f {MOUNT_POINT}/testfile.txt"
    test_results = run_cmd(cmd)
    assert test_results['result'], str(test_results)

    cmd = f'sha256 {MOUNT_POINT}/testfile.txt'
    results1 = run_cmd(cmd)
    assert results1['result'], f'{results1["output"]} \n {results1["stderr"]}'
    assert checksum['testfile.txt'] in results1["output"], f'{results1["output"]} \n {results1["stderr"]}'


@then('unmount and remove the mount point, disconnect from the iSCSI target')
def unmount_and_remove_the_mount_point_disconnect_from_the_iscsi_target(driver, host_info):
    """unmount and remove the mount point, disconnect from the iSCSI target."""
    cmd = f"umount {MOUNT_POINT}"
    umount_results = run_cmd(cmd)
    assert umount_results['result'], str(umount_results)
    cmd = f"rm -rf {MOUNT_POINT}"
    rm_results = run_cmd(cmd)
    assert rm_results['result'], str(rm_results)
    iscsictl_cmd = 'iscsictl -R -t iqn.2005-10.org.freenas.ctl:iscsitest1'
    remove_results = run_cmd(iscsictl_cmd)
    assert remove_results['result'], str(remove_results)
