# coding=utf-8
"""SCALE UI: feature tests."""

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


@when('on the dashboard click on Credentials and Local Groups')
def on_the_dashboard_click_on_credentials_and_local_groups(driver):
    """on the dashboard click on Credentials and Local Groups."""
    assert wait_on_element(driver, 5, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 5, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 5, xpaths.sideMenu.local_group, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_group).click()


@then('on the Groups page click to expand the gidtestdupe entry')
def on_the_groups_page_click_to_expand_the_gidtestdupe_entry(driver):
    """on the Groups page click to expand the gidtestdupe entry."""
    assert wait_on_element(driver, 5, xpaths.groups.title)
    assert wait_on_element(driver, 5, xpaths.groups.gidtestdupe_name)
    assert wait_on_element(driver, 5, xpaths.groups.gidtestdupe_expemnd, 'clickable')
    driver.find_element_by_xpath(xpaths.groups.gidtestdupe_expemnd).click()


@then('click delete, click the confirm checkbox, and click delete')
def click_delete_click_the_confirm_checkbox_and_click_delete(driver):
    """click delete, click the confirm checkbox, and click delete."""
    assert wait_on_element(driver, 7, xpaths.button.delete, 'clickable')
    driver.find_element_by_xpath(xpaths.button.delete).click()

    assert wait_on_element(driver, 5, xpaths.deleteGroup.title)
    assert wait_on_element(driver, 7, xpaths.deleteGroup.delete_button, 'clickable')
    driver.find_element_by_xpath(xpaths.deleteGroup.delete_button).click()


@then('verify the group was deleted')
def verify_the_group_was_deleted(driver):
    """verify the group was deleted."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 5, xpaths.groups.title)
    assert wait_on_element_disappear(driver, 5, xpaths.groups.gidtestdupe_name)
