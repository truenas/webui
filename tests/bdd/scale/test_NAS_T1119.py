# coding=utf-8
"""SCALE UI: feature tests."""

import xpaths
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T1119.feature', 'Add an ACL Item and verify is preserve on the AD dataset')
def test_add_an_acl_item_and_verify_is_preserve_on_the_ad_dataset():
    """Add an ACL Item and verify is preserve on the AD dataset."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['AD_Dataset'], scope='session')
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


@when('on the Dashboard, click Dataset on the left sidebar')
def on_the_dashboard_click_dataset_on_the_left_sidebar(driver):
    """on the Dashboard, click Dataset on the left sidebar."""
    assert wait_on_element(driver, 7, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 5, xpaths.sideMenu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.datasets).click()


@then(parsers.parse('on the Dataset page click on the "{dataset_name}" tree'))
def on_the_dataset_page_click_on_the_my_ad_dataset_tree(driver, dataset_name):
    """on the Dataset page, click on the "my_ad_dataset" tree."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_tree_name('system'))
    driver.find_element_by_xpath(xpaths.dataset.pool_tree('system')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_selected('system'))
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_name(dataset_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset_name)).click()


@then('click on Edit beside Permissions card title')
def click_on_edit_beside_permissions_card_title(driver):
    """click on Edit beside Permissions card title."""
    assert wait_on_element(driver, 5, xpaths.dataset.permission_tile)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_edit_button)
    driver.find_element_by_xpath(xpaths.dataset.permission_edit_button).click()


@then('on the Edit ACL page, click on Add Item')
def on_the_edit_acl_page_click_on_add_item(driver):
    """on the Edit ACL page, click on Add Item."""
    assert wait_on_element(driver, 5, xpaths.editAcl.title)
    assert wait_on_element(driver, 5, xpaths.editAcl.addItem_button, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.addItem_button).click()


@then('the new Access Control should appear, click on who and select User')
def the_new_access_control_should_appear_click_on_who_and_select_user(driver):
    """the new Access Control should appear, click on who and select User."""
    assert wait_on_element(driver, 7, xpaths.editAcl.who_select, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.who_select).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.whoUser_option, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.whoUser_option).click()


@then(parsers.parse('in User input, enter "{username}" click the Save Access Control List'))
def in_user_input_enter_ericbsd_click_the_save_access_control_list(driver, username):
    """in User input, enter "ericbsd" click the Save Access Control List."""
    assert wait_on_element(driver, 7, xpaths.editAcl.user_combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.editAcl.user_combobox).send_keys(username)
    ActionChains(driver).send_keys(Keys.TAB).perform()
    assert wait_on_element(driver, 7, xpaths.editAcl.userInAcl(username))
    assert wait_on_element(driver, 5, xpaths.editAcl.saveAcl_button, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.saveAcl_button).click()
    assert wait_on_element(driver, 7, xpaths.popup.updatingAcl)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updatingAcl)


@then(parsers.parse('on the Permission card, verify the new ACL item "{username}" exist'))
def on_the_permission_card_verify_the_new_acl_item_ericbsd_exist(driver, username):
    """on the Permission card, verify the new ACL item "ericbsd" exist."""
    assert wait_on_element(driver, 5, xpaths.dataset.permission_tile)
    assert wait_on_element(driver, 5, xpaths.dataset.permissionUser(username))
