import { Component, OnInit } from '@angular/core';
import { ApplicationsService } from '../applications.service';

@Component({
  selector: 'app-docker-images',
  templateUrl: './docker-images.component.html',
  styleUrls: ['../applications.component.scss']
})
export class DockerImagesComponent implements OnInit {
  public dockerImages = [];

  constructor(private appService: ApplicationsService) { }

  ngOnInit(): void {
    this.appService.getDockerImages().subscribe(images => {
      images.forEach(image => {
        this.dockerImages.push(
          { 
            created: image.created.$date,
            size: image.size,
            update_available: image.update_available,
            repo_tags: image.repo_tags.join(', ')
          }
        )
      })
    })
  }

}
