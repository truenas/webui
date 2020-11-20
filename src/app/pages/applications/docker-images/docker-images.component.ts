import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-docker-images',
  templateUrl: './docker-images.component.html',
  styleUrls: ['../applications.component.scss']
})
export class DockerImagesComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    console.log('docker')
  }

}
