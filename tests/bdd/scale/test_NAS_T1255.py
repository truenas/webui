# coding=utf-8
"""SCALE UI: feature tests."""

import time
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


@scenario('features/NAS-T1255.feature', 'Verify Groups can have duplicate GIDs')
def test_verify_groups_can_have_duplicate_gids():
    """Verify Groups can have duplicate GIDs."""


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
    time.sleep(1)
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_Group, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_Group).click()


@then('on the Groups page click Add')
def on_the_groups_page_click_add(driver):
    """on the Groups page click Add."""
    assert wait_on_element(driver, 10, xpaths.groups.title)
    assert wait_on_element(driver, 10, xpaths.button.add, 'clickable')
    driver.find_element_by_xpath(xpaths.button.add).click()


@then('input the group name, GID, enable duplicate gids and click save')
def input_the_group_name_gid_enable_duplicate_gids_and_click_save(driver):
    """input the group name, GID, enable duplicate gids and click save."""
    assert wait_on_element(driver, 7, xpaths.add_Group.title)

    assert wait_on_element(driver, 7, xpaths.add_Group.name_Input)
    driver.find_element_by_xpath(xpaths.add_Group.name_Input).clear()
    driver.find_element_by_xpath(xpaths.add_Group.name_Input).send_keys('gidtest')
    assert wait_on_element(driver, 7, xpaths.add_Group.gid_Input)
    driver.find_element_by_xpath(xpaths.add_Group.gid_Input).clear()
    driver.find_element_by_xpath(xpaths.add_Group.gid_Input).send_keys('3333')

    assert wait_on_element(driver, 10, xpaths.add_Group.allow_Duplicate_Gid_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Group.allow_Duplicate_Gid_Checkbox).click()

    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('verify the group was added')
def verify_the_group_was_added(driver):
    """verify the group was added."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.groups.title)
    assert wait_on_element(driver, 10, '//div[contains(.,"gidtest")]')


@then('on the Groups page click Add again')
def on_the_groups_page_click_add_again(driver):
    """on the Groups page click Add again."""
    assert wait_on_element(driver, 10, xpaths.groups.title)
    assert wait_on_element(driver, 10, xpaths.button.add, 'clickable')
    driver.find_element_by_xpath(xpaths.button.add).click()


@then('input the duplicate group name, GID, enable duplicate gids and click save')
def input_the_duplicate_group_name_gid_enable_duplicate_gids_and_click_save(driver):
    """input the duplicate group name, GID, enable duplicate gids and click save."""
    assert wait_on_element(driver, 7, xpaths.add_Group.title)

    assert wait_on_element(driver, 7, xpaths.add_Group.name_Input)
    driver.find_element_by_xpath(xpaths.add_Group.name_Input).clear()
    driver.find_element_by_xpath(xpaths.add_Group.name_Input).send_keys('gidtestdupe')
    assert wait_on_element(driver, 7, xpaths.add_Group.gid_Input)
    driver.find_element_by_xpath(xpaths.add_Group.gid_Input).clear()
    driver.find_element_by_xpath(xpaths.add_Group.gid_Input).send_keys('3333')

    assert wait_on_element(driver, 10, xpaths.add_Group.allow_Duplicate_Gid_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Group.allow_Duplicate_Gid_Checkbox).click()

    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('verify the duplicate group was added')
def verify_the_duplicate_group_was_added(driver):
    """verify the duplicate group was added."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.groups.title)
    assert wait_on_element(driver, 10, xpaths.groups.gidtestdupe_Name)
