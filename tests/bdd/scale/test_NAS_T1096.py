# coding=utf-8
"""SCALE UI: feature tests."""

import xpaths
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
)
from pytest_dependency import depends


@scenario('features/NAS-T1096.feature', 'Try change the password with mismatched passwords')
def test_try_change_the_password_with_mismatched_passwords():
    """Try change the password with mismatched passwords."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the FreeNAS URL and logged in."""
    depends(request, ['First_User'], scope='session')
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


@when('you should be on the dashboard, click on the Accounts on the side menu, click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@when('the Users page should open, click the Greater-Than-Sign, the User Field should expand down, then click the Edit button')
def the_users_page_should_open_click_the_greaterthansign_the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the Users page should open, click the Greater-Than-Sign, the User Field should expand down, then click the Edit button."""
    assert wait_on_element(driver, 7, xpaths.users.title)
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]').click()


@then('the User Edit Page should open, change the password in the 2nd field')
def the_user_edit_page_should_open_change_the_password_in_the_2nd_field(driver):
    """the User Edit Page should open, change the password in the 2nd field."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.addUser.password_input, 'inputable')
    driver.find_element_by_xpath(xpaths.addUser.password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.password_input).send_keys('testing1234')
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).send_keys('1234testing')


@then('you should not be able to save the changes and an error message should appear')
def you_should_not_be_able_to_save_the_changes_and_an_error_message_should_appear(driver):
    """you should not be able to save the changes and an error message should appear."""
    wait_on_element(driver, 3, xpaths.button.save, 'clickable')
    element = driver.find_element_by_xpath(xpaths.button.save)
    class_attribute = element.get_attribute('disabled')
    assert class_attribute == 'true'
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 3, '//h4[contains(.,"Identification")]')
    assert wait_on_element(driver, 3, '//mat-error[contains(.,"The passwords do not match.")]')
    assert wait_on_element(driver, 10, '//*[@id="close-icon"]', 'clickable')
    driver.find_element_by_xpath('//*[@id="close-icon"]').click()
