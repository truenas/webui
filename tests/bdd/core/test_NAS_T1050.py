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

# random mount point to avoid the same test to break if it ever run in the same time
mountpoint = f'/mnt/nfs_host{"".join(random.choices(string.digits, k=2))}'


@scenario('features/NAS-T1050.feature', 'Verify NFS allows Non-Root Access')
def test_verify_nfs_allows_nonroot_access(driver):
    """Verify NFS allows Non-Root Access."""
    if is_element_present(driver, '//li[@aria-label="page 4"]'):
        assert wait_on_element(driver, 7, '//li[@aria-label="page 2"]', 'clickable')
        driver.find_element_by_xpath('//li[@aria-label="page 2"]').click()
    else:
        # Scroll to NFS service
        assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__NFS_Running"]')
        element = driver.find_element_by_xpath('//button[@ix-auto="button__NFS_Actions"]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NFS_Actions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NFS_Actions"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Other Options")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Allow non-root mount"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Allow non-root mount"]', 'class', 'mat-checkbox-checked')
    if value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Allow non-root mount"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


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
    assert wait_on_element(driver, 10, '//div[contains(text(),"Pools")]')


@then('click on the tank pool three dots button, select Add Dataset')
def click_on_the_tank_pool_three_dots_button_select_add_dataset(driver):
    """click on the tank pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 15, '//mat-panel-title[contains(text(),"tank")]')
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then('input nfs for Name, select Generic as Share Type and click Submit')
def input_nfs_for_name_select_generic_as_share_type_and_click_submit(driver):
    """input nfs for Name, select Generic as Share Type and click Submit."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('nfs')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Share Type_Generic"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_Generic"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"nfs")]')


@then('click on the nfs dataset 3 dots button, select Edit Permissions')
def click_on_the_nfs_dataset_3_dots_button_select_edit_permissions(driver):
    """click on the nfs dataset 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__nfs"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__nfs"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__nfs_Edit Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__nfs_Edit Permissions"]').click()


@then('on the Permissions page, set the user to nobody and the Group to nogroup')
def on_the_edit_acl_page_set_the_user_to_nobody_and_the_group_to_nogroup(driver):
    """on the Permissions page, set the user to nobody and the Group to nogroup."""
    assert wait_on_element(driver, 7, '//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').send_keys('nobody')
    time.sleep(0.5)
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
    assert wait_on_element(driver, 10, '//span[contains(.,"nfs")]')


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
def input_nonroot_access_in_the_description(driver, description):
    """input "non-root access" in the Description."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Description"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)


@then('input the nfs dataset path in Paths click ADVANCED OPTIONS')
def input_the_nfs_dataset_path_in_paths_click_advanced_options(driver):
    """input the nfs dataset path in Paths click ADVANCED OPTIONS."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys('/mnt/tank/nfs')
    if is_element_present(driver, '//button[@ix-auto="button__ADVANCED OPTIONS"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()


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
    assert wait_on_element(driver, 7, '//h1[contains(.,"Enable service")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CANCEL"]', 'clickable')
    if wait_on_element(driver, 3, '//h1[contains(.,"Enable service")]'):
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__ENABLE SERVICE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__ENABLE SERVICE"]').click()
        assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
        assert wait_on_element(driver, 7, '//h1[contains(text(),"NFS Service")]')
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"/mnt/tank/nfs")]')


@then('click on service on the side menu')
def click_on_service_on_the_side_menu(driver):
    """click on service on the side menu."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()
    assert wait_on_element(driver, 5, '//li[contains(.,"Services")]')


@then('on the Service page, scroll to NFS and click on the pencil')
def on_the_service_page_scroll_to_nfs_and_click_on_the_pencil(driver):
    """on the Service page, scroll to NFS and click on the pencil."""
    if is_element_present(driver, '//li[@aria-label="page 4"]'):
        assert wait_on_element(driver, 7, '//li[@aria-label="page 2"]', 'clickable')
        driver.find_element_by_xpath('//li[@aria-label="page 2"]').click()
    else:
        # Scroll to NFS service
        assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__NFS_Running"]')
        element = driver.find_element_by_xpath('//button[@ix-auto="button__NFS_Actions"]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NFS_Actions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NFS_Actions"]').click()


@then('on the Other Options click Allow non-root mount checkbox')
def one_the_other_options_click_allow_nonroot_mount_checkbox(driver):
    """on the Other Options click Allow non-root mount checkbox."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Other Options")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Allow non-root mount"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Allow non-root mount"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Allow non-root mount"]').click()


@then('click Save, then enable the NFS service')
def click_save_then_enable_the_nfs_service(driver):
    """click Save, then enable the NFS service."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    if is_element_present(driver, '//li[@aria-label="page 4"]'):
        assert wait_on_element(driver, 7, '//li[@aria-label="page 2"]', 'clickable')
        driver.find_element_by_xpath('//li[@aria-label="page 2"]').click()
    else:
        # Scroll to NFS service
        assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__NFS_Running"]')
        element = driver.find_element_by_xpath('//button[@ix-auto="button__NFS_Actions"]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
    assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__NFS_Running"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__NFS_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__NFS_Running"]').click()


@then('create a directory on the <client> with <password>')
def create_a_directory_on_the_client(driver, client, password):
    """create a directory on the <client> with <password>."""
    global host, passwd
    host = client
    passwd = password
    cmd = f'mkdir -p {mountpoint}'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)


@then('mount the NAS share to the mountpoint directory')
def mount_the_NAS_share_to_the_mountpoint_directory(driver, nas_ip):
    """mount the NAS share to the mountpoint directory."""
    cmd = f'mount_nfs {nas_ip}:/mnt/tank/nfs {mountpoint}'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)


@then('add a directory in the mountpoint and a file in the directory')
def add_a_directory_in_the_mountpoint_and_a_file_in_the_directory(driver):
    """add a directory in the mountpoint and a file in the directory."""
    cmd = f'mkdir {mountpoint}/mydir && touch {mountpoint}/mydir/myfile.txt'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)


@then('umount the NFS share and verify the mountpoint is empty')
def umount_the_nfs_share_and_verify_the_mountpoint_is_empty(driver):
    """umount the NFS share and verify the mountpoint is empty."""
    cmd = f'umount {mountpoint}'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)
    cmd = f'test -z `ls -A -- "{mountpoint}"`'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)


@then('mount nfs share and verify that the file is in the mountpoint')
def mount_nfs_share_and_verify_that_the_file_is_in_the_mountpoint(driver, nas_ip):
    """mount nfs share and verify that the file is in the mountpoint."""
    cmd = f'mount_nfs {nas_ip}:/mnt/tank/nfs {mountpoint}'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)
    cmd = f'test -f {mountpoint}/mydir/myfile.txt'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)


@then('delete the directory in the mountpoint')
def delete_the_directory_in_the_mountpoint(driver):
    """delete the directory in the mountpoint."""
    cmd = f'rm -rf {mountpoint}/mydir'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)


@then('umount the mountpoint and delete the mountpoint directory')
def umount_the_mountpoint_and_delete_the_mountpoint_directory(driver):
    """umount the mountpoint and delete the mountpoint directory."""
    cmd = f'umount {mountpoint} && rm -rf {mountpoint}'
    login_results = ssh_cmd(cmd, 'root', passwd, host)
    assert login_results['result'], str(login_results)
