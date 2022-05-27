# coding=utf-8
"""SCALE UI: feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    ssh_cmd,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1093.feature', 'Disable password for a user')
def test_disable_password_for_a_user():
    """Disable password for a user."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard, click on the Accounts on the side menu, click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users(driver):
    """you should be on the dashboard, click on the Accounts on the side menu, click on Users."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


@when('the Users page should open, click the Greater-Than-Sign, the User Field should expand down, then click the Edit button')
def the_users_page_should_open_click_the_greaterthansign_the_user_field_should_expand_down_then_click_the_edit_button(driver):
    """the Users page should open, click the Greater-Than-Sign, the User Field should expand down, then click the Edit button."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


@then('the User Edit Page should open, change "Disable Password" to Yes and click save')
def the_user_edit_page_should_open_change_disable_password_to_yes_and_click_save(driver):
    """the User Edit Page should open, change "Disable Password" to Yes and click save."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    #driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    assert wait_on_element(driver, 3, '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label', 'clickable')
    driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    value_exist = attribute_value_exist(driver, '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


@then('change should be saved, open the user page and verify the user Disable Password is true')
def change_should_be_saved_open_the_user_page_and_verify_the_user_disable_password_is_true(driver):
    """change should be saved, open the user page and verify the user Disable Password is true."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Users")]')


@then('try login with ssh, the user should not be able to login')
def try_login_with_ssh_the_user_should_not_be_able_to_login(driver, nas_ip):
    """try login with ssh, the user should not be able to login."""
    time.sleep(1)
    # check SSH
    global ssh_result
    ssh_result = ssh_cmd('ls', 'ericbsd', 'testing', nas_ip)
    assert not ssh_result['result'], ssh_result['output']
    assert 'syslog' not in ssh_result['output'], ssh_result['output']
