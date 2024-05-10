# coding=utf-8
"""SCALE UI: feature tests."""

import reusableSeleniumCode as rsc
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
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('you are on the dashboard click on Datasets in the side menu')
def you_are_on_the_dashboard_click_on_datasets_in_the_side_menu(driver):
    """you are on the dashboard click on Datasets in the side menu."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 5, xpaths.side_Menu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.datasets).click()


@then(parsers.parse('on the Datasets page create a SMB dataset {dataset1_name} with tank'))
def on_the_datasets_page_create_a_smb_dataset_rtacltest1_with_tank(driver, dataset1_name):
    """on the Datasets page create a SMB dataset rt-acl-test-1 with tank."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 5, xpaths.dataset.pool_Tree_Name('tank'))
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('tank')).click()
    assert wait_on_element(driver, 5, xpaths.dataset.pool_Selected('tank'))
    assert wait_on_element(driver, 5, xpaths.dataset.add_Dataset_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_Dataset_Button).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys(dataset1_name)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select)
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_Select).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_SMB_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_SMB_Option).click()
    time.sleep(1)
    rsc.Click_On_Element(driver, xpaths.add_Dataset.create_Smb_Checkbox)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.dataset.dataset_Name(dataset1_name))


@then(parsers.parse('create a second SMB dataset {dataset2_name} under {dataset1_name}'))
def create_a_second_smb_dataset_rtacltest2_under_rtacltest1(driver, dataset2_name, dataset1_name):
    """create a second SMB dataset rt-acl-test-2 under rt-acl-test-1."""
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name(dataset1_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset1_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset1_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.add_Dataset_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_Dataset_Button).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys(dataset2_name)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select)
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_Select).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_SMB_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_SMB_Option).click()
    time.sleep(1)
    rsc.Click_On_Element(driver, xpaths.add_Dataset.create_Smb_Checkbox)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    rsc.Return_To_Pool_list(driver)
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.dataset.dataset_Name(dataset2_name))


@then(parsers.parse('apply ACL with both recursive and transverse set to {dataset1_name}'))
def apply_acl_with_both_recursive_and_transverse_set_to_rtacltest1(driver, dataset1_name):
    """apply ACL with both recursive and transverse set to rt-acl-test-1."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Name(dataset1_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset1_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset1_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Edit_Button)
    driver.find_element_by_xpath(xpaths.dataset.permission_Edit_Button).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.title)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.add_Item_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.add_Item_Button).click()
    assert wait_on_element(driver, 7, xpaths.edit_Acl.who_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.who_Select).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.who_User_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.who_User_Option).click()
    assert wait_on_element(driver, 7, xpaths.edit_Acl.user_Combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Acl.user_Combobox).send_keys('ericbsd')
    ActionChains(driver).send_keys(Keys.TAB).perform()

    assert wait_on_element(driver, 7, xpaths.edit_Acl.recursive_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.recursive_Checkbox).click()

    rsc.Confirm_Warning(driver)

    assert wait_on_element(driver, 7, xpaths.edit_Acl.traverse_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.traverse_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.save_Acl_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.save_Acl_Button).click()
    assert wait_on_element(driver, 7, xpaths.popup.updating_Acl)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updating_Acl)
    assert wait_on_element(driver, 7, xpaths.dataset.title)


@then('verify that the ACL was set to rt-acl-test-1')
def verify_that_the_acl_was_set_to_rtacltest1(driver):
    """verify that the ACL was set to rt-acl-test-1."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Name('rt-acl-test-1'))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree('rt-acl-test-1'))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree('rt-acl-test-1')).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert is_element_present(driver, xpaths.dataset.permission_User('ericbsd'))


@then(parsers.parse('verify that the ACL was set to rt-acl-test-2'))
def verify_that_the_acl_was_set_to_rtacltest2(driver):
    """verify that the ACL was set to rt-acl-test-2."""
    # driver.find_element_by_xpath(xpaths.dataset.dataset_expand('tank', 'rt-acl-test-1')).click()
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Name('rt-acl-test-2'))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree('rt-acl-test-2'))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree('rt-acl-test-2')).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert is_element_present(driver, xpaths.dataset.permission_User('ericbsd'))


@then(parsers.parse('create a third SMB dataset {dataset3_name} under {dataset1_name}'))
def create_a_third_smb_dataset_rtacltest3(driver, dataset3_name, dataset1_name):
    """create a third SMB dataset rt-acl-test-3."""
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name(dataset1_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset1_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset1_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.add_Dataset_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_Dataset_Button).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys(dataset3_name)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select)
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_Select).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_SMB_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_SMB_Option).click()
    time.sleep(1)
    rsc.Click_On_Element(driver, xpaths.add_Dataset.create_Smb_Checkbox)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 5, xpaths.progress.progressbar)
    rsc.Return_To_Pool_list(driver)
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.dataset.dataset_Name(dataset3_name))


@then(parsers.parse('create an SMB share with path {dataset1_path}'))
def create_an_smb_share_with_path_mnttankrtacltest1share(driver, dataset1_path):
    """create an SMB share with path /mnt/tank/rt-acl-test-1/share."""
    assert wait_on_element(driver, 10, xpaths.side_Menu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.shares).click()
    assert wait_on_element(driver, 5, xpaths.sharing.title)
    assert wait_on_element(driver, 7, xpaths.sharing.smb_Add_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.smb_Add_Button).click()
    assert wait_on_element(driver, 5, xpaths.smb.addTitle)
    global smb_path
    smb_path = dataset1_path
    assert wait_on_element(driver, 5, xpaths.smb.path_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.path_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.path_Input).send_keys(dataset1_path)
    assert wait_on_element(driver, 5, xpaths.smb.name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_Input).click()
    driver.find_element_by_xpath(xpaths.smb.name_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_Input).send_keys('rt-test')
    rsc.set_checkbox(driver, xpaths.checkbox.enabled)
    assert wait_on_element(driver, 5, xpaths.smb.description_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.description_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.description_Input).send_keys('rt-test')
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    rsc.Start_Or_Restart_SMB_Service(driver)
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Share_Name('rt-test'))


@then(parsers.parse('apply ACL to {dataset1_name} with recursive checked'))
def apply_acl_to_rtacltest1_with_recusrive_checked(driver, dataset1_name):
    """apply ACL to rt-acl-test-1 with recursive checked."""
    assert wait_on_element(driver, 10, xpaths.side_Menu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.datasets).click()
    assert wait_on_element(driver, 10, xpaths.dataset.title)
    assert wait_on_element(driver, 5, xpaths.dataset.pool_Tree_Name('tank'))
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('tank')).click()
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Name(dataset1_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset1_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset1_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Edit_Button)
    driver.find_element_by_xpath(xpaths.dataset.permission_Edit_Button).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.title)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.add_Item_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.add_Item_Button).click()
    assert wait_on_element(driver, 7, xpaths.edit_Acl.who_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.who_Select).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.who_User_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.who_User_Option).click()
    assert wait_on_element(driver, 7, xpaths.edit_Acl.user_Combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Acl.user_Combobox).send_keys('games')
    ActionChains(driver).send_keys(Keys.TAB).perform()
    assert wait_on_element(driver, 7, xpaths.edit_Acl.recursive_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.recursive_Checkbox).click()

    rsc.Confirm_Warning(driver)

    assert wait_on_element(driver, 5, xpaths.edit_Acl.save_Acl_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.save_Acl_Button).click()
    assert wait_on_element(driver, 7, xpaths.popup.updating_Acl)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updating_Acl)
    assert wait_on_element(driver, 7, xpaths.dataset.title)


@then(parsers.parse('verify that the ACL was not set to {dataset3_name}'))
def verify_that_the_acl_was_not_set_to_rtacltest3(driver, dataset3_name):
    """verify that the ACL was not set to rt-acl-test-3."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Name(dataset3_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset3_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset3_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert is_element_present(driver, xpaths.dataset.permission_User('games')) is False


@then('verify the SMB Share Filesystem has the ACL that was applied to rt-acl-test-1')
def verify_the_smb_share_filesystem_has_the_acl_that_was_applied_to_rtacltest1(driver):
    """verify the SMB Share Filesystem has the ACL that was applied to rt-acl-test-1."""
    driver.find_element_by_xpath(xpaths.side_Menu.shares).click()
    assert wait_on_element(driver, 5, xpaths.sharing.title)
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Panel_Title)
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Share_Name('rt-test'))
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-test")]//button[contains(.,"security")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-test")]//button[contains(.,"security")]').click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.title)
    assert wait_on_element(driver, 5, f'//div[contains(text(),"{smb_path}")]')
    assert is_element_present(driver, xpaths.edit_Acl.user_In_Acl('games'))
