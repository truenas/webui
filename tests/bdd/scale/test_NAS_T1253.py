# coding=utf-8
"""SCALE UI: feature tests."""
import os
import pytest
import reusableSeleniumCode as rsc
import time
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_sudo,
    setup_ssh_agent,
    create_key,
    add_ssh_key,
    create_group
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)
from pytest_dependency import depends


localHome = os.path.expanduser('~')
dotsshPath = f'{localHome}/.ssh'
keyPath = f'{localHome}/.ssh/ui_test_id_rsa'

setup_ssh_agent()
if os.path.isdir(dotsshPath) is False:
    os.makedirs(dotsshPath)
if os.path.exists(keyPath) is False:
    create_key(keyPath)
add_ssh_key(keyPath)


@pytest.fixture(scope='module')
def ssh_key():
    ssh_key_file = open(f'{keyPath}.pub', 'r')
    return ssh_key_file.read().strip()
    

@scenario('features/NAS-T1253.feature', 'Verify enabling sudo for group works')
def test_verify_enabling_sudo_for_group_works():
    """Verify enabling sudo for group works."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
    create_group(nas_ip, ('root', root_password), 'qatest')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the dashboard click on Credentials and Local Users')
def on_the_dashboard_click_on_credentials_and_local_users(driver):
    """on the dashboard click on Credentials and Local Users."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_User, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_User).click()


@then('create new qetestuser user add to qatest group')
def create_new_qetestuser_user_add_to_qatest_group(driver, ssh_key):
    """create new qetestuser user add to qatest group."""
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, xpaths.button.add, 'clickable')
    driver.find_element_by_xpath(xpaths.button.add).click()
    assert wait_on_element(driver, 7, xpaths.add_User.title)
    assert wait_on_element(driver, 7, xpaths.add_User.full_Name_Input)
    driver.find_element_by_xpath(xpaths.add_User.full_Name_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.full_Name_Input).send_keys('QE user')
    driver.find_element_by_xpath(xpaths.add_User.username_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.username_Input).send_keys('qetestuser')
    driver.find_element_by_xpath(xpaths.add_User.password_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.password_Input).send_keys('testing')
    driver.find_element_by_xpath(xpaths.add_User.confirm_Password_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.confirm_Password_Input).send_keys('testing')

    # Home directory is needed
    driver.find_element_by_xpath(xpaths.add_User.home_Input).clear()
    driver.find_element_by_xpath(xpaths.add_User.home_Input).send_keys('/mnt/tank')
    # this line will create the qetestuser home directory
    driver.find_element_by_xpath(xpaths.add_User.create_Home_Directory_Checkbox).click()

    # Set SSH key to test sudo
    driver.find_element_by_xpath(xpaths.add_User.ssh_Pubkey_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_User.ssh_Pubkey_Textarea).send_keys(ssh_key)

    # The default shell is nologin this test will fail with nologin
    assert wait_on_element(driver, 5, xpaths.add_User.shell_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.shell_Select).click()
    assert wait_on_element(driver, 10, xpaths.add_User.bash_Shell_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.bash_Shell_Option).click()

    assert wait_on_element(driver, 7, xpaths.add_User.auxiliary_Groups_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.auxiliary_Groups_Select).click()
    assert wait_on_element(driver, 15, xpaths.add_User.qatest_Group_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_User.qatest_Group_Option).click()

    ActionChains(driver).send_keys(Keys.TAB).perform()

    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.users.title)
    assert wait_on_element(driver, 10, '//div[contains(.,"qetestuser")]')


@then('verify user can ssh in and cannot sudo')
def verify_user_can_ssh_in_and_cannot_sudo(nas_ip):
    """verify user can ssh in and cannot sudo."""
    global sudo_results
    cmd = 'ls /'
    sudo_results = ssh_sudo(cmd, nas_ip, 'qetestuser', 'testing')
    assert "Sorry, user qetestuser is not allowed to execute" in sudo_results, str(sudo_results)


@then('click on Credentials and Local Groups')
def click_on_credentials_and_local_groups(driver):
    """click on Credentials and Local Groups."""
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.local_Group, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.local_Group).click()


@then('on the Groups page expand QE group and click edit')
def on_the_groups_page_expand_qe_group_and_click_edit(driver):
    """on the Groups page expand QE group and click edit."""
    assert wait_on_element(driver, 10, xpaths.groups.title)
    assert wait_on_element(driver, 10, xpaths.groups.qatest_Name)
    assert wait_on_element(driver, 10, xpaths.groups.qatest_Expend, 'clickable')
    driver.find_element_by_xpath(xpaths.groups.qatest_Expend).click()
    assert wait_on_element(driver, 7, xpaths.groups.edit_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.groups.edit_Button).click()


@then('check the enable sudo box and click save')
def check_the_enable_sudo_box_and_click_save(driver):
    """check the enable sudo box and click save."""
    assert wait_on_element(driver, 10, xpaths.add_Group.edit_Title)
    assert wait_on_element(driver, 7, xpaths.checkbox.sudo, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.sudo).click()
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    time.sleep(1)


@then('ssh in with qetest user and try to sudo')
def ssh_in_with_qetest_user_and_try_to_sudo(nas_ip):
    """ssh in with qetest user and try to sudo."""
    cmd = 'ls /'
    sudo_results2 = ssh_sudo(cmd, nas_ip, 'qetestuser', 'testing')
    assert "vmlinuz" in sudo_results2, str(sudo_results2)
