# coding=utf-8
"""SCALE UI: feature tests."""

import time
import xpaths
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
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
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you are on the dashboard click on Datasets in the side menu')
def you_are_on_the_dashboard_click_on_datasets_in_the_side_menu(driver):
    """you are on the dashboard click on Datasets in the side menu."""
    assert wait_on_element(driver, 7, xpaths.dashboard.title)
    assert wait_on_element(driver, 5, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 5, xpaths.sideMenu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.datasets).click()


@then(parsers.parse('on the Datasets page create a SMB dataset {dataset1_name} with tank'))
def on_the_datasets_page_create_a_smb_dataset_rtacltest1_with_tank(driver, dataset1_name):
    """on the Datasets page create a SMB dataset rt-acl-test-1 with tank."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 5, xpaths.dataset.pool_tree_name('tank'))
    driver.find_element_by_xpath(xpaths.dataset.pool_tree('tank')).click()
    assert wait_on_element(driver, 5, xpaths.dataset.pool_selected('tank'))
    assert wait_on_element(driver, 5, xpaths.dataset.add_dataset_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_dataset_button).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys(dataset1_name)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select)
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_Select).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_SMB_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_SMB_Option).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 7, xpaths.dataset.dataset_name(dataset1_name))


@then(parsers.parse('create a second SMB dataset {dataset2_name} under {dataset1_name}'))
def create_a_second_smb_dataset_rtacltest2_under_rtacltest1(driver, dataset2_name, dataset1_name):
    """create a second SMB dataset rt-acl-test-2 under rt-acl-test-1."""
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_name(dataset1_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset1_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset1_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.add_dataset_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_dataset_button).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys(dataset2_name)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select)
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_Select).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_SMB_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_SMB_Option).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 5, '//button[contains(.,"Return to pool list")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Return to pool list")]').click()
    assert wait_on_element(driver, 7, xpaths.dataset.dataset_name(dataset2_name))


@then(parsers.parse('apply ACL with both recursive and transverse set to {dataset1_name}'))
def apply_acl_with_both_recursive_and_transverse_set_to_rtacltest1(driver, dataset1_name):
    """apply ACL with both recursive and transverse set to rt-acl-test-1."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_name(dataset1_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset1_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset1_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_tile)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_edit_button)
    driver.find_element_by_xpath(xpaths.dataset.permission_edit_button).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.title)
    assert wait_on_element(driver, 5, xpaths.editAcl.addItem_button, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.addItem_button).click()
    assert wait_on_element(driver, 7, xpaths.editAcl.who_select, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.who_select).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.whoUser_option, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.whoUser_option).click()
    assert wait_on_element(driver, 7, xpaths.editAcl.user_combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.editAcl.user_combobox).send_keys('ericbsd')
    ActionChains(driver).send_keys(Keys.TAB).perform()

    assert wait_on_element(driver, 7, xpaths.editAcl.recursive_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.recursive_checkbox).click()

    assert wait_on_element(driver, 7, xpaths.popup.warning, 'inputable')
    assert wait_on_element(driver, 7, xpaths.checkbox.old_confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()

    assert wait_on_element(driver, 7, xpaths.editAcl.traverse_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.traverse_checkbox).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.saveAcl_button, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.saveAcl_button).click()
    assert wait_on_element(driver, 7, xpaths.popup.updatingAcl)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updatingAcl)
    assert wait_on_element(driver, 7, xpaths.dataset.title)


@then(parsers.parse('verify that the ACL was set to {dataset1_name}'))
def verify_that_the_acl_was_set_to_rtacltest1(driver, dataset1_name):
    """verify that the ACL was set to rt-acl-test-1."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_name(dataset1_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset1_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset1_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_tile)
    assert is_element_present(driver, xpaths.dataset.permissionUser('ericbsd'))


@then(parsers.parse('verify that the ACL was set to {dataset2_name}'))
def verify_that_the_acl_was_set_to_rtacltest2(driver, dataset2_name):
    """verify that the ACL was set to rt-acl-test-2."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_name(dataset2_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset2_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset2_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_tile)
    assert is_element_present(driver, xpaths.dataset.permissionUser('ericbsd'))


@then(parsers.parse('create a third SMB dataset {dataset3_name} under {dataset1_name}'))
def create_a_third_smb_dataset_rtacltest3(driver, dataset3_name, dataset1_name):
    """create a third SMB dataset rt-acl-test-3."""
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_name(dataset1_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset1_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset1_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.add_dataset_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_dataset_button).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys(dataset3_name)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select)
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_Select).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_SMB_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_SMB_Option).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 15, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 5, '//button[contains(.,"Return to pool list")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Return to pool list")]').click()
    assert wait_on_element(driver, 7, xpaths.dataset.dataset_name(dataset3_name))


@then(parsers.parse('create an SMB share with path {dataset1_path}'))
def create_an_smb_share_with_path_mnttankrtacltest1share(driver, dataset1_path):
    """create an SMB share with path /mnt/tank/rt-acl-test-1/share."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.shares).click()
    assert wait_on_element(driver, 5, xpaths.sharing.title)
    assert wait_on_element(driver, 7, xpaths.sharing.smbAddButton, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.smbAddButton).click()
    assert wait_on_element(driver, 5, xpaths.smb.addTitle)
    global smb_path
    smb_path = dataset1_path
    assert wait_on_element(driver, 5, xpaths.smb.path_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.path_input).clear()
    driver.find_element_by_xpath(xpaths.smb.path_input).send_keys(dataset1_path)
    assert wait_on_element(driver, 5, xpaths.smb.name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_Input).click()
    driver.find_element_by_xpath(xpaths.smb.name_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_Input).send_keys('rt-test')
    assert wait_on_element(driver, 5, xpaths.checkbox.enabled, 'clickable')
    checkbox_checked = attribute_value_exist(driver, xpaths.checkbox.enabled, 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath(xpaths.checkbox.enabled).click()
    assert attribute_value_exist(driver, xpaths.checkbox.enabled, 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 5, xpaths.smb.description_input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.description_input).clear()
    driver.find_element_by_xpath(xpaths.smb.description_input).send_keys('rt-test')
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 7, xpaths.popup.smbRestart_title)
    assert wait_on_element(driver, 5, xpaths.popup.smbRestart_button, 'clickable')
    driver.find_element_by_xpath(xpaths.popup.smbRestart_button).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.sharing.smbShareName('rt-test'))


@then(parsers.parse('apply ACL to {dataset1_name} with recursive checked'))
def apply_acl_to_rtacltest1_with_recusrive_checked(driver, dataset1_name):
    """apply ACL to rt-acl-test-1 with recursive checked."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.datasets).click()
    assert wait_on_element(driver, 10, xpaths.dataset.title)
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_name(dataset1_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset1_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset1_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_tile)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_edit_button)
    driver.find_element_by_xpath(xpaths.dataset.permission_edit_button).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.title)
    assert wait_on_element(driver, 5, xpaths.editAcl.addItem_button, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.addItem_button).click()
    assert wait_on_element(driver, 7, xpaths.editAcl.who_select, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.who_select).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.whoUser_option, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.whoUser_option).click()
    assert wait_on_element(driver, 7, xpaths.editAcl.user_combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.editAcl.user_combobox).send_keys('games')
    ActionChains(driver).send_keys(Keys.TAB).perform()
    assert wait_on_element(driver, 7, xpaths.editAcl.recursive_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.recursive_checkbox).click()
    assert wait_on_element(driver, 7, xpaths.popup.warning, 'inputable')
    assert wait_on_element(driver, 7, xpaths.checkbox.old_confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.saveAcl_button, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.saveAcl_button).click()
    assert wait_on_element(driver, 7, xpaths.popup.updatingAcl)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updatingAcl)
    assert wait_on_element(driver, 7, xpaths.dataset.title)


@then(parsers.parse('verify that the ACL was not set to {dataset3_name}'))
def verify_that_the_acl_was_not_set_to_rtacltest3(driver, dataset3_name):
    """verify that the ACL was not set to rt-acl-test-3."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_name(dataset3_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset3_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset3_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_tile)
    assert is_element_present(driver, xpaths.dataset.permissionUser('games')) is False


@then('verify the SMB Share Filesystem has the ACL that was applied to rt-acl-test-1')
def verify_the_smb_share_filesystem_has_the_acl_that_was_applied_to_rtacltest1(driver):
    """verify the SMB Share Filesystem has the ACL that was applied to rt-acl-test-1."""
    driver.find_element_by_xpath(xpaths.sideMenu.shares).click()
    assert wait_on_element(driver, 5, xpaths.sharing.title)
    assert wait_on_element(driver, 5, xpaths.sharing.smbPanelTitle)
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_on_element(driver, 5, xpaths.sharing.smbShareName('rt-test'))
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-test")]//button[contains(.,"security")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-test")]//button[contains(.,"security")]').click()
    assert wait_on_element(driver, 5, xpaths.editAcl.title)
    assert wait_on_element(driver, 5, f'//div[contains(text(),"{smb_path}")]')
    assert is_element_present(driver, xpaths.editAcl.userInAcl('games'))
