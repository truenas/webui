# coding=utf-8
"""SCALE UI: feature tests."""

import xpaths
from function import (
    wait_on_element,
    is_element_present,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1251.feature', 'Verify that group edit page functions')
def test_verify_that_group_edit_page_functions():
    """Verify that group edit page functions."""


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
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the dashboard click on Credentials and Local Groups')
def on_the_dashboard_click_on_credentials_and_local_groups(driver):
    """on the dashboard click on Credentials and Local Groups."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_group, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_group).click()


@then('on the Groups page expand QE group and click edit')
def on_the_groups_page_expand_qe_group_and_click_edit(driver):
    """on the Groups page expand QE group and click edit."""
    assert wait_on_element(driver, 10, xpaths.groups.title)
    assert wait_on_element(driver, 10, xpaths.groups.qetest_expemnd, 'clickable')
    driver.find_element_by_xpath(xpaths.groups.qetest_expemnd).click()
    assert wait_on_element(driver, 7, xpaths.groups.edit_button, 'clickable')
    driver.find_element_by_xpath(xpaths.groups.edit_button).click()


@then('verify the edit page opens')
def verify_the_edit_page_opens(driver):
    """verify the edit page opens."""
    assert wait_on_element(driver, 10, xpaths.addGroup.edit_title)
    assert wait_on_element(driver, 7, xpaths.addGroup.name_input, 'inputable')
    assert wait_on_element(driver, 7, xpaths.button.close_icon, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close_icon).click()
