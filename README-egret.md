# TrueNAS WebUI

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 1.0.4. 

## Angular / Material Design

The TrueNAS WebUI is built with official Angular Material Design components and features: 

* Lazy loading
* AOT compilation
* Color Scheme / Theme Picker
* Translations
* Websockets / REST calls to the TrueNAS API

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. 

The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. 

You can also use `ng generate directive|pipe|service|class|module`.

## Examples

These examples use angular-cli to generate code in specific locations 

1. generate a 'common' Module for the 'pages' Component:

`ng generate component pages`

`ng generate module pages/common`

2. Add a component for to handle confirm dialogs in the 'pages' common module:

`ng generate component pages/common/confirm-dialog`

`ng generate service services/dialog`

3. In our 'pages' component we implement the 'dashboard' using a component, module, and routing table. Now let's add a 'linechart' component to the dashboard:

`ng generate component pages/dashboard/linechart`

**If you follow these examples when extending the TrueNAS WebUI you'll have good karma for the rest of the day.**

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
