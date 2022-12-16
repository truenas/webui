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
from pytest_dependency import depends


@scenario('features/NAS-T1255.feature', 'Verify Groups can have duplicate GIDs')
def test_verify_groups_can_have_duplicate_gids():
    """Verify Groups can have duplicate GIDs."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['Set_Group'], scope='session')
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
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard click on Credentials and Local Groups')
def on_the_dashboard_click_on_credentials_and_local_groups(driver):
    """on the dashboard click on Credentials and Local Groups."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()


@then('on the Groups page click Add')
def on_the_groups_page_click_add(driver):
    """on the Groups page click Add."""
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__Groups_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Groups_ADD"]').click()


@then('input the group name, GID, enable duplicate gids and click save')
def input_the_group_name_gid_enable_duplicate_gids_and_click_save(driver):
    """input the group name, GID, enable duplicate gids and click save."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add Group")]')

    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="name"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').send_keys('gidtest')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="gid"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="gid"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="gid"]//input').send_keys('3333')

    assert wait_on_element(driver, 10, '//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox').click()

    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


@then('verify the group was added')
def verify_the_group_was_added(driver):
    """verify the group was added."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"gidtest")]')


@then('on the Groups page click Add again')
def on_the_groups_page_click_add_again(driver):
    """on the Groups page click Add again."""
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__Groups_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Groups_ADD"]').click()


@then('input the duplicate group name, GID, enable duplicate gids and click save')
def input_the_duplicate_group_name_gid_enable_duplicate_gids_and_click_save(driver):
    """input the duplicate group name, GID, enable duplicate gids and click save."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add Group")]')

    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="name"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').send_keys('gidtestdupe')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="gid"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="gid"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="gid"]//input').send_keys('3333')

    assert wait_on_element(driver, 10, '//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox').click()

    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


@then('verify the duplicate group was added')
def verify_the_duplicate_group_was_added(driver):
    """verify the duplicate group was added."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"gidtestdupe")]')
