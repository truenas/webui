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
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1345.feature', 'Apps Page - Validate plex')
def test_apps_page__validate_plex():
    """Apps Page - Validate plex."""


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
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"plex")]//span[contains(.,"Install")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"plex")]//span[contains(.,"Install")]').click()
    if is_element_present(driver, '//*[contains(.,"Please wait")]'):
        assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')


@then('set application name')
def set_application_name(driver):
    """set application name."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"plex")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Application Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Application Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Application Name"]').send_keys('plex-test')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Application Name"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Application Name"]').click()


@then('set plex configuration')
def set_plex_configuration(driver):
    """set plex configuration."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Plex Configuration"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Plex Configuration"]').click()


@then('set networking')
def set_networking(driver):
    """set networking."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Networking"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Networking"]').click()


@then('set storage')
def set_storage(driver):
    """set storage."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Storage"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Storage"]').click()


@then('set Scaling/Upgrade Policy')
def set_scalingupgrade_policy(driver):
    """set Scaling/Upgrade Policy."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Scaling/Upgrade Policy"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Scaling/Upgrade Policy"]').click()


@then('set Resource Reservation')
def set_resource_reservation(driver):
    """set Resource Reservation."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Resource Reservation"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Resource Reservation"]').click() 


@then('set Advanced DNS Settings')
def set_advanced_dns_settings(driver):
    """set Advanced DNS Settings."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Advanced DNS Settings"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Advanced DNS Settings"]').click()


@then('confirm options')
def confirm_options(driver):
    """confirm options."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()

    assert wait_on_element(driver, 5, '//*[contains(.,"Installing")]')
    assert wait_on_element_disappear(driver, 45, '//*[contains(.,"Installing")]')


@then('confirm installation is successful')
def confirm_installation_is_successful(driver):
    """confirm installation is successful."""
    time.sleep(2)  # we have to wait for the page to settle down and the card to fully load
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    time.sleep(2)  # we have to wait for the page to settle down and the cards to fully load
    if is_element_present(driver, '//mat-card[contains(.,"plex-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"plex-test")]')
        assert wait_on_element(driver, 20, '//strong[contains(.,"plex-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"plex-test")]').click()
        if wait_on_element(driver, 5, '//*[contains(.,"Please wait")]'):
            assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        assert wait_on_element(driver, 10, '//div[@class="logo-container" and contains(.,"plex-test")]')
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Started container plex")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
                assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        else:
            assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Close")]').click()
            time.sleep(30)  # Because of slow start up times, Plex takes another 10-15 second to switch from "Deploying to Active"  So we can either flip the page constantly or just wait and give it time.
            assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
            driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
            assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
            driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
            assert wait_on_element(driver, 300, '//mat-card[contains(.,"plex-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 300, '//mat-card[contains(.,"plex-test")]//span[@class="status active"]')
