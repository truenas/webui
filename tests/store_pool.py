# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 6

import function
from source import *
from selenium.webdriver.common.keys import Keys
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
        'navStorage': '//*[@id="nav-5"]/div/a[1]',
        'submenuPool': '//*[@id="5-0"]',
        'addAction': '//*[@id="add_action_button"]',
        'forwardButton': '//*[@id="custom_button"]',
        'newpoolName': '//*[@id="pool-manager__name-input-field"]',
        'disk1Checkbox': '//*[@id="pool-manager__disks-da1"]/label/div',
        'disk2Checkbox': '//*[@id="pool-manager__disks-da2"]/label/div',
        'disk3Checkbox': '//*[@id="pool-manager__disks-da3"]/label/div',
        'diskselectedmoveButton': '//*[@id="vdev__add-button"]',
        'createButton': '//*[@id="pool-manager__create-button"]',
        #very important and useful
#        'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
#       or
        'confirmCheckbox': '//*[@id="confirm-dialog__confirm-checkbox"]/label/div',
#        'createpoolButton': '//*[contains(text(), "CREATE POOL")]'
#       or
        'createpoolButton': '//*[@id="confirm-dialog__action-button"]/span'
        }


class create_pool_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_nav_store_pool(self):
        try:
            self.error_check()
            # Click  Storage menu
            print (" navigating to the Storage/pool submenu")
            a = driver.find_element_by_xpath(xpaths['navStorage'])
            a.click()
            # allowing the button to load
            time.sleep(1)
            # Click Pool submenu
            driver.find_element_by_xpath(xpaths['submenuPool']).click()
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Pools" in page_data)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_02_create_newpool(self):
        try:
            print (" creating a new pool with 1 disk")
            # cancelling the tour
            if function.is_element_present(driver, self, By.XPATH, '/html/body/div[6]/div[1]/button'):
                driver.find_element_by_xpath('/html/body/div[6]/div[1]/button').click()
            time.sleep(1)
            # Click create new pool option
            driver.find_element_by_xpath(xpaths['addAction']).click()
            # Click create Pool Button
            driver.find_element_by_xpath(xpaths['forwardButton']).click()
            # Enter User Full name
            driver.find_element_by_xpath(xpaths['newpoolName']).send_keys(pool1)
            # Select the disk
            driver.find_element_by_xpath(xpaths['disk1Checkbox']).click()
            # Select the disk
            driver.find_element_by_xpath(xpaths['diskselectedmoveButton']).click()
            # Click on create new Pool button
            driver.find_element_by_xpath(xpaths['createButton']).click()
            # checkbox confirmation
            driver.find_element_by_xpath(xpaths['confirmCheckbox']).click()
            # Click Ok Button
            driver.find_element_by_xpath(xpaths['createpoolButton']).click()
            #taking screenshot
            function.screenshot(driver, self)
            self.error_check()
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_03_create_newpool2(self):
        try:
            print (" creating a new pool with 2 disk")
            # cancelling the tour
            if function.is_element_present(driver, self, By.XPATH, '/html/body/div[6]/div[1]/button'):
                driver.find_element_by_xpath('/html/body/div[6]/div[1]/button').click()
            time.sleep(1)
            # Click create new pool option
            driver.find_element_by_xpath(xpaths['addAction']).click()
            # Click create Pool Button
            driver.find_element_by_xpath(xpaths['forwardButton']).click()
            # Enter User Full name
            driver.find_element_by_xpath(xpaths['newpoolName']).send_keys(pool2)
            # Select the 2 disks
            driver.find_element_by_xpath(xpaths['disk2Checkbox']).click()
            driver.find_element_by_xpath(xpaths['disk3Checkbox']).click()
            # Select the disk
            driver.find_element_by_xpath(xpaths['diskselectedmoveButton']).click()
            # Click on create new Pool button
            driver.find_element_by_xpath(xpaths['createButton']).click()
            # checkbox confirmation
            driver.find_element_by_xpath(xpaths['confirmCheckbox']).click()
            # Click Ok Button
            driver.find_element_by_xpath(xpaths['createpoolButton']).click()
            time.sleep(60)
            #taking screenshot
            function.screenshot(driver, self)
            self.error_check()
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_04_close_navStorage(self):
        try:
            print (" closing Storage menu")
            driver.find_element_by_xpath(xpaths['navStorage']).click()
            function.screenshot(driver, self)
            time.sleep(20)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")




    # Next step-- To check if the new user is present in the list via automation


    def error_check(self):
        if function.is_element_present(driver, self, By.XPATH, '//*[contains(text(), "Close")]'):
            if function.is_element_present(driver, self, By.XPATH,'/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
                ui_element=driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
                error_element=ui_element.text
                print (error_element)
            driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
            print ("Duplicate user cannot be created")
        if function.is_element_present(driver, self, By.XPATH, '//*[contains(text(), "Close")]'):
            if function.is_element_present(driver, self, By.XPATH,'/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
                ui_element=driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
                error_element=ui_element.text
                print (error_element)
            driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
            print ("Duplicate user cannot be created")


    def selectlist(self, element):
        for i in range(0,10):
            if function.is_element_present(driver, self, By.XPATH, '/html/body/div[4]/div[2]/div/div/md-option[' + str(i) + ']'):
                dropdown_el = driver.find_element_by_xpath('/html/body/div[4]/div[2]/div/div/md-option[' + str(i) + ']')
                dropdown_text = dropdown_el.text
                if dropdown_text == element:
                    dropdown_el.click()
                    break


    @classmethod
    def tearDownClass(inst):
        pass

def run_create_pool_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(create_pool_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
