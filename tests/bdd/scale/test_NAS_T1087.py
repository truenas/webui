# coding=utf-8
"""SCALE UI feature tests."""

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
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T1087.feature', 'Add an email to a user')
def test_add_an_email_to_a_user():
    """Add an email to a user."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['First_User'], scope='session')
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


@when('on the dashboard, click on the Accounts on the side menu, click on Users')
def on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_User, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@when('the Users page should open, click the Greater-Than-Sign right of the users')
def the_users_page_should_open_click_the_greaterthansign_right_of_the_users(driver):
    """the Users page should open, click the Greater-Than-Sign right of the users."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()


@then('the User Field should expand down, click the Edit button')
def the_user_field_should_expand_down_click_the_edit_button(driver):
    """the User Field should expand down, click the Edit button."""
    assert wait_on_element(driver, 10, xpaths.users.eric_Edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_Edit_Button).click()


@then(parsers.parse('the User Edit Page should open, change the user email "{email}" and click save'))
def the_user_edit_page_should_open_change_the_user_email_and_click_save(driver, email):
    """the User Edit Page should open, change the user email "{email}" and click save."""
    global users_email
    users_email = email
    assert wait_on_element(driver, 10, xpaths.add_User.edit_Title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 7, xpaths.add_User.email_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.add_User.email_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.email_Input).send_keys(email)
    assert wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    element = driver.find_element_by_xpath(xpaths.button.save)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('change should be saved, open the user dropdown, the email value should be visible')
def change_should_be_saved_open_the_user_dropdown_the_email_value_should_be_visible(driver):
    """change should be saved, open the user dropdown, the email value should be visible."""
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.users.eric_User, 'clickable')
    driver.find_element_by_xpath(xpaths.users.eric_User).click()
    assert wait_on_element(driver, 7, xpaths.users.eric_Edit_Button)
    assert wait_on_element(driver, 7, f'//tr[contains(.,"ericbsd")]/following-sibling::tr//dd[contains(text(),"{users_email}")]')
