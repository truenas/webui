# coding=utf-8
"""SCALE UI: feature tests."""

import time
from selenium.webdriver.common.keys import Keys
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_sudo
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1253.feature', 'Verify enabling sudo for group works')
def test_verify_enabling_sudo_for_group_works():
    """Verify enabling sudo for group works."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['Set_Group'], scope='session')
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


@when('on the dashboard click on Credentials and Local Users')
def on_the_dashboard_click_on_credentials_and_local_users(driver):
    """on the dashboard click on Credentials and Local Users."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.sideMenu.local_user, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.local_user).click()


@then('create new qetestuser user add to qatest group')
def create_new_qetestuser_user_add_to_qatest_group(driver):
    """create new qetestuser user add to qatest group."""
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.button.add, 'clickable')
    driver.find_element_by_xpath(xpaths.button.add).click()
    assert wait_on_element(driver, 7, xpaths.addUser.title)
    assert wait_on_element(driver, 7, xpaths.addUser.fullName_input)
    driver.find_element_by_xpath(xpaths.addUser.fullName_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.fullName_input).send_keys('QE user')
    driver.find_element_by_xpath(xpaths.addUser.username_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.username_input).send_keys('qetestuser')
    driver.find_element_by_xpath(xpaths.addUser.password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.password_input).send_keys('testing')
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).clear()
    driver.find_element_by_xpath(xpaths.addUser.confirm_password_input).send_keys('testing')
    assert wait_on_element(driver, 7, xpaths.addUser.auxiliaryGroups_select, 'clickable')
    # scroll down to Auxiliary Groups
    element = driver.find_element_by_xpath(xpaths.addUser.auxiliaryGroups_select)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 7, xpaths.addUser.auxiliaryGroups_select, 'clickable')
    driver.find_element_by_xpath(xpaths.addUser.auxiliaryGroups_select).click()
    assert wait_on_element(driver, 15, xpaths.addUser.qatestGroup_option, 'clickable')
    driver.find_element_by_xpath(xpaths.addUser.qatestGroup_option).click()
    # time.sleep(2)
    driver.find_element_by_xpath(xpaths.addUser.qatestGroup_option).send_keys(Keys.TAB)
    element = driver.find_element_by_xpath(xpaths.button.save)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, '//div[contains(.,"qetestuser")]')


@then('verify user can ssh in and cannot sudo')
def verify_user_can_ssh_in_and_cannot_sudo(driver, nas_ip):
    """verify user can ssh in and cannot sudo."""
    global sudo_results
    cmd = 'ls /'
    sudo_results = ssh_sudo(cmd, nas_ip, 'qetestuser', 'testing')
    assert "Sorry, user qetestuser is not allowed to execute" in sudo_results, str(sudo_results)


@then('click on Credentials and Local Groups')
def click_on_credentials_and_local_groups(driver):
    """click on Credentials and Local Groups."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()


@then('on the Groups page expand QE group and click edit')
def on_the_groups_page_expand_qe_group_and_click_edit(driver):
    """on the Groups page expand QE group and click edit."""
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__qatest"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__qatest"]/td').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_qatest_qatest"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_qatest_qatest"]').click()


@then('check the enable sudo box and click save')
def check_the_enable_sudo_box_and_click_save(driver):
    """check the enable sudo box and click save."""
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Edit Group")]')
    assert wait_on_element(driver, 7, '//ix-checkbox[@formcontrolname="sudo"]//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="sudo"]//mat-checkbox').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
    # give middleware time to actually do its work
    time.sleep(4)


@then('ssh in with qetest user and try to sudo')
def ssh_in_with_qetest_user_and_try_to_sudo(driver, nas_ip):
    """ssh in with qetest user and try to sudo."""
    global sudo_results2
    cmd = 'ls /'
    sudo_results2 = ssh_sudo(cmd, nas_ip, 'qetestuser', 'testing')
    assert "vmlinuz" in sudo_results2, str(sudo_results2)
