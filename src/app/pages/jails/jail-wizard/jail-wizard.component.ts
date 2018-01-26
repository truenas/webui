import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RestService, WebSocketService } from '../../../services';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'jail-wizard',
  templateUrl: 'jail-wizard.component.html'
})
export class JailWizardComponent implements OnInit{

	isLinear = false;
  	firstFormGroup: FormGroup;

	constructor(protected rest: RestService, protected ws: WebSocketService, private _formBuilder: FormBuilder) {

	}

	ngOnInit() {
		this.firstFormGroup = this._formBuilder.group({
	      firstCtrl: ['', Validators.required]
	    });
	}
}