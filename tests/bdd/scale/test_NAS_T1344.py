# coding=utf-8
"""SCALE UI: feature tests."""

import time
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



@scenario('features/NAS-T1344.feature', 'Apps Page - Validate chia')
def test_apps_page__validate_chia():
    """Apps Page - Validate chia."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
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
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()


@then('the Apps page load, open available applications')
def the_apps_page_load_open_available_applications(driver):
    """the Apps page load, open available applications."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')


@then('click install')
def click_install(driver):
    """click install."""
    time.sleep(2)  # we have to wait for the page to settle down and the card to fully load
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"chia")]//span[contains(.,"Install")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"chia")]//span[contains(.,"Install")]').click()
    if is_element_present(driver, '//*[contains(.,"Please wait")]'):
        assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')


@then('set application name')
def set_application_name(driver):
    """set application name."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"chia")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Application Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Application Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Application Name"]').send_keys('chia-test')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Application Name"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Application Name"]').click()


@then('set storage')
def set_storage(driver):
    """set storage."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Storage"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Storage"]').click()


@then('set farmr.net configuration')
def set_farmrnet_configuration(driver):
    """set farmr.net configuration."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Farmr.net Configuration"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Farmr.net Configuration"]').click()


@then('Chia Environment Variables')
def chia_environment_variables(driver):
    """Chia Environment Variables."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Chia Environment Variables"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Chia Environment Variables"]').click()


@then('networking')
def networking(driver):
    """networking."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Networking"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Networking"]').click()


@then('confirm options')
def confirm_options(driver):
    """confirm options."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()

    assert wait_on_element(driver, 5, '//*[contains(.,"Installing")]')
    assert wait_on_element_disappear(driver, 120, '//*[contains(.,"Installing")]')


@then('confirm installation is successful')
def confirm_installation_is_successful(driver):
    """confirm installation is successful."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    time.sleep(2)  # we have to wait for the page to settle down and the card to fully load
    if is_element_present(driver, '//mat-card[contains(.,"chia-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"chia-test")]')
        assert wait_on_element(driver, 20, '//strong[contains(.,"chia-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"chia-test")]').click()
        if wait_on_element(driver, 5, '//*[contains(.,"Please wait")]'):
            assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        assert wait_on_element(driver, 10, '//div[@class="logo-container" and contains(.,"chia-test")]')
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Started container chia")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
                assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        else:
            assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Close")]').click()
            time.sleep(1)  # wait for popup to close
            # we have to change tab for UI to refresh
            assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
            driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
            assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
            driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
            assert wait_on_element(driver, 300, '//mat-card[contains(.,"chia-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 300, '//mat-card[contains(.,"chia-test")]//span[@class="status active"]')
