# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

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
        'navPlugins' : '//*[@id="nav-9"]/div/a[1]',
        'submenuAvailable' : '//*[@id="9-0"]',
        'submenuInstalled' : '//*[@id="9-1"]',
        'listItemcount' : '//*[@id="entity-table-component"]/div[3]/mat-paginator/div/div[1]/mat-form-field/div/div[1]/div',
        'count100' : '//*[text()="100"][@class="mat-option-text"]'
        }

class plugin_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_00_nav_plug_available(self):
        try:
            # Click PLugin menu
            print (" navigating to the Install submenu")
            a = driver.find_element_by_xpath(xpaths['navPlugins'])
            a.click()
            # allowing the button to load
            time.sleep(1)
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuAvailable']).click()
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Available" in page_data)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_01_01_show100_plugins(self):
        try:
            print ("Changing list from 10 to 100 ")
            time.sleep(2)
            #click on the list
            driver.find_element_by_xpath(xpaths['listItemcount']).click()
            time.sleep(1)
            driver.find_element_by_xpath(xpaths['count100']).click()
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_02_00_install_plugin_jenkin(self):
        try:
            print ("Installing jenkins plugin")
            # finding jenkin plugin
            function.plugin_install(driver, self, "install", "Jenkins")
            time.sleep(20)
            #taking screenshot
            function.screenshot(driver, self)
            wait = WebDriverWait(driver, 120)
            element = wait.until(EC.element_to_be_clickable((By.XPATH, xpaths['submenuAvailable'])))
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    # Next step-- To check if the new user is present in the list via automation


    # method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    def error_check(self):
        if self.is_element_present(By.XPATH,'/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p'):
            ui_element=driver.find_element_by_xpath('/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p')
            error_element=ui_element.text
            print (error_element)
            driver.find_element_by_xpath('/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[2]/button').click()


    @classmethod
    def tearDownClass(inst):
        pass

def run_plugin_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(plugin_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
