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
import pytest
from pytest_dependency import depends
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1343.feature', 'Apps Page - Validate nextcloud')
def test__apps_page__validate_nextcloud():
    """SCALE UI: Apps Page - Validate nextcloud."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['App_readd_pool'], scope='session')
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
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('the Apps page load, open available applications')
def the_apps_page_load_open_available_applications(driver):
    """the Apps page load, open available applications."""
    assert wait_on_element(driver, 10, xpaths.applications.availableApplications_tab, 'clickable')
    driver.find_element_by_xpath(xpaths.applications.availableApplications_tab).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('click install')
def click_install(driver):
    """click install."""
    time.sleep(2)  # we have to wait for the page to settle down and the card to fully load
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"nextcloud")]//span[contains(.,"Install")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"nextcloud")]//span[contains(.,"Install")]').click()
    if is_element_present(driver, xpaths.popup.pleaseWait):
        assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)


@then('set application name')
def set_application_name(driver):
    """set application name."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"nextcloud")]')
    assert wait_on_element(driver, 7, xpaths.appSetup.appName_input)
    driver.find_element_by_xpath(xpaths.appSetup.appName_input).clear()
    driver.find_element_by_xpath(xpaths.appSetup.appName_input).send_keys('nextcloud-test')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Application Name"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Application Name"]').click()


@then('set nexcloud configuration')
def set_nexcloud_configuration(driver):
    """set nexcloud configuration."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Nextcloud Configuration"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Nextcloud Configuration"]').click()


@then('set storage')
def set_storage(driver):
    """set storage."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Storage"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Storage"]').click()


@then('on CronJob configuration click next')
def on_cronjob_configuration_click_next(driver):
    """on CronJob configuration click next."""
    wait_on_element(driver, 5, '//mat-step-header[contains(.,"CronJob configuration") and @tabindex="0"]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_CronJob configuration"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_CronJob configuration"]').click()


@then('set Scaling Upgrade Policy')
def set_scaling_upgrade_policy(driver):
    """set Scaling Upgrade Policy."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Scaling/Upgrade Policy"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Scaling/Upgrade Policy"]').click()


@then('Advanced DNS Settings')
def advanced_dns_settings(driver):
    """Advanced DNS Settings."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Advanced DNS Settings"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Advanced DNS Settings"]').click()


@then('set Resource Limits')
def set_resource_limits(driver):
    """set Resource Limits."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Resource Limits"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Resource Limits"]').click()


@then('confirm options')
def confirm_options(driver):
    """confirm options."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element(driver, 10, xpaths.popup.installing)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.installing)


@then('confirm installation is successful')
def confirm_installation_is_successful(driver):
    """confirm installation is successful."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_on_element(driver, 20, '//strong[contains(.,"nextcloud-test")]')
    if is_element_present(driver, '//mat-card[contains(.,"nextcloud-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"nextcloud-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"nextcloud-test")]').click()
        if wait_on_element(driver, 5, xpaths.popup.pleaseWait):
            assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
        assert wait_on_element(driver, 10, '//div[@class="logo-container" and contains(.,"nextcloud-test")]')
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Started container nextcloud")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, xpaths.popup.pleaseWait):
                assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)
        else:
            assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Close")]').click()
            assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
            assert wait_on_element(driver, 500, '//mat-card[contains(.,"nextcloud-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 500, '//mat-card[contains(.,"nextcloud-test")]//span[@class="status active"]')
