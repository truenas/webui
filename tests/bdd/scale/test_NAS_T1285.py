# coding=utf-8
"""SCALE UI: feature tests."""

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


@scenario('features/NAS-T1285.feature', 'Apps Page Validation')
def test_apps_page_validation():
    """Apps Page Validation."""


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


@then('the Apps page load, select pool')
def the_apps_page_load_select_pool(driver):
    """the Apps page load, select pool."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Choose a pool for Apps")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Pools"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Pools_tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Pools_tank"]').click()
    assert wait_on_element(driver, 7, '//button[@name="Choose_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="Choose_button"]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('the Available Applications Tab loads')
def the_available_applications_tab_loads(driver):
    """the Available Applications Tab loads."""
    # used for local testing, so you dont have to unset and reset the pool every time 
    # assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    # driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')
    assert wait_on_element(driver, 7, '//h3[contains(.,"minio")]')


@then('verify the setting slide out works')
def verify_the_setting_slide_out_works(driver):
    """verify the setting slide out works."""
    assert wait_on_element(driver, 10, '//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 10, '//span[contains(text(),"Advanced Settings")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Advanced Settings")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"Kubernetes Settings")]')
    assert wait_on_element(driver, 10, '//div[@class="ix-slidein-title-bar"]//mat-icon[contains(.,"cancel")]', 'clickable')
    driver.find_element_by_xpath('//div[@class="ix-slidein-title-bar"]//mat-icon[contains(.,"cancel")]').click()


@then('open the Installed Applications page')
def open_the_installed_applications_page(driver):
    """open the Installed Applications page."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"No Applications Installed")]')


@then('open the Manage Docker Images Page')
def open_the_manage_docker_images_page(driver):
    """open the Manage Docker Images Page."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Docker Images")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Docker Images")]').click()
    # seems like sometimes zfs-driver is present.
    assert wait_on_element(driver, 5, '//h3[contains(.,"No Docker Images")]') or wait_on_element(driver, 5, '//div[contains(.,"rancher")]')


@then('open the Manage Catalogs Page')
def open_the_manage_catalogs_page(driver):
    """open the Manage Catalogs Page."""
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Catalogs")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Catalogs")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"https://github.com/truenas/charts.git")]')
