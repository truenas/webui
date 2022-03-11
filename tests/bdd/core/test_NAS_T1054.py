# coding=utf-8
"""Core feature tests."""

import random
import string
import time
from selenium.webdriver import ActionChains
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
import pytest

pytestmark = [pytest.mark.debug_test]
# random mount point to avoid the same test to break if it ever run in the same time
mountpoint = f'/mnt/nfs_host{"".join(random.choices(string.digits, k=2))}'


@scenario('features/NAS-T1054.feature', 'Verify readonly works for NFS share')
def test_verify_readonly_works_for_nfs_share(driver):
    """Verify readonly works for NFS share."""
    pass


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Storage on the side menu, click on Pools')
def on_the_dashboard_click_on_storage_on_the_side_menu_click_on_pools(driver):
    """on the dashboard, click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('click on the tank pool three dots button, select Add Dataset')
def click_on_the_tank_pool_three_dots_button_select_add_dataset(driver):
    """click on the tank pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then('input nfs2 for Name, select Generic as Share Type, and click Submit')
def input_nfs2_for_name_select_generic_as_share_type_and_click_submit(driver):
    """input nfs2 for Name, select Generic as Share Type, and click Submit."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('nfs2')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Share Type_Generic"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_Generic"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"nfs2")]')


@then('click on the nfs2 dataset 3 dots button, select Edit Permissions')
def click_on_the_nfs2_dataset_3_dots_button_select_edit_permissions(driver):
    """click on the nfs2 dataset 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__nfs2"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__nfs2"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__nfs2_Edit Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__nfs2_Edit Permissions"]').click()


@then('on the Permissions page, set the user to nobody and the Group to nogroup')
def on_the_permissions_page_set_the_user_to_nobody_and_the_group_to_nogroup(driver):
    """on the Permissions page, set the user to nobody and the Group to nogroup."""
    assert wait_on_element(driver, 7, '//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').send_keys('nobody')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__nobody"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input')
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').send_keys('nogroup')
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__nogroup"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()


@then('click Save, the permissions should save without error')
def click_save_the_permissions_should_save_without_error(driver):
    """click Save, the permissions should save without error."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"nfs2")]')


@then('click on Sharing on the side menu, click on Unix Shares (NFS)')
def click_on_sharing_on_the_side_menu_click_on_unix_shares_nfs(driver):
    """click on Sharing on the side menu, click on Unix Shares (NFS)."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Sharing"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Sharing"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Unix Shares (NFS)"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Unix Shares (NFS)"]').click()


@then('on the Windows Shares, click Add')
def on_the_windows_shares_click_add(driver):
    """on the Windows Shares, click Add."""
    assert wait_on_element(driver, 7, '//div[contains(.,"NFS")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NFS_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NFS_ADD"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Paths")]')


@then(parsers.parse('input "{description}" in the Description'))
def input_readonly_in_the_description(driver, description):
    """input "read-only" in the Description."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Description"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)


@then('input the nfs2 dataset path in Paths click ADVANCED OPTIONS')
def input_the_nfs2_dataset_path_in_paths_click_advanced_options(driver):
    """input the nfs2 dataset path in Paths click ADVANCED OPTIONS."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys('/mnt/tank/nfs2')
    if is_element_present(driver, '//button[@ix-auto="button__ADVANCED OPTIONS"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()


@then('click on Read Only checkbox to enable read-only')
def click_on_read_only_checkbox_to_enable_readonly(driver):
    """click on Read Only checkbox to enable read-only."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Read Only"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Read Only"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Read Only"]').click()


@then('input nobody in Mapall User input nogroup in Mapall Group')
def input_nobody_in_mapall_user_input_nogroup_in_mapall_group(driver):
    """input nobody in Mapall User input nogroup in Mapall Group."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Mapall User") and contains(@class,"mat-form-field-infix")]//input', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Mapall User") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Mapall User") and contains(@class,"mat-form-field-infix")]//input').send_keys('nobody')
    driver.find_element_by_xpath('//div[contains(.,"Mapall Group") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Mapall Group") and contains(@class,"mat-form-field-infix")]//input').send_keys('nogroup')


@then('click Submit, the new share should be created without error')
def click_submit_the_new_share_should_be_created_without_error(driver):
    """click Submit, the new share should be created without error."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"/mnt/tank/nfs2")]')


@then('create a directory on the <client> with <password>')
def create_a_directory_on_the_client_with_password(driver, client, password):
    """create a directory on the <client> with <password>."""
    global host, passwd
    host = client
    passwd = password
    cmd = f'mkdir -p {mountpoint}'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)


@then('mount the NAS share to the mountpoint directory')
def mount_the_nas_share_to_the_mountpoint_directory(driver, nas_ip):
    """mount the NAS share to the mountpoint directory."""
    cmd = f'mount_nfs {nas_ip}:/mnt/tank/nfs2 {mountpoint}'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)


@then('create a file in the mountpoint it should fail with Read-only file system')
def create_a_file_in_the_mountpoint_it_should_fail_with_Read_only_file_system(driver):
    """create a file in the mountpoint it should fail with Read-only file system."""
    cmd = f'touch {mountpoint}/mydir/myfile.txt'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'] is False, str(login_results)


@then('umount the mountpoint and delete the mountpoint directory')
def umount_the_mountpoint_and_delete_the_mountpoint_directory(driver):
    """umount the mountpoint and delete the mountpoint directory."""
    cmd = f'umount {mountpoint} && rm -rf {mountpoint}'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)
