# coding=utf-8
"""SCALE UI: feature tests."""

import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers,
)
from pytest_dependency import depends


@scenario('features/NAS-T1237.feature', 'Verify Recursive and Transverse ACL Options')
def test_verify_recursive_and_transverse_acl_options():
    """Verify Recursive and Transverse ACL Options."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['tank_pool'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you are on the dashboard click on storage in the side menu')
def you_are_on_the_dashboard_click_on_storage_in_the_side_menu(driver):
    """you are on the dashboard click on storage in the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()
    assert wait_on_element(driver, 10, xpaths.storage.title)


@then(parsers.parse('Create 1st dataset {dataset_name}'))
def create_1st_dataset_rtacltest1(driver, dataset_name):
    """Create 1st dataset rt-acl-test-1."""
    assert wait_on_element(driver, 5, xpaths.storage.manageDataset_button('tank'), 'clickable')
    driver.find_element_by_xpath(xpaths.storage.manageDataset_button('tank')).click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()
    assert wait_on_element(driver, 5, xpaths.addDataset.title)
    assert wait_on_element(driver, 5, xpaths.smb.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_input).send_keys(dataset_name)
    assert wait_on_element(driver, 5, xpaths.addDataset.select_share_type)
    driver.find_element_by_xpath(xpaths.addDataset.select_share_type).click()
    assert wait_on_element(driver, 5, xpaths.addDataset.shareTypeSMB_option, 'clickable')
    driver.find_element_by_xpath(xpaths.addDataset.shareTypeSMB_option).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)


@then(parsers.parse('Create 2nd dataset {dataset_name} under rt-acl-test-1'))
def create_2nd_dataset_rtacltest2_under_rtacltest1(driver, dataset_name):
    """Create 2nd dataset rt-acl-test-2 under rt-acl-test-1."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()
    assert wait_on_element(driver, 5, xpaths.addDataset.title)
    assert wait_on_element(driver, 5, xpaths.smb.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_input).send_keys(dataset_name)
    assert wait_on_element(driver, 5, xpaths.addDataset.select_share_type)
    driver.find_element_by_xpath(xpaths.addDataset.select_share_type).click()
    assert wait_on_element(driver, 5, xpaths.addDataset.shareTypeSMB_option, 'clickable')
    driver.find_element_by_xpath(xpaths.addDataset.shareTypeSMB_option).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 5, '//span[contains(text(),"RETURN TO POOL LIST")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"RETURN TO POOL LIST")]').click()


@then('Apply ACL with both recusrive and transverse set to rt-acl-test-1')
def apply_acl_with_both_recusrive_and_transverse_set_to_rtacltest1(driver):
    """Apply ACL with both recusrive and transverse set to rt-acl-test-1."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"rt-acl-test-1")]')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//mat-icon[text()="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[text()="edit"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Item")]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Who_User"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Who_User"]').click()
    assert wait_on_element(driver, 5, '(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])')
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').send_keys("ericbsd")
    time.sleep(1)
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply permissions recursively"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply permissions recursively"]').click()
    assert wait_on_element(driver, 7, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply permissions to child datasets"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply permissions to child datasets"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 15, '//h1[contains(.,"Updating Dataset ACL")]')


@then('Verify that the ACL was set to rt-acl-test-1')
def verify_that_the_acl_was_set_to_rtacltest1(driver):
    """Verify that the ACL was set to rt-acl-test-1."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"User - ericbsd")]')


@then('Verify that the ACL was set to rt-acl-test-2')
def verify_that_the_acl_was_set_to_rtacltest2(driver):
    """Verify that the ACL was set to rt-acl-test-2."""
    assert wait_on_element(driver, 5, '//div[contains(text(),"rt-acl-test-1")]//button', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"rt-acl-test-1")]//button').click()
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-acl-test-2")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-acl-test-2")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"User - ericbsd")]')


@then(parsers.parse('Create 3rd dataset {dataset_name}'))
def create_3rd_dataset_rtacltest3(driver, dataset_name):
    """Create 3rd dataset rt-acl-test-3."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()
    assert wait_on_element(driver, 5, xpaths.addDataset.title)
    assert wait_on_element(driver, 5, xpaths.smb.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_input).send_keys(dataset_name)
    assert wait_on_element(driver, 5, xpaths.addDataset.select_share_type)
    driver.find_element_by_xpath(xpaths.addDataset.select_share_type).click()
    assert wait_on_element(driver, 5, xpaths.addDataset.shareTypeSMB_option, 'clickable')
    driver.find_element_by_xpath(xpaths.addDataset.shareTypeSMB_option).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 5, '//span[contains(text(),"RETURN TO POOL LIST")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"RETURN TO POOL LIST")]').click()


@then(parsers.parse('Create SMB share with path {path}'))
def create_smb_share_with_path_tankrtacltest1share(driver, path):
    """Create SMB share with path tank/rt-acl-test-1/share."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.shares).click()
    assert wait_on_element(driver, 5, xpaths.sharing.title)
    assert wait_on_element(driver, 7, xpaths.sharing.smbAddButton, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.smbAddButton).click()
    assert wait_on_element(driver, 5, xpaths.smb.addTitle)
    global smb_path
    smb_path = path
    assert wait_on_element(driver, 5, xpaths.smb.path_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.path_input).clear()
    driver.find_element_by_xpath(xpaths.smb.path_input).send_keys(path)
    assert wait_on_element(driver, 5, xpaths.smb.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_input).send_keys("rt-test")
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 5, xpaths.smb.description_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.description_input).clear()
    driver.find_element_by_xpath(xpaths.smb.description_input).send_keys("rt-test")
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)


@then('Apply ACL to rt-acl-test-1 with recusrive checked')
def apply_acl_to_rtacltest1_with_recusrive_checked(driver):
    """Apply ACL to rt-acl-test-1 with recusrive checked."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 10, '//div[contains(text(),"rt-acl-test-1")]')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//mat-icon[text()="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[text()="edit"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Item")]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Who_User"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Who_User"]').click()
    assert wait_on_element(driver, 5, '(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])')
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').send_keys("games")
    time.sleep(1)
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply permissions recursively"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply permissions recursively"]').click()
    assert wait_on_element(driver, 7, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 15, '//h1[contains(.,"Updating Dataset ACL")]')


@then('Verify that the ACL was not set to rt-acl-test-3')
def verify_that_the_acl_was_not_set_to_rtacltest3(driver):
    """Verify that the ACL was not set to rt-acl-test-3."""
    assert wait_on_element(driver, 5, '//div[contains(text(),"rt-acl-test-1")]//button', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"rt-acl-test-1")]//button').click()
    time.sleep(3)
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-acl-test-3")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-acl-test-3")]//mat-icon[text()="more_vert"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element_disappear(driver, 5, '//div[contains(text(),"User - games")]')


@then('Verify the SMB Share Filesystem has the ACL that was applied to rt-acl-test-1')
def verify_the_smb_share_filesystem_has_the_acl_that_was_applied_to_rtacltest1(driver):
    """Verify the SMB Share Filesystem has the ACL that was applied to rt-acl-test-1."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.shares).click()
    assert wait_on_element(driver, 5, xpaths.sharing.title)
    assert wait_on_element(driver, 5, '//mat-panel-title//h5//a[contains(.,"(SMB)")]', 'clickable')
    driver.find_element_by_xpath('//mat-panel-title//h5//a[contains(.,"(SMB)")]').click()
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-test")]//mat-icon[@ix-auto="options__rt-test"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-test")]//mat-icon[@ix-auto="options__rt-test"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__rt-test_Edit Filesystem ACL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__rt-test_Edit Filesystem ACL"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(text(),"Edit ACL")]')
    assert wait_on_element(driver, 5, '//div[contains(text(),"/mnt/tank/rt-acl-test-1/share")]')
    assert wait_on_element(driver, 5, '//div[contains(text(),"User - games")]')
