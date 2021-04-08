# coding=utf-8
"""Core feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)


@scenario('features/NAS-T1050.feature', 'Verify NFS allows Non-Root Access')
def test_verify_nfs_allows_nonroot_access(driver):
    """Verify NFS allows Non-Root Access."""


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
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Storage on the side menu, click on Pools')
def on_the_dashboard_click_on_storage_on_the_side_menu_click_on_pools(driver):
    """on the dashboard, click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 7, '//a[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"System Information")]')


@then('click on Storage on the side menu, click on Pools')
def click_on_storage_on_the_side_menu_click_on_pools(driver):
    """click on Storage on the side menu, click on Pools."""
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


@then('input nfs for Name, select Generic as Share Type and click Submit')
def input_nfs_for_name_select_generic_as_share_type_and_click_submit(driver):
    """input nfs for Name, select Generic as Share Type and click Submit."""


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""


@then('click on the nfs dataset 3 dots button, select Edit Permissions')
def click_on_the_nfs_dataset_3_dots_button_select_edit_permissions(driver):
    """click on the nfs dataset 3 dots button, select Edit Permissions."""


@then('on the Permissions page, set the user to nobody and the Group to nogroup')
def on_the_edit_acl_page_set_the_user_to_nobody_and_the_group_to_nogroup(driver):
    """on the Permissions page, set the user to nobody and the Group to nogroup."""


@then('click Save, the permissions should save without error')
def click_save_the_permissions_should_save_without_error(driver):
    """click Save, the permissions should save without error."""


@then('click on Sharing on the side menu, click on Unix Shares (NFS)')
def click_on_sharing_on_the_side_menu_click_on_unix_shares_nfs(driver):
    """click on Sharing on the side menu, click on Unix Shares (NFS)."""


@then('on the Windows Shares, click Add')
def on_the_windows_shares_click_add(driver):
    """on the Windows Shares, click Add."""


@then('input "non-root access" in the Description,')
def input_nonroot_access_in_the_description(driver):
    """input "non-root access" in the Description,."""


@then('input the nfs dataset path in Paths click ADVANCED OPTIONS')
def input_the_nfs_dataset_path_in_paths_click_advanced_options(driver):
    """input the nfs dataset path in Paths click ADVANCED OPTIONS."""


@then('input nobody in Mapall User input nogroup in Mapall Group')
def input_nobody_in_mapall_user_input_nogroup_in_mapall_group(driver):
    """input nobody in Mapall User input nogroup in Mapall Group."""


@then('click Submit, the new share should be created without error')
def click_submit_the_new_share_should_be_created_without_error(driver):
    """click Submit, the new share should be created without error."""


@then('click on service on the side menu')
def click_on_service_on_the_side_menu(driver):
    """click on service on the side menu."""


@then('on the Service page, scroll to NFS and click on the pencil')
def on_the_service_page_scroll_to_nfs_and_click_on_the_pencil(driver):
    """on the Service page, scroll to NFS and click on the pencil."""


@then('on the Other Options click Allow non-root mount checkbox')
def one_the_other_options_click_allow_nonroot_mount_checkbox(driver):
    """on the Other Options click Allow non-root mount checkbox."""


@then('click Save, then enable the NFS service')
def click_save_then_enable_the_nfs_service(driver):
    """click Save, then enable the NFS service."""


@then('create a directory on the <client> with <password>')
def create_a_directory_on_the_client(driver):
    """create a directory on the <client> with <password>."""


@then('mount the NAS share to the mountpoint directory')
def mount_the_NAS_share_to_the_mountpoint_directory(driver):
    """mount the NAS share to the mountpoint directory."""


@then('add a directory in the mountpoint and a file in the directory')
def add_a_directory_in_the_mountpoint_and_a_file_in_the_directory(driver):
    """add a directory in the mountpoint and a file in the directory."""


@then('umount the NFS share and verify the mountpoint is empty')
def umount_the_nfs_share_and_verify_the_mountpoint_is_empty(driver):
    """umount the NFS share and verify the mountpoint is empty."""


@then('mount nfs share and verify that the file is in the mountpoint')
def mount_nfs_share_and_verify_that_the_file_is_in_the_mountpoint(driver):
    """mount nfs share and verify that the file is in the mountpoint."""


@then('delete the directory in the mountpoint')
def delete_the_directory_in_the_mountpoint(driver):
    """delete the directory in the mountpoint."""


@then('umount the mountpoint and delete the mountpoint directory')
def umount_the_mountpoint_and_delete_the_mountpoint_directory(driver):
    """umount the mountpoint and delete the mountpoint directory."""
