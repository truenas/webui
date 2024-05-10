# coding=utf-8
"""SCALE UI: feature tests."""


import pytest
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


@pytest.mark.dependency(name='First_User_Home')
@scenario('features/NAS-T1091.feature', 'Add a home directory to a user')
def test_add_a_home_directory_to_a_user():
    """Add a home directory to a user."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['First_User', 'tank_pool'], scope='session')
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


@when('you should be on the dashboard, click on the Accounts on the side menu, click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu, click on Users."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_User, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@when('the Users page should open, expand the user and click the edit button')
def the_users_page_should_open_expand_the_user_and_click_the_edit_button(driver):
    """the Users page should open, expand the user and click the edit button."""
    assert wait_on_element(driver, 5, xpaths.users.title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 5, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()
    assert wait_on_element(driver, 5, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()


@then('on the User Edit Page change the Home Directory with the pool path and click "Create Home Directory" checkbox')
def on_the_user_edit_page_change_the_home_directory_with_the_pool_path_and_click_create_home_directory_checkbox(driver):
    """on the User Edit Page change the Home Directory with the pool path and click "Create Home Directory" checkbox."""
    assert wait_on_element(driver, 5, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 7, xpaths.add_User.home_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.add_User.home_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.home_Input).send_keys('/mnt/tank')

    assert wait_on_element(driver, 10, xpaths.add_User.create_Home_Directory_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.create_Home_Directory_Checkbox).click()


@then('click save and changes should be saved, the drop-down details pane should show the home directory has changed')
def click_save_and_changes_should_be_saved_the_dropdown_details_pane_should_show_the_home_directory_has_changed(driver):
    """click save and changes should be saved, the drop-down details pane should show the home directory has changed."""
    assert wait_on_element(driver, 2, xpaths.button.save)
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element_disappear(driver, 10, '//dd[contains(text(),"/nonexistent")]')
    assert wait_on_element(driver, 5, xpaths.users.eric_Home_Directory_Text)
