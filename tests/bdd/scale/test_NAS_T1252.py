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


@scenario('features/NAS-T1252.feature', 'Verify that you can change a group name')
def test_verify_that_you_can_change_a_group_name():
    """Verify that you can change a group name."""


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
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_Group, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_Group).click()


@then('on the Groups page expand QE group and click edit')
def on_the_groups_page_expand_qe_group_and_click_edit(driver):
    """on the Groups page expand QE group and click edit."""
    assert wait_on_element(driver, 10, xpaths.groups.title)
    assert wait_on_element(driver, 10, xpaths.groups.qetest_Expend, 'clickable')
    driver.find_element_by_xpath(xpaths.groups.qetest_Expend).click()
    assert wait_on_element(driver, 7, xpaths.groups.edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.groups.edit_Button).click()


@then('change the group name from qetest to qatest and click save')
def change_the_group_name_from_qetest_to_qatest_and_click_save(driver):
    """change the group name from qetest to qatest and click save."""
    assert wait_on_element(driver, 10, xpaths.add_Group.edit_Title)
    assert wait_on_element(driver, 7, xpaths.add_Group.name_Input)
    driver.find_element_by_xpath(xpaths.add_Group.name_Input).clear()
    driver.find_element_by_xpath(xpaths.add_Group.name_Input).send_keys('qatest')
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('verify that the group name shows as qatest')
def verify_that_the_group_name_shows_as_qatest(driver):
    """verify that the group name shows as qatest."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.groups.title)
    assert wait_on_element(driver, 5, xpaths.groups.qatest_Name)
