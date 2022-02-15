# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)


@scenario('features/NAS-T1257.feature', 'Verify the ssh host key stay the same after reboot')
def test_verify_the_ssh_host_key_stay_the_same_after_reboot(driver):
    """Verify the ssh host key stay the same after reboot."""
    pass


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    elif not wait_on_element(driver, 3, '//button[@name="Power"]', 'clickable'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
        driver.refresh()
        wait_on_element(driver, 3, '//input[@data-placeholder="Username"]', 'inputable')
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


@when('on the Dashboard, get the ssh host key')
def on_the_dashboard_get_the_ssh_host_key(driver, root_password, nas_ip):
    """on the Dashboard, get the ssh host key."""
    global hostkey_before
    assert wait_on_element(driver, 10, '//h1[text()="Dashboard"]')
    results = ssh_cmd('ssh-keyscan 127.0.0.1', 'root', root_password, nas_ip)
    assert results['result'], results['output']
    hostkey_before = results['output']
    # refresh the page
    driver.refresh()
    assert wait_on_element(driver, 10, '//h1[text()="Dashboard"]')
    assert wait_on_element(driver, 5, '//span[contains(.,"System Information")]')


@then('click on the power button then Restart')
def click_on_the_power_button_then_restart(driver):
    """click on the power button then Restart."""
    assert wait_on_element(driver, 10, '//button[@name="Power"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="Power"]').click()
    assert wait_on_element(driver, 5, '//button[@name="power-restart"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="power-restart"]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Restart"]')
    assert wait_on_element(driver, 5, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 5, '//button[@name="ok_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="ok_button"]').click()


@then('wait for the login UI to come back and login')
def wait_for_the_login_ui_to_come_back_and_login(driver, root_password):
    """wait for the login UI to come back and login."""
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    time.sleep(5)
    assert wait_on_element(driver, 300, '//input[@data-placeholder="Username"]')
    driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
    assert wait_on_element(driver, 5, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('on the Dashboard click on Systems Settings then Services')
def on_the_dashboard_click_on_systems_settings_then_services(driver):
    """on the Dashboard click on Systems Settings then Services."""
    assert wait_on_element(driver, 10, '//h1[text()="Dashboard"]')
    assert wait_on_element(driver, 7, '//a[@name="System_Settings-menu"]', 'clickable')
    driver.find_element_by_xpath('//a[@name="System_Settings-menu"]').click()
    assert wait_on_element(driver, 5, '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]').click()


@then('on the Services page, verify SSH is enabled')
def on_the_services_page_verify_ssh_is_enabled(driver):
    """on the Services page, verify SSH is enabled."""
    assert wait_on_element(driver, 10, '//h1[text()="Services"]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"S3")]//button', 'clickable')
    element = driver.find_element_by_xpath('//tr[contains(.,"S3")]//button')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, '//tr[contains(.,"SSH")]//mat-slide-toggle/label', 'clickable')
    assert attribute_value_exist(driver, '//tr[contains(.,"SSH")]//mat-slide-toggle', 'class', 'mat-checked')


@then('get the ssh host key again')
def get_the_ssh_host_key_again(driver, root_password, nas_ip):
    """get the ssh host key again."""
    global hostkey_after
    results = ssh_cmd('ssh-keyscan 127.0.0.1', 'root', root_password, nas_ip)
    assert results['result'], results['output']
    hostkey_after = results['output']


@then('verify that both ssh host keys match')
def verify_that_both_ssh_host_keys_match(driver):
    """verify that both ssh host keys match."""
    for line in hostkey_after:
        assert line in hostkey_before
