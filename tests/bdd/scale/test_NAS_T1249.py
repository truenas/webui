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


@scenario('features/NAS-T1249.feature', 'Verify a dataset can be deleted')
def test_verify_a_dataset_can_be_deleted():
    """Verify a dataset can be deleted."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['tank_pool'], scope='session')
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
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the dashboard click on storage')
def on_the_dashboard_click_on_storage(driver):
    """on the dashboard click on storage."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@then('the storage page opens click the pool config button')
def the_storage_page_opens_click_the_pool_config_button(driver):
    """the storage page opens click the pool config button."""
    assert wait_on_element(driver, 10, '//mat-icon[@id="encrypted_pool_settings_button"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="encrypted_pool_settings_button"]').click()


@then('in the dropdown click Export Disconnect')
def in_the_dropdown_click_export_disconnect(driver):
    """in the dropdown click Export Disconnect."""
    assert wait_on_element(driver, 10, '//span[contains(text(),"Export/Disconnect")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Export/Disconnect")]').click()


@then('click the checkboxes, enter name, and click export')
def click_the_checkboxes_enter_name_and_click_export(driver):
    """click the checkboxes, enter name, and click export."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Destroy data on this pool?"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Destroy data on this pool?"]').click()
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__"]').click()
    # driver.find_element_by_xpath('//input[@ix-auto="input__"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__"]').send_keys("encrypted_pool")
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__Confirm Export/Disconnect"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Confirm Export/Disconnect"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__EXPORT/DISCONNECT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EXPORT/DISCONNECT"]').click()


@then('storage page should load and the pool should be gone')
def storage_page_should_load_and_the_pool_should_be_gone(driver):
    """storage page should load and the pool should be gone."""
    assert wait_on_element(driver, 20, xpaths.button.close, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close).click()
    assert wait_on_element_disappear(driver, 10, '//div[contains(.,"encrypted_pool")]')
