"""SCALE High Availability (tn-bhyve06) feature tests."""

import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    attribute_value_exist,
    run_cmd,
    ssh_cmd,
    post
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@pytest.fixture(scope='module')
def acl_Permission_Data():
    return {}


@pytest.fixture(scope='module')
def share_Dataset_Data():
    return {}


@scenario('features/NAS-T1660.feature', 'Verify host sharing permissions on failover')
def test_verify_host_sharing_permissions_on_failover():
    """Verify host sharing permissions on failover."""


@given(parsers.parse('the browser is open to {nas_hostname} login with {user} and {password}'))
def the_browser_is_open_to_nas_hostname_login_with_user_and_password(driver, nas_vip, user, password, request):
    """the browser is open to <nas_hostname> login with <user> and <password>."""
    depends(request, ['Setup_HA'], scope='session')
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


@then('on the Datasets page, select the dozer dataset and click Add Dataset')
def on_the_datasets_page_select_the_dozer_dataset_and_click_add_dataset(driver):
    """on the Datasets page, select the dozer dataset and click Add Dataset."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Tree_Name('dozer'))
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('dozer')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Selected('dozer'))
    assert wait_on_element(driver, 5, xpaths.dataset.add_Dataset_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_Dataset_Button).click()


@then('input smb1 for dataset name, select SMB for Share Type and click save')
def input_smb1_for_dataset_name_select_smb_for_share_type_and_click_save(driver):
    """input smb1 for dataset name, select SMB for Share Type and click save."""
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys('smb1')
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select)
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_Select).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_SMB_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_SMB_Option).click()
    rsc.Click_On_Element(driver, xpaths.add_Dataset.create_Smb_Checkbox)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('when the new dataset is created click Add Dataset again')
def when_the_new_dataset_is_created_click_add_dataset_again(driver):
    """when the new dataset is created click Add Dataset again."""
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name('smb1'))

    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('dozer')).click()

    assert wait_on_element(driver, 5, xpaths.dataset.add_Dataset_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_Dataset_Button).click()


@then('input smb2 for dataset name, select SMB for Share Type and click save')
def input_smb2_for_dataset_name_select_smb_for_share_type_and_click_save(driver):
    """input smb2 for dataset name, select SMB for Share Type and click save."""
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys('smb2')
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select)
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_Select).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_SMB_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_SMB_Option).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('when the new dataset is created select smb2 click Edit on Permission card')
def when_the_new_dataset_is_created_select_smb2_click_edit_on_permission_card(driver):
    """when the new dataset is created select smb2 click Edit on Permission card."""
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name('smb2'))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree('smb2')).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.permission_Edit_Button).click()


@then('on the Edit ACL page set ericbsd to read only and click Save ACL')
def on_the_edit_acl_page_set_ericbsd_to_read_only_and_save_acl(driver):
    """on the Edit ACL page set ericbsd to read only and Save ACL."""
    assert wait_on_element(driver, 5, xpaths.edit_Acl.title)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.add_Item_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.add_Item_Button).click()
    assert wait_on_element(driver, 7, xpaths.edit_Acl.who_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.who_Select).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.who_User_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.who_User_Option).click()
    assert wait_on_element(driver, 7, xpaths.edit_Acl.user_Combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Acl.user_Combobox).send_keys('ericbsd')

    driver.find_element_by_xpath(xpaths.edit_Acl.permission_Select).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.permission_Read_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.permission_Read_Option).click()

    driver.find_element_by_xpath(xpaths.edit_Acl.builtin_Users_Cancel).click()
    driver.find_element_by_xpath(xpaths.edit_Acl.builtin_Administrators_Cancel).click()

    assert wait_on_element(driver, 5, xpaths.edit_Acl.save_Acl_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.save_Acl_Button).click()


@then('when the ACL Permission is save, click Shares on the left side menu')
def when_the_acl_permision_is_save_click_shares_on_the_left_side_menu(driver):
    """when the ACL Permission is save, click Shares on the left side menu."""
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updating_Acl)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)

    assert wait_on_element(driver, 5, xpaths.side_Menu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.shares).click()


@then('on the Sharing page, click the Add button on Windows (SMB) Shares card')
def on_the_sharing_page_click_the_add_button_on_windows_smb_shares_card(driver):
    """on the Sharing page, click the Add button on Windows (SMB) Shares card."""
    assert wait_on_element(driver, 7, xpaths.sharing.title)
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Panel_Title)
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Add_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.smb_Add_Button).click()


@then(parsers.parse('set the Path to "{dataset_path}" and input the "{share_name}" as name, then click to enable'))
def set_the_path_to_mntdozersmb1_and_input_the_smbtest1_as_name_then_click_to_enable(driver, dataset_path, share_name, share_Dataset_Data):
    """set the Path to "/mnt/dozer/smb1" and input the "smbtest1" as name, then click to enable."""
    share_Dataset_Data[share_name] = dataset_path
    assert wait_on_element(driver, 7, xpaths.smb.addTitle)
    assert wait_on_element(driver, 5, xpaths.smb.path_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.path_Input).send_keys(dataset_path)
    assert wait_on_element(driver, 5, xpaths.smb.name_Input, 'inputable')
    rsc.Click_Clear_Input(driver, xpaths.smb.name_Input, share_name)

    rsc.set_checkbox(driver, xpaths.checkbox.enabled)


@then('click Save if Restart SMB Service box appears, click Restart Service')
def click_save_if_restart_smb_service_box_appears_click_restart_service(driver):
    """click Save if Restart SMB Service box appears, click Restart Service."""
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    rsc.Start_Or_Restart_SMB_Service(driver)

    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)


@then(parsers.parse('send a file to the {share_name} share and verify the file exist and get the acl permission of smbtest1'))
def send_a_file_to_the_smbtest1_share_and_verify_the_file_exist_and_get_the_acl_permission_of_smbtest1(nas_vip, acl_Permission_Data, share_name, share_Dataset_Data):
    """send a file to the smbtest1 share and verify the file exist and get the acl permission of smbtest1."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_vip}/{share_name} -U ericbsd%testing -c "put testfile.txt testfile.txt"')
    assert results['result'], results['output']

    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{share_Dataset_Data[share_name]}/testfile.txt')
    assert results.status_code == 200, results.text

    results = post(nas_vip, '/filesystem/getacl/', (admin_User, admin_Password), {'path': share_Dataset_Data[share_name]})
    assert results.status_code == 200, results.text

    acl_Permission_Data[share_name] = results.json()['acl']


@then(parsers.parse('try to send a file to the {share_name} share and verify it failed and get the acl permission of smbtest2'))
def try_to_send_a_file_to_the_smbtest2_share_and_verify_it_failed_and_get_the_acl_permission_of_smbtest2(nas_vip, acl_Permission_Data, share_name, share_Dataset_Data):
    """try to send a file to the smbtest2 share and verify it failed and get the acl permission of smbtest2."""
    results = run_cmd(f'smbclient //{nas_vip}/{share_name} -U ericbsd%testing -c "put testfile.txt testfile.txt"')
    assert results['result'] is False, results['output']
    assert 'NT_STATUS_ACCESS_DENIED' in results['output']
    run_cmd('rm testfile.txt')

    results = post(nas_vip, '/filesystem/getacl/', (admin_User, admin_Password), {'path': share_Dataset_Data[share_name]})
    assert results.status_code == 200, results.text

    acl_Permission_Data[share_name] = results.json()['acl']


@then(parsers.parse('create a file with root in "/mnt/dozer/smb2" get the file from the {share_name} share'))
def create_a_file_with_root_in_mntdozersmb2_get_the_file_from_the_smbtest2_share(nas_vip, share_name, share_Dataset_Data):
    """create a file with root in "/mnt/dozer/smb2" get the file from the smbtest2 share."""
    cmd = 'echo "some text" > /mnt/dozer/smb2/testfile.txt'
    middlewared_log = ssh_cmd(cmd, admin_User, admin_Password, nas_vip)
    assert middlewared_log['result'] is True, str(middlewared_log)

    results = run_cmd(f'smbclient //{nas_vip}/{share_name} -U ericbsd%testing -c "get testfile.txt testfile.txt"')
    assert results['result'], results['output']

    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{share_Dataset_Data[share_name]}/testfile.txt')
    assert results.status_code == 200, results.text
    time.sleep(5)


@then('on the Dashboard, click Initiate Failover on the standby controller')
def on_the_dashboard_click_initiate_failover_on_the_standby_controller(driver):
    """on the Dashboard, click Initiate Failover on the standby controller."""
    rsc.Click_On_Element(driver, xpaths.side_Menu.old_dashboard)
    assert wait_on_element(driver, 10, xpaths.dashboard.title)

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
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 180, xpaths.toolbar.ha_Enabled)
    # if there is prefious the License Agrement might show up
    rsc.License_Agrement(driver)


@then(parsers.parse('verify the first file still exist in {share_name} dataset'))
def verify_the_first_file_still_exist_in_smbtest1_dataset(share_name, share_Dataset_Data, nas_vip):
    """verify the first file still exist in smbtest1 dataset."""
    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{share_Dataset_Data[share_name]}/testfile.txt')
    assert results.status_code == 200, results.text


@then(parsers.parse('verify you still can write on {share_name} and verify the permission'))
def verify_you_still_can_write_on_smbtest1_and_verify_the_permission(nas_vip, acl_Permission_Data, share_name, share_Dataset_Data):
    """verify you still can write on smbtest1 and verify the permission."""
    run_cmd('touch testfile2.txt')
    results = run_cmd(f'smbclient //{nas_vip}/{share_name} -U ericbsd%testing -c "put testfile2.txt testfile2.txt"')
    assert results['result'], results['output']

    results = post(nas_vip, '/filesystem/getacl/', (admin_User, admin_Password), {'path': share_Dataset_Data[share_name]})
    assert results.status_code == 200, results.text
    assert acl_Permission_Data[share_name] == results.json()['acl']


@then(parsers.parse('verify the root created file still exist in {share_name} dataset'))
def verify_the_test_file_still_exist_in_smbtest2_dataset(share_name, share_Dataset_Data, nas_vip):
    """verify the test file still exist in smbtest2 dataset."""
    results = post(nas_vip, '/filesystem/stat/', (admin_User, admin_Password), f'{share_Dataset_Data[share_name]}/testfile.txt')
    assert results.status_code == 200, results.text


@then(parsers.parse('verify you still cant write on {share_name} and verify the permission is still read only for ericbsd'))
def verify_you_still_cant_write_on_smbtest2_and_verify_the_permission_is_still_read_only_for_ericbsd(nas_vip, acl_Permission_Data, share_name, share_Dataset_Data):
    """verify you still cant write on smbtest2 and verify the permission is still read only for ericbsd."""
    results = run_cmd(f'smbclient //{nas_vip}/{share_name} -U ericbsd%testing -c "put testfile2.txt testfile2.txt"')
    assert results['result'] is False, results['output']
    assert 'NT_STATUS_ACCESS_DENIED' in results['output']
    run_cmd('rm testfile2.txt')

    results = post(nas_vip, '/filesystem/getacl/', (admin_User, admin_Password), {'path': share_Dataset_Data[share_name]})
    assert results.status_code == 200, results.text
    assert acl_Permission_Data[share_name] == results.json()['acl']
