

from source import *
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.remote.webdriver import WebDriver as RemoteWebDriver
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementNotVisibleException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

#error handling/screenshotsave
import sys
import traceback
import os
cwd = str(os.getcwd())

import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest

xpaths = {
        'navAccount' : '//*[@id="nav-1"]/div/a[1]',
        'submenuUser' : '//*[@id="1-1"]',
        'submenuGroup' : '//*[@id="1-0"]',
        'navPlugins' : '//*[@id="nav-9"]/div/a[1]',
        'submenuAvailable' : '//*[@id="9-0"]',
        'submenuInstalled' : '//*[@id="9-1"]',
        'buttonSave' : '//*[contains(text(), "Save")]',
        'navStorage' : '//*[@id="nav-5"]/div/a[1]',
        'submenuPool' : '//*[@id="5-0"]',
        'poolID' : '//*[@id="expansionpanel_zfs_',
        'submenuDisks' : '//*[@id="5-3"]',
        'poolDetach' : '//*[@id="action_button_Detach"]',
        'pooldestroyCheckbox' : '//*[@id="destroy"]/mat-checkbox/label/div',
        'poolconfirmdestroyCheckbox' : '//*[@id="confirm"]/mat-checkbox/label/div',
        'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
        'deleteButton': '//*[contains(@name, "ok_button")]',
        'detachButton': '//*[contains(@name, "Detach_button")]',
        'closeButton' : '//*[contains(text(), "Close")]'

#        'detachButton': '/html/body/div[5]/div[3]/div/mat-dialog-container/app-entity-dialog/div[3]/button[2]'
#        'closeButton' : '/html/body/div[5]/div[2]/div/mat-dialog-container/info-dialog/div[2]/button'
        }


    #method to test if an element is present
def is_element_present(driver, self, how, what):
    """
    Helper method to confirm the presence of an element on page
    :params how: By locator type
    :params what: locator value
    """
    try: driver.find_element(by=how, value=what)
    except NoSuchElementException: return False
    return True

def error_check(self):
    if self.is_element_present(By.XPATH,"/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p"):
        ui_element=driver.find_element_by_xpath("/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p")
        error_element=ui_element.text
        print (error_element)
        driver.find_element_by_xpath("/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[2]/button").click()

# screenshot function
def screenshot(driver, self):
    test_method_name = self._testMethodName
    time.sleep(1)
    text_path = os.path.dirname(os.path.realpath(__file__))
    filename = str(__file__)
    filename = filename[:-3]
    final_file = filename.replace(text_path + "/", '')
    print ("Taking screenshot for " + final_file + "-" + test_method_name)
    driver.save_screenshot(cwd + "/screenshot/"  + "screenshot-" + final_file + "-" + test_method_name + ".png")

# status check for services
def status_check(driver, which):
    ui_element_status=driver.find_element_by_xpath('/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/div[' + str(which) + ']/entity-card/div[1]/div/mat-card[1]/div/div[2]/div[1]/mat-chip')
    # get the status data
    status_data=ui_element_status.text
    print ("current status is: " + status_data)


def user_edit(driver, self, type, name):
    # the convention is set in such a way tha a single funtion can cleanup both type:user/group, name:name of the group or user
    # path plugs in the xpath of user or group , submenu{User/Group}
    # num specifies the column of the 3 dots which is different in user/group
    # delNum speifies the option number where edit is after clicking on the 3 dots
    if (type == "user"):
        num = 6
        delNum = 1
        path = "User"
        #ED = "6"
    elif (type == "group"):
        num = 5
        delNum = 2
        path = "Group"
        #ED = "5"

    # Click User submenu
    driver.find_element_by_xpath(xpaths['submenu' + path]).click()
    # wait till the list is loaded
    time.sleep(2)
    index = 1
    ui_text = "null"
    for x in range(0, 10):
        if self.is_element_present(By.XPATH, '//*[@id="entity-table-component"]/div['+ str(num) +']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div'):
            ui_element=driver.find_element_by_xpath('//*[@id="entity-table-component"]/div['+ str(num) +']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div')
            ui_text = ui_element.text
            print (ui_text)
        if (ui_text == name):
            index = x
            break
        ui_element = " "
    print ("index, delNum, num: " + str(x) + ", " + str(delNum) + "," + str(num))
    time.sleep(1)
    # click on the 3 dots
    driver.find_element_by_xpath('//*[@id="entity-table-component"]/div['+ str(num) +']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[' + str(num) + ']/div/app-entity-table-actions/div/mat-icon').click()
    time.sleep(1)
    # click on edit option
    driver.find_element_by_xpath('//*[@id="action_button_Edit"]').click()


def user_delete(driver, self, type, name):
    # the convention is set in such a way tha a single funtion can cleanup both type:user/group, name:name of the group or user
    # path plugs in the xpath of user or group , submenu{User/Group}
    # num specifies the column of the 3 dots which is different in user/group
    # delNum speifies the option number where del is after clicking on the 3 dots
    if (type == "user"):
        num = 6
        delNum = 1
        path = "User"
        plug = "bsdusr_username"
    elif (type == "group"):
        num = 5
        delNum = 2
        path = "Group"
        plug = "bsdgrp_group"

    # Click User submenu
    driver.find_element_by_xpath(xpaths['submenu' + path]).click()
    # wait till the list is loaded
    time.sleep(2)
    index = 1
    ui_text = "null"
    if (self.is_element_present(By.XPATH, '//*[@id="' + plug + '_' + name  + '\"]' )):
        print ("username/groupname- " + name + " exists")
        for x in range(0, 10):
            if self.is_element_present(By.XPATH, '//*[@id="entity-table-component"]/div['+ str(num) +']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div'):
                ui_element=driver.find_element_by_xpath('//*[@id="entity-table-component"]/div['+ str(num) +']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div')
                ui_text = ui_element.text
            if (ui_text == name):
                index = x
                break
            ui_element = " "
        print ("index, delNum, num: " + str(x) + ", " + str(delNum) + "," + str(num))
        time.sleep(1)
        # click on the 3 dots
        driver.find_element_by_xpath('//*[@id="entity-table-component"]/div['+ str(num) +']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[' + str(num) + ']/div/app-entity-table-actions/div/mat-icon').click()
        time.sleep(1)
        # click on delete option
        driver.find_element_by_xpath('//*[@id="action_button_Delete"]').click()
        if (driver.find_element_by_xpath(xpaths['confirmCheckbox'])):
            driver.find_element_by_xpath(xpaths['confirmCheckbox']).click()
            time.sleep(1)
            print ("clicking delete once")
            driver.find_element_by_xpath(xpaths['deleteButton']).click()
            time.sleep(20)
    else:
        print ("username/groupname- " + name + " does not exists..skipping")

def pool_detach(driver, self, name):
    # path plugs in the xpath of user or group , submenu{User/Group}
    # num specifies the column of the 3 dots which is different in user/group
    # delNum speifies the option number where del is after clicking on the 3 dots

    # Click Pool submenu
    driver.find_element_by_xpath(xpaths['submenuPool']).click()
    # wait till the list is loaded
    driver.find_element_by_xpath(xpaths['poolID'] + name + '"]').click()
    time.sleep(1)
    driver.find_element_by_xpath(xpaths['poolID'] + name + '"]/div/div/div[1]/div/app-entity-table-actions/div/mat-icon').click()
    driver.find_element_by_xpath(xpaths['poolDetach']).click()
    driver.find_element_by_xpath(xpaths['pooldestroyCheckbox']).click()
    driver.find_element_by_xpath(xpaths['poolconfirmdestroyCheckbox']).click()
    time.sleep(3)
    print ("clicking on detach")
    if driver.find_element_by_xpath(xpaths['detachButton']):
        print ("detach button found")
        driver.find_element_by_xpath(xpaths['detachButton']).click()
        print (" clicked on detach")
    time.sleep(32)
    print ("clicking on close")
    driver.find_element_by_xpath(xpaths['closeButton']).click()
    print ("already clicked on detach")


def plugin_install(driver, self, action, name):
    # the convention is set in such a way tha a single funtion can cleanup both type:user/group, name:name of the group or user
    # path plugs in the xpath of user or group , submenu{User/Group}
    # num specifies the column of the 3 dots which is different in user/group
    # delNum speifies the option number where edit is after clicking on the 3 dots
    if (action == "install"):
        num = 5
        delNum = 1
        path = "Available"
        #ED = "6"
    elif (action == "check"):
        num = 5
        delNum = 2
        path = "Installed"
        #ED = "5"

    # Click User submenu
    driver.find_element_by_xpath(xpaths['submenu' + path]).click()
    # wait till the list is loaded
    time.sleep(2)
    index = 1
    ui_text = "null"
    for x in range(0, 33):
        if self.is_element_present(By.XPATH, '//*[@id="entity-table-component"]/div['+ str(num) +']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div'):
            ui_element=driver.find_element_by_xpath('//*[@id="entity-table-component"]/div['+ str(num) +']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[1]/div/div')
            ui_text = ui_element.text
            print (ui_text)
        if (ui_text == name):
            index = x
            break
        ui_element = " "
    print ("index, delNum, num: " + str(x) + ", " + str(delNum) + "," + str(num))
    time.sleep(1)
    # click on the 3 dots
    driver.find_element_by_xpath('//*[@id="entity-table-component"]/div['+ str(num) +']/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[' + str(x) + ']/datatable-body-row/div[2]/datatable-body-cell[' + str(num) + ']/div/app-entity-table-actions/div/mat-icon').click()
    time.sleep(1)
    # click on install option
    driver.find_element_by_xpath('//*[@id="action_button_install"]').click()
    # click on save button
    driver.find_element_by_xpath(xpaths['buttonSave']).click()


