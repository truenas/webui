# coding=utf-8
"""SCALE UI: feature tests."""

import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1256.feature', 'Verify that you can delete a group')
def test_verify_that_you_can_delete_a_group():
    """Verify that you can delete a group."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['Set_Group'], scope='session')
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


@when('on the dashboard click on Credentials and Local Groups')
def on_the_dashboard_click_on_credentials_and_local_groups(driver):
    """on the dashboard click on Credentials and Local Groups."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 5, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 5, xpaths.side_Menu.local_Group, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_Group).click()


@then('on the Groups page click to expand the gidtestdupe entry')
def on_the_groups_page_click_to_expand_the_gidtestdupe_entry(driver):
    """on the Groups page click to expand the gidtestdupe entry."""
    assert wait_on_element(driver, 5, xpaths.groups.title)
    assert wait_on_element(driver, 5, xpaths.groups.gidtestdupe_Name)
    assert wait_on_element(driver, 5, xpaths.groups.gidtestdupe_Expend, 'clickable')
    driver.find_element_by_xpath(xpaths.groups.gidtestdupe_Expend).click()


@then('click delete, click the confirm checkbox, and click delete')
def click_delete_click_the_confirm_checkbox_and_click_delete(driver):
    """click delete, click the confirm checkbox, and click delete."""
    assert wait_on_element(driver, 7, xpaths.button.delete, 'clickable')
    driver.find_element_by_xpath(xpaths.button.delete).click()

    assert wait_on_element(driver, 5, xpaths.delete_Group.title)
    assert wait_on_element(driver, 7, xpaths.delete_Group.delete_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.delete_Group.delete_Button).click()


@then('verify the group was deleted')
def verify_the_group_was_deleted(driver):
    """verify the group was deleted."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 5, xpaths.groups.title)
    assert wait_on_element_disappear(driver, 5, xpaths.groups.gidtestdupe_Name)
