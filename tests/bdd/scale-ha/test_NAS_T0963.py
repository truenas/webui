# coding=utf-8
"""SCALE High Availability (tn-bhyve06) feature tests."""

import pytest
import reusableSeleniumCode as rsc
import xpaths
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from function import (
    wait_on_element,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@pytest.mark.dependency(name='SMB_ACTIVE_Directory', scope='session')
@scenario('features/NAS-T963.feature', 'Add an ACL Item and verify is preserve')
def test_add_an_acl_item_and_verify_is_preserve(driver):
    """Add an ACL Item and verify is preserve."""


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_vip, request):
    """the browser is open, navigate to "{nas_url}"."""
    depends(request, ['Active_Directory'], scope='session')
    if nas_vip not in driver.current_url:
        driver.get(f"http://{nas_vip}/ui/signin")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)


@when(parsers.parse('if the login page appears, enter "{user}" and "{password}"'))
def if_the_login_page_appears_enter__user_and_password(driver, user, password):
    """if the login page appears, enter "{user}" and "{password}."""
    rsc.Login_If_Not_On_Dashboard(driver, user, password)


@then('on the Dashboard, click Dataset on the left sidebar')
def on_the_dashboard_click_dataset_on_the_left_sidebar(driver):
    """on the Dashboard, click Dataset on the left sidebar."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 5, xpaths.side_Menu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.datasets).click()


@then(parsers.parse('on the Dataset page click on the "{dataset_name}" tree'))
def on_the_dataset_page_click_on_the_my_ad_dataset_tree(driver, dataset_name):
    """on the Dataset page, click on the "my_ad_dataset" tree."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name(dataset_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset_name)).click()


@then('click on Edit beside Permissions card title')
def click_on_edit_beside_permissions_card_title(driver):
    """click on Edit beside Permissions card title."""
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Edit_Button)
    driver.find_element_by_xpath(xpaths.dataset.permission_Edit_Button).click()


@then('on the Edit ACL page, click on Add Item')
def on_the_edit_acl_page_click_on_add_item(driver):
    """on the Edit ACL page, click on Add Item."""
    assert wait_on_element(driver, 5, xpaths.edit_Acl.title)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.add_Item_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.add_Item_Button).click()


@then('the new Access Control should appear, click on who and select User')
def the_new_access_control_should_appear_click_on_who_and_select_user(driver):
    """the new Access Control should appear, click on who and select User."""
    assert wait_on_element(driver, 7, '//div[text()="User - ?"]')
    assert wait_on_element(driver, 7, xpaths.edit_Acl.who_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.who_Select).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.who_User_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.who_User_Option).click()


@then(parsers.parse('in User input, enter "{username}" click the Save Access Control List'))
def in_user_input_enter_ericbsd_click_the_save_access_control_list(driver, username):
    """in User input, enter "ericbsd" click the Save Access Control List."""
    assert wait_on_element(driver, 7, xpaths.edit_Acl.user_Combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Acl.user_Combobox).send_keys(username)
    ActionChains(driver).send_keys(Keys.TAB).perform()
    assert wait_on_element(driver, 7, xpaths.edit_Acl.user_In_Acl(username))
    assert wait_on_element(driver, 5, xpaths.edit_Acl.save_Acl_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.save_Acl_Button).click()
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updating_Acl)


@then(parsers.parse('on the Permission card, verify the new ACL item "{username}" exist'))
def on_the_permission_card_verify_the_new_acl_item_ericbsd_exist(driver, username):
    """on the Permission card, verify the new ACL item "ericbsd" exist."""
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_User(username))
