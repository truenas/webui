# coding=utf-8
"""Enterprise HA UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    put

)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1073.feature', 'Verify 2FA Login after Failover')
def test_verify_2fa_login_after_failover():
    """Verify 2FA Login after Failover."""


@given(parsers.parse('the browser is open, navigate to "{nas_host}"'))
def the_browser_is_open_navigate_to_tnbhyve03tnixsystemsnet(driver, nas_host):
    """the browser is open, navigate to "{nas_host}"."""
    global hostname
    hostname = nas_host
    if nas_host not in driver.current_url:
        driver.get(f"http://{nas_host}/ui/sessions/signin")
        time.sleep(1)


@when(parsers.parse('if the login page appears, enter "{user}" and "{password}"'))
def if_the_login_page_appears_enter_user_and_password(driver, user, password):
    """if the login page appears, enter "{user}" and "{password}"."""
    global passwd
    passwd = password
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 5, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('on the dashboard, click on Systems on the side menu, and click on 2FA')
def on_the_dashboard_click_on_systems_on_the_side_menu_and_click_on_2fa(driver):
    """on the dashboard, click on Systems on the side menu, and click on 2FA."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Reporting"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__2FA"]').click()


@then('on the Two-Factor Auth page, ensure Enable 2-Factor Auth for SSH checkbox is unset')
def on_the_twofactor_auth_page_ensure_enable_2factor_auth_for_ssh_checkbox_is_unset(driver):
    """on the Two-Factor Auth page, ensure Enable 2-Factor Auth for SSH checkbox is unset."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Two-Factor Auth")]')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Enable Two-Factor Auth for SSH"]', 'clickable')
    # if Two-Factor Auth for SSH in enable disable
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enable Two-Factor Auth for SSH"]', 'class', 'mat-checkbox-checked')
    if value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable Two-Factor Auth for SSH"]').click()


@then('click on Enable Two-Factor Authentication button then confirm')
def click_on_enable_twofactor_authentication_button_then_confirm(driver):
    """click on Enable Two-Factor Authentication button then confirm."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__ENABLE TWO-FACTOR AUTHENTICATION"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ENABLE TWO-FACTOR AUTHENTICATION"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Enable Two-Factor Authentication")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONFIRM"]').click()


@then('when Two-factor Authentication is enabled, logout')
def when_twofactor_authentication_is_enabled_logout(driver):
    """when Two-factor Authentication is enabled, logout."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//p[contains(.,"Two-factor authentication IS currently enabled")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__power"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__power"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="option__Log Out"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="option__Log Out"]').click()
    assert wait_on_element(driver, 5, '//input[@placeholder="Username"]')


@then('verify the Two-Factor Authentication code entry is visible')
def verify_the_twofactor_authentication_code_entry_is_visible(driver):
    """verify the Two-Factor Authentication code entry is visible."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Two-Factor Authentication Code"]')


@then('disable Two-Factor Authentication with API and login')
def disable_twofactor_authentication_with_api_and_login(driver):
    """disable Two-Factor Authentication with API and login."""
    results = put(hostname, 'auth/twofactor/', ('root', passwd), {"enabled": False})
    assert results.status_code == 200, results.text
    assert wait_on_element(driver, 5, '//input[@placeholder="Username"]')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(passwd)
    assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('enable Two-Factor Authentication with API')
def enable_twofactor_authentication_with_api(driver):
    """enable Two-Factor Authentication with API."""
    results = put(hostname, 'auth/twofactor/', ('root', passwd), {"enabled": True})
    assert results.status_code == 200, results.text


@then('on the dashboard, click on failover INITIATE FAILOVER')
def on_the_dashboard_click_on_failover_initiate_failover(driver):
    """on the dashboard, click on failover INITIATE FAILOVER."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 60, '//button[@ix-auto="button__INITIATE FAILOVER"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__INITIATE FAILOVER"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Initiate Failover")]')
    driver.find_element_by_xpath('//mat-checkbox').click()
    assert wait_on_element(driver, 5, '//div[2]/button[2]/span')
    driver.find_element_by_xpath('//div[2]/button[2]/span').click()


@then('wait on the login to appear')
def wait_on_the_login_to_appear(driver):
    """wait on the login to appear."""
    assert wait_on_element(driver, 60, '//input[@placeholder="Username"]')
    # wait for HA is enabled to avoid UI refreshing
    driver.refresh()
    assert wait_on_element(driver, 60, '//p[contains(.,"HA is enabled")]')
