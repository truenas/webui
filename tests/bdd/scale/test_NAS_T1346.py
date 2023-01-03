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
    when
)


@scenario('features/NAS-T1346.feature', 'Apps Page - Validate machinaris')
def test_apps_page__validate_machinaris():
    """Apps Page - Validate machinaris."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
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
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the Dashboard, click on apps')
def on_the_dashboard_click_on_apps(driver):
    """on the Dashboard, click on apps."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 10, xpaths.sideMenu.apps, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.apps).click()


@then('Stop Chia from running')
def stop_chia_from_running(driver):
    """Stop Chia from running."""
    if is_element_present(driver, '//mat-ink-bar[@style="visibility: visible; left: 0px; width: 183px;"]') is False:
        assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
        driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
        assert wait_on_element(driver, 7, '//h3[contains(.,"No Applications Installed")]')
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"chia")]//span[contains(.,"Stop")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"chia")]//span[contains(.,"Stop")]').click()


@then('Verify the application has stopped')
def verify_the_application_has_stopped(driver):
    """Verify the application has stopped."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Stopping")]')
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Stopping")]')
    assert wait_on_element(driver, 15, '//mat-card[contains(.,"chia-test")]//span[contains(.,"STOPPED ")]')


@then('open available applications')
def open_available_applications(driver):
    """open available applications."""
    assert wait_on_element(driver, 10, xpaths.applications.availableApplications_tab, 'clickable')
    driver.find_element_by_xpath(xpaths.applications.availableApplications_tab).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('click install')
def click_install(driver):
    """click install."""
    time.sleep(2)  # we have to wait for the page to settle down and the card to fully load
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"machinaris")]//span[contains(.,"Install")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"machinaris")]//span[contains(.,"Install")]').click()
    assert wait_on_element(driver, 5, xpaths.popup.pleaseWait)
    assert wait_on_element_disappear(driver, 30, xpaths.popup.pleaseWait)


@then('set application name')
def set_application_name(driver):
    """set application name."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"machinaris")]')
    assert wait_on_element(driver, 7, xpaths.appSetup.appName_input)
    driver.find_element_by_xpath(xpaths.appSetup.appName_input).clear()
    driver.find_element_by_xpath(xpaths.appSetup.appName_input).send_keys('machinaris-test')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Application Name"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Application Name"]').click()


@then('set networking')
def set_networking(driver):
    """set networking."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Networking"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Networking"]').click()


@then('set machinaris configuration')
def set_machinaris_configuration(driver):
    """set machinaris configuration."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Machinaris Configuration"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Machinaris Configuration"]').click()


@then('set storage')
def set_storage(driver):
    """set storage."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Storage"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Storage"]').click()


@then('set Machinaris Environment Variables')
def set_machinaris_environment_variables(driver):
    """set Machinaris Environment Variables."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Machinaris Environment Variables"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Machinaris Environment Variables"]').click()


@then('set Resource Limits')
def set_resource_limits(driver):
    """set Resource Limits."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Resource Limits"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Resource Limits"]').click()


@then('set Configure Coins')
def set_configure_coins(driver):
    """set Configure Coins."""
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__Enable Flax"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable Flax"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Configure Coins"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Configure Coins"]').click()


@then('confirm options')
def confirm_options(driver):
    """confirm options."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element(driver, 5, xpaths.popup.installing)
    assert wait_on_element_disappear(driver, 45, xpaths.popup.installing)


@then('confirm installation is successful')
def confirm_installation_is_successful(driver):
    """confirm installation is successful."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_on_element(driver, 20, '//strong[contains(.,"machinaris-test")]')
    if is_element_present(driver, '//mat-card[contains(.,"machinaris-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"machinaris-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"machinaris-test")]').click()
        if wait_on_element(driver, 5, xpaths.popup.pleaseWait):
            assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
        assert wait_on_element(driver, 10, '//div[@class="logo-container" and contains(.,"machinaris-test")]')
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Created container machinaris")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, xpaths.popup.pleaseWait):
                assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
        else:
            assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Close")]').click()
            assert wait_on_element_disappear(driver, 40, xpaths.progress.spinner)
            assert wait_on_element(driver, 300, '//mat-card[contains(.,"machinaris-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 300, '//mat-card[contains(.,"machinaris-test")]//span[@class="status active"]')
