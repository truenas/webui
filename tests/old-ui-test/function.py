# /usr/bin/env python3.6

from source import *
from subprocess import run, PIPE

from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
import os
import time

cwd = str(os.getcwd())

xpaths = {
    'navAccount': '//*[@id="nav-1"]/div/a[1]',
    'submenuUser': '//*[@id="1-1"]',
    'submenuGroup': '//*[@id="1-0"]',
    'navPlugins': '//*[@id="nav-9"]/div/a[1]',
    'submenuAvailable': '//*[@id="9-0"]',
    'submenuInstalled': '//*[@id="9-1"]',
    'buttonSave': '//*[contains(text(), "Save")]',
    'navStorage': '//*[@id="nav-5"]/div/a[1]',
    'submenuPool': '//*[@id="5-0"]',
    'poolID': '//*[@id="expansionpanel_zfs_',
    'submenuDisks': '//*[@id="5-3"]',
    'poolDetach': '//*[@id="action_button_Detach"]',
    'pooldestroyCheckbox': '//*[@id="destroy"]/mat-checkbox/label/div',
    'poolconfirmdestroyCheckbox': '//*[@id="confirm"]/mat-checkbox/label/div',
    'confirmCheckbox': '//*[@id="confirm-dialog__confirm-checkbox"]/label/div',
    'confirmsecondaryCheckbox': '//*[@id="confirm-dialog__secondary-checkbox"]/label/div',
    'deleteButton': '//*[contains(@name, "ok_button")]',
    'detachButton': '//*[contains(@name, "Detach_button")]',
    'closeButton': '//*[contains(text(), "Close")]',
    'turnoffConfirm': "//span[contains(.,'STOP')]"
}

services_switch_xpath = {
    'afp': "//div[@id='overlay__AFP']",
    'dc': "//div[@id='overlay__Domain Controller']",
    'dns': "//div[@id='overlay__Dynamic DNS']",
    'nfs': "//div[@id='overlay__NFS']",
    'ftp': "//div[@id='overlay__FTP']",
    'iscsi': "//div[@id='overlay__iSCSI']",
    'lldp': "//div[@id='overlay__LLDP']",
    'smb': "//div[@id='overlay__SMB']",
    'ssh': "//div[@id='overlay__SSH']",
    'webdav': "//div[@id='overlay__WebDAV']"
}


def ssh_test(command, username, passwrd, host):
    cmd = [] if passwrd is None else ["sshpass", "-p", passwrd]
    cmd += [
        "ssh",
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "VerifyHostKeyDNS=no",
        f"{username}@{host}",
    ]
    cmd += command.split()
    process = run(cmd, stdout=PIPE, universal_newlines=True)
    output = process.stdout
    if process.returncode != 0:
        return {'result': False, 'output': output}
    else:
        return {'result': True, 'output': output}


# method to test if an element is present
def is_element_present(driver, xpath):
    try:
        driver.find_element(by=By.XPATH, value=xpath)
    except NoSuchElementException:
        return False
    return True


def wait_on_element(driver, xpath, timeout=120):
    num = 0
    while is_element_present(driver, xpath) is False:
        if num >= timeout:
            return False
        else:
            num += 1
        time.sleep(1)
    return True


def error_check(driver):
    title_xpath = "//h1[contains(.,'report_problem error')]"
    dialog_xpath = '//error-dialog/div/span'
    tearDown_xpath = "//span[contains(.,'More info...')]"
    traceback_xpath = "//div[2]/textarea"
    closeButton = '//*[contains(text(), "Close")]'
    if is_element_present(driver, title_xpath):
        dialog = driver.find_element_by_xpath(dialog_xpath)
        dialog_text = dialog.text
        driver.find_element_by_xpath(tearDown_xpath).click()
        traceback = driver.find_element_by_xpath(traceback_xpath)
        traceback_text = traceback.text
        driver.find_element_by_xpath(closeButton).click()

        return {'result': False, 'dialog': dialog_text, 'traceback': traceback_text}
    return {'result': True, 'dialog': '', 'traceback': ''}


# screenshot function
def take_screenshot(driver, scriptname, testname):
    time.sleep(1)
    png_file = cwd + "/screenshot/" + scriptname + "-" + testname + ".png"
    driver.save_screenshot(png_file)


# status check for services
def status_check(driver, which):
    toggle_status = driver.find_element_by_xpath(services_switch_xpath[which])
    status_data = toggle_status.get_attribute("class")
    print(status_data)
    if (status_data == "mat-slide-toggle mat-accent ng-star-inserted mat-checked"):
        print("current status is: RUNNING")
    else:
        print("current status is: STOPPED")
    # get the status data
    print("current status is: " + services_switch_xpath[which])


def status_change(driver, which):
    driver.find_element_by_xpath(services_switch_xpath[which]).click()
    time.sleep(2)
    if is_element_present(driver, xpaths['turnoffConfirm']):
        driver.find_element_by_xpath(xpaths['turnoffConfirm']).click()
        time.sleep(2)


def plugin_install(driver, action, name):
    # the convention is set in such a way that a single function can cleanup
    # both type:user/group, name:name of the group or user path plugs in
    # the xpath of user or group , sub-menu{User/Group} num specifies the
    # column of the 3 dots which is different in user/group delNum specifies
    # the option number where edit is after clicking on the 3 dots
    if (action == "install"):
        num = 5
        delNum = 1
        path = "Available"
        # ED = "6"
    elif (action == "check"):
        num = 5
        delNum = 2
        path = "Installed"
        # ED = "5"

    # Click User submenu
    driver.find_element_by_xpath(xpaths['submenu' + path]).click()
    # wait till the list is loaded
    time.sleep(2)
    index = 1
    ui_text = "null"
    for x in range(0, 33):
        if is_element_present(driver, '//*[@id="entity-table-component"]/div[' + str(num) + ']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div'):
            ui_element= driver.find_element_by_xpath('//*[@id="entity-table-component"]/div[' + str(num) + ']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div')
            ui_text = ui_element.text
            print(ui_text)
        if (ui_text == name):
            index = x
            break
        ui_element = " "
    print("index, delNum, num: " + str(x) + ", " + str(delNum) + "," + str(num))
    time.sleep(1)
    # click on the 3 dots
    driver.find_element_by_xpath('//*[@id="entity-table-component"]/div[' + str(num) + ']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[' + str(num) + ']/div/app-entity-table-actions/div/mat-icon').click()
    time.sleep(1)
    # click on install option
    driver.find_element_by_xpath('//*[@id="action_button_install"]').click()
    # click on save button
    driver.find_element_by_xpath(xpaths['buttonSave']).click()
