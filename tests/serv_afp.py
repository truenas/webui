# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 2

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

import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest

xpaths = { 'navService': "//*[@id='nav-8']/div/a[1]",
           'turnoffConfirm': "/html/body/div[5]/div[3]/div/mat-dialog-container/app-confirm/div[2]/button[1]",
           'status': "/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/service[14]/mat-card/div[2]/div[3]/button"
         }

class configure_afp_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    def test_01_turnon_afp (self):
        print (" turning on the afp service")
        # Click Service Menu
        driver.find_element_by_xpath(xpaths['navService']).click()
        # check if the Service page is opens
        time.sleep(1)
        # get the ui element
        ui_element=driver.find_element_by_xpath("//*[@id='breadcrumb-bar']/ul/li/a")
        # get the weather data
        page_data=ui_element.text
        print ("the Page now is: " + page_data)
        # assert response
        self.assertTrue("Services" in page_data)

        # scroll down
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        self.status_change("1", "start")

    def test_02_turnoff_afp (self):
        print (" turning off the afp service")
        # Click Service Menu
        driver.find_element_by_xpath(xpaths['navService']).click()
        # scroll down
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        time.sleep(2)
        self.status_change("1", "stop")
        time.sleep(10)


    #method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    def status_change(self, which, to):
        print ("executing the status change function with input " + which + " + " + to)
        # get the ui element
        ui_element_status=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/service[" + str(which) + "]/mat-card/div[2]/div[1]/mat-chip")
        # get the status data
        status_data=ui_element_status.text
        print ("current status is: " + status_data)
        if to == "start":        
            if status_data == "STOPPED": 
                # Click on the afp toggle button
                driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/service[" + str(which) + "]/mat-card/div[2]/div[1]/button").click()
                time.sleep(1)
                print ("status has now changed to running")
            else:
                print ("the status is already " + status_data)
        elif to == "stop":
            if status_data == "RUNNING":
                #Click on the afp toggle button
                driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/service[" + str(which) + "]/mat-card/div[2]/div[1]/button").click()
                time.sleep(1)
                # re-confirming if the turning off the service
                if self.is_element_present(By.XPATH,xpaths['turnoffConfirm']):
                    driver.find_element_by_xpath(xpaths['turnoffConfirm']).click()
            else: 
                print ("the status is already" + status_data)


    @classmethod
    def tearDownClass(inst):
        pass

def run_configure_afp_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(configure_afp_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
