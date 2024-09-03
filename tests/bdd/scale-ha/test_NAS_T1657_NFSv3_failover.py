"""SCALE High Availability (tn-bhyve06) feature tests."""

import pytest
import random
import string
import reusableSeleniumCode as rsc
import time
import xpaths
from pytest_dependency import depends
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from function import (
    wait_on_element,
    wait_on_element_disappear,
    attribute_value_exist,
    ssh_cmd,
    get,
    post
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@pytest.fixture(scope='module')
def checksum():
    return {}


@scenario('features/NAS-T1657.feature', 'Verify NFSv3 sharing and service works after failover')
def test_verify_nfsv3_sharing_and_service_works_after_failover():
    """Verify NFSv3 sharing and service works after failover."""


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


@when('on the Dashboard, click on Datasets on the left side menu')
def on_the_dashboard_click_on_datasets_on_the_left_side_menu(driver):
    """on the Dashboard, click on Datasets on the left side menu."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 5, xpaths.side_Menu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.datasets).click()


@then('on the Dataset page, click on the tank tree and click Add Dataset')
def on_the_dataset_page_click_on_the_tank_tree_and_click_add_dataset(driver):
    """on the Dataset page, click on the tank tree and click Add Dataset."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Tree_Name('tank'))
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('tank')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Selected('tank'))
    assert wait_on_element(driver, 5, xpaths.dataset.add_Dataset_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_Dataset_Button).click()


@then(parsers.parse('on the Add Dataset slide, input the {dataset_name}, leave all options as default'))
def on_the_add_dataset_slide_input_the_dataset_name_leave_all_options_as_default(driver, dataset_name):
    """on the Add Dataset slide, input the <dataset_name>, leave all options as default."""
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    rsc.Wait_For_Inputable_And_Input_Value(driver, xpaths.add_Dataset.name_Textarea, dataset_name)


@then('check that the share type is Generic and click Save')
def check_that_the_share_type_is_generic_and_click_submit(driver):
    """check that the share type is Generic and click Save."""
    rsc.Verify_Element_Text(driver, xpaths.add_Dataset.share_Type_Select_Text, "Generic")
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)


@then(parsers.parse('click on the {dataset_name} tree, click Edit on the Permissions card'))
def click_on_the_dataset_name_tree_click_edit_on_the_permissions_card(driver, dataset_name):
    """click on the <dataset_name> tree, click Edit on the Permissions card."""
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.permission_Edit_Button).click()


@then(parsers.parse('on the Edit Permissions page, input "{username}" in the User entry'))
def on_the_unix_permissions_editor_page_input_nobody_in_the_user_entry(driver, username):
    """on the Unix Permissions Editor page, input "nobody" in the User entry."""
    assert wait_on_element(driver, 5, xpaths.edit_Permissions.title)
    assert wait_on_element(driver, 5, xpaths.edit_Permissions.user_Apply_Checkbox, 'clickable')
    rsc.Combobox_Input_And_Select(driver, xpaths.edit_Permissions.user_Combobox, username)


@then(parsers.parse('check Apply User input "{group_name}" in the Group entry and check Apply Group'))
def check_apply_user_input_nogroup_in_the_group_entry_and_check_apply_group(driver, group_name):
    """check Apply User input "nogroup" in the Group entry and check Apply Group."""
    driver.find_element_by_xpath(xpaths.edit_Permissions.user_Apply_Checkbox).click()

    rsc.Combobox_Input_And_Select(driver, xpaths.edit_Permissions.group_Combobox, group_name)

    driver.find_element_by_xpath(xpaths.edit_Permissions.group_Apply_Checkbox).click()


@then('check Group/Write under Access Mode and click Save')
def check_groupwrite_under_access_mode_and_click_save(driver):
    """check Group/Write under Access Mode and click Save."""
    driver.find_element_by_xpath(xpaths.add_User.home_Mode_Group_Write_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    time.sleep(1)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.saving_Permissions)


@then('when the changes are saved, click on Shares on the left side menu')
def when_the_changes_are_saved_click_on_shares_on_the_left_side_menu(driver):
    """when the changes are saved, click on Shares on the left side menu."""
    assert wait_on_element(driver, 5, xpaths.dataset.title)
    assert wait_on_element(driver, 5, xpaths.side_Menu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.shares).click()


@then('on the Sharing page, click the UNIX (NFS) Shares Add button')
def on_the_sharing_page_click_the_unix_nfs_shares_add_button(driver):
    """on the Sharing page, click the UNIX (NFS) Shares Add button."""
    assert wait_on_element(driver, 7, xpaths.sharing.title)
    assert wait_on_element(driver, 5, xpaths.sharing.nfs_Panel_Title)
    assert wait_on_element(driver, 5, xpaths.sharing.nfs_Add_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.nfs_Add_Button).click()


@then(parsers.parse('input the {mount_point} of the dataset created before, then click Advanced Options'))
def input_the_mount_point_of_the_dataset_created_before_then_click_advanced_options(driver, mount_point):
    """input the <mount_point> of the dataset created before, then click Advanced Options."""
    assert wait_on_element(driver, 7, xpaths.add_NFS.title)
    rsc.Wait_For_Inputable_And_Input_Value(driver, xpaths.add_NFS.path_Input, mount_point)

    ActionChains(driver).send_keys(Keys.TAB).perform()

    driver.find_element_by_xpath(xpaths.button.advanced_Option).click()


@then(parsers.parse('input "{username}" in Mapall User and "{group_name}" in Mapall Group entries'))
def input_nobody_in_mapall_user_and_nogroup_in_mapall_group_entries(driver, username, group_name):
    """input "nobody" in Mapall User and "nogroup" in Mapall Group entries."""
    rsc.Combobox_Input_And_Select(driver, xpaths.add_NFS.mapall_User_Combobox, username)

    rsc.Combobox_Input_And_Select(driver, xpaths.add_NFS.mapall_Group_Combobox, group_name)


@then('click Save, the Enable service box should appear, then click Enable Service')
def click_save_the_enable_service_box_should_appear_then_click_enable_service(driver):
    """click Save, the Enable service box should appear, then click Enable Service."""
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    rsc.start_nfs_service(driver)
    assert wait_on_element(driver, 15, xpaths.sharing.nfs_Service_Status)


@then(parsers.parse('the {mount_point} should appear in the UNIX (NFS) Shares list'))
def the_mount_point_should_appear_in_the_unix_nfs_shares_list(driver, mount_point):
    """the <mount_point> should appear in the UNIX (NFS) Shares list."""
    assert wait_on_element(driver, 7, xpaths.sharing.title)
    assert wait_on_element(driver, 7, xpaths.sharing.smb_Share_Name(mount_point))


@then('click on System Settings on the left sidebar, and click Services')
def click_on_system_settings_on_the_left_sidebar_and_click_services(driver):
    """click on System Settings on the left sidebar, and click Services."""
    rsc.Go_To_Service(driver)


@then('on the Service page, verify the NFS service is running in the UI and with the API')
def on_the_service_page_verify_the_nfs_service_is_running_in_the_ui_and_with_the_api(driver, nas_vip):
    """on the Service page, verify the NFS service is running in the UI and with the API."""
    assert wait_on_element(driver, 7, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.nfs_running_toggle, 'clickable')
    assert attribute_value_exist(driver, xpaths.services.nfs_running_toggle, 'class', 'mat-mdc-slide-toggle-checked')

    results = get(nas_vip, "/service?service=nfs", (admin_User, admin_Password))
    assert results.json()[0]["state"] == "RUNNING", results.text


@then('verify the Start Automatically checkbox is checked. If not, click on the checkbox')
def verify_the_start_automatically_checkbox_is_checked_if_not_click_on_the_checkbox(driver):
    """verify the Start Automatically checkbox is checked. If not, click on the checkbox."""
    value_exist = attribute_value_exist(driver, xpaths.services.nfs_autostart_toggle, 'class', 'mat-mdc-slide-toggle-checked')
    if not value_exist:
        driver.find_element_by_xpath(xpaths.services.nfs_autostart_toggle).click()
        assert wait_on_element_disappear(driver, 30, xpaths.popup.please_Wait)


@then(parsers.parse('create a mount point on {linux_host} with {linux_user} and {linux_password}'))
def create_a_mount_point_on_linux_host_with_linux_password(linux_host, linux_user, linux_password):
    """create a mount point on <linux_host> with <linux_password>."""
    # random mount point to avoid the same test to break if it ever run in the same time
    global nfs_Local_Mountpoint, linux_Host, linux_User, linux_Password
    nfs_Local_Mountpoint = f'/mnt/nfsv3_test_{"".join(random.choices(string.digits, k=3))}'
    linux_Host = linux_host
    linux_User = linux_user
    linux_Password = linux_password
    cmd = f'mkdir {nfs_Local_Mountpoint}'
    results = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results['result'], f'{results["output"]} \n {results["stderr"]}'
    time.sleep(1)


@then(parsers.parse('mount the {linux_host} to the {nas_hostname} share {mount_point}'))
def mount_the_linux_host_to_the_nas_hostname_share_mount_point(linux_host, nas_vip, mount_point):
    """mount the <linux_host> to the <nas_hostname> share <mount_point>."""

    cmd = f'mount -t nfs {nas_vip}:{mount_point} {nfs_Local_Mountpoint}'
    results = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results['result'], f'{results["output"]} \n {results["stderr"]}'
    time.sleep(1)


@then('verify the NFS share is mounted has type nfs and not type nfs4')
def verify_the_nfs_share_is_mounted_has_type_nfs_and_not_type_nfs4():
    """verify the NFS share is mounted has type nfs and not type nfs4."""
    cmd = f'mount | grep {nfs_Local_Mountpoint}'
    results = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results['result'], f'{results["output"]} \n {results["stderr"]}'
    assert 'type nfs' in results["output"] and 'type nfs4' in results["output"]


text1 = "Some text to test there is not data corruption after HA failover."
text2 = "Some more text to test there is not data corruption after HA failover."
text3 = """Longer text to test there is no data corruption after failover.

The checksum sha256 should match after failover."""


@then(parsers.parse('add some files to the local mount point verify that they are on the NAS share {mount_point}'))
def add_some_files_to_the_local_mount_point_verify_that_they_are_on_the_nas_share_mount_point(nas_vip, mount_point):
    """add some files to the local mount point verify that they are on the NAS share <mount_point>."""
    global mount_Point
    mount_Point = mount_point
    cmd = f'touch {nfs_Local_Mountpoint}/testfile1.text'
    results1 = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results1['result'], f'{results1["output"]} \n {results1["stderr"]}'

    cmd = f'echo "{text1}" > {nfs_Local_Mountpoint}/testfile1.text'
    results2 = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results2['result'], f'{results2["output"]} \n {results2["stderr"]}'

    cmd = f'touch {nfs_Local_Mountpoint}/testfile2.text'
    results3 = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results3['result'], f'{results3["output"]} \n {results3["stderr"]}'

    cmd = f'echo "{text2}" > {nfs_Local_Mountpoint}/testfile2.text'
    results4 = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results4['result'], f'{results4["output"]} \n {results4["stderr"]}'

    cmd = f'touch {nfs_Local_Mountpoint}/testfile3.text'
    results5 = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results5['result'], f'{results5["output"]} \n {results5["stderr"]}'

    cmd = f'echo "{text3}" > {nfs_Local_Mountpoint}/testfile3.text'
    results6 = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results6['result'], f'{results6["output"]} \n {results6["stderr"]}'

    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{mount_point}/testfile1.text')
    assert results.status_code == 200, results.text
    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{mount_point}/testfile2.text')
    assert results.status_code == 200, results.text
    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{mount_point}/testfile3.text')
    assert results.status_code == 200, results.text


@then('get the checksum for those files to compare it after the failover')
def get_the_checksum_for_those_files_to_compare_it_after_the_failover(checksum, nas_vip):
    """get the checksum for those files to compare it after the failover."""
    cmd = f'sha256sum {mount_Point}/testfile1.text'
    results1 = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results1['result'], f'{results1["output"]} \n {results1["stderr"]}'
    checksum['testfile1.text'] = results1["output"].partition(' ')[0]

    cmd = f'sha256sum {mount_Point}/testfile2.text'
    results2 = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results2['result'], f'{results2["output"]} \n {results2["stderr"]}'
    checksum['testfile2.text'] = results2["output"].partition(' ')[0]

    cmd = f'sha256sum {mount_Point}/testfile3.text'
    results3 = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results3['result'], f'{results3["output"]} \n {results3["stderr"]}'
    checksum['testfile3.text'] = results3["output"].partition(' ')[0]


@then('go to the Dashboard and click Initiate Failover on the standby controller')
def go_to_the_dashboard_and_click_initiate_failover_on_the_standby_controller(driver):
    """go to the Dashboard and click Initiate Failover on the standby controller."""
    rsc.Click_On_Element(driver, xpaths.side_Menu.old_dashboard)
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    time.sleep(10)

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


@then('verify the NFS service is RUNNING in the UI and with the API')
def verify_the_nfs_service_is_running_in_the_ui_and_with_the_api(driver, nas_vip):
    """verify the NFS service is RUNNING in the UI and with the API."""
    assert wait_on_element(driver, 7, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.nfs_running_toggle, 'clickable')
    assert attribute_value_exist(driver, xpaths.services.nfs_running_toggle, 'class', 'mat-mdc-slide-toggle-checked')

    results = get(nas_vip, "/service?service=nfs", (admin_User, admin_Password))
    assert results.json()[0]["state"] == "RUNNING", results.text


@then('verify all the files checksum taken before the failover to ensure that the data is not corrupt')
def verify_all_the_files_checksum_taken_before_the_failover_to_ensure_that_the_data_is_not_corrupt(checksum, nas_vip):
    """verify all the files checksum taken before the failover to ensure that the data is not corrupt."""
    cmd = f'sha256sum {mount_Point}/testfile1.text'
    results1 = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results1['result'], f'{results1["output"]} \n {results1["stderr"]}'
    assert checksum['testfile1.text'] in results1["output"], f'{results1["output"]} \n {results1["stderr"]}'

    cmd = f'sha256sum {mount_Point}/testfile2.text'
    results2 = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results2['result'], f'{results2["output"]} \n {results2["stderr"]}'
    assert checksum['testfile2.text'] in results2["output"], f'{results2["output"]} \n {results2["stderr"]}'

    cmd = f'sha256sum {mount_Point}/testfile3.text'
    results3 = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert results3['result'], f'{results3["output"]} \n {results3["stderr"]}'
    assert checksum['testfile3.text'] in results3["output"], f'{results3["output"]} \n {results3["stderr"]}'


text4 = 'New file to verify NFSv3 is working after failover'


@then(parsers.parse('create a new file in the local mount and verify that is is on the NAS share {mount_point}'))
def create_a_new_file_in_the_local_mount_and_verify_that_is_is_on_the_nas_share_mount_point(mount_point, nas_vip):
    """create a new file in the local mount and verify that is is on the NAS share <mount_point>."""
    cmd = f'touch {nfs_Local_Mountpoint}/testfile4.text'
    results1 = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results1['result'], f'{results1["output"]} \n {results1["stderr"]}'

    cmd = f'echo "{text4}" > {nfs_Local_Mountpoint}/testfile4.text'
    results2 = ssh_cmd(cmd, linux_User, linux_Password, linux_Host)
    assert results2['result'], f'{results2["output"]} \n {results2["stderr"]}'

    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{mount_point}/testfile4.text')
    assert results.status_code == 200, results.text


@then('unmount the share and delete the local mount point')
def unmount_the_share_and_delete_the_local_mount_point():
    """unmount the share and delete the local mount point."""
    cmd = f'umount {nfs_Local_Mountpoint}'
    results = ssh_cmd(cmd, 'root', linux_Password, linux_Host)
    assert results['result'], f'{results["output"]} \n {results["stderr"]}'
    time.sleep(1)

    cmd = f'rm -r {nfs_Local_Mountpoint}'
    results = ssh_cmd(cmd, 'root', linux_Password, linux_Host)
    assert results['result'], f'{results["output"]} \n {results["stderr"]}'


@then(parsers.parse('verify that all files are in NAS share {mount_point}'))
def verify_that_all_files_are_in_nas_share_mount_point(mount_point, nas_vip):
    """verify that all files are in NAS share <mount_point>."""
    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{mount_point}/testfile1.text')
    assert results.status_code == 200, results.text
    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{mount_point}/testfile2.text')
    assert results.status_code == 200, results.text
    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{mount_point}/testfile3.text')
    assert results.status_code == 200, results.text
    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{mount_point}/testfile4.text')
    assert results.status_code == 200, results.text
