import {Component, OnInit} from '@angular/core';
import {WebSocketService} from "../../../../services/ws.service";
import {ActivatedRoute, Params} from "@angular/router";
import {RestService} from "../../../../services/rest.service";

@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent implements OnInit {

  volume;
  is_ready;
  status = {
    state: '',
    start_time: new Date(),
    end_time: new Date(),
    percentage: '',
    bytes_to_process: '',
    bytes_processed: '',
    errors: null
  };

  constructor(private ws: WebSocketService,
              private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => this.getStatusOfVolumeScrub(params.pk));
  }

  getStatusOfVolumeScrub(id) {
    this.is_ready = false;
    this.ws.call('pool.query')
      .subscribe(res => {
        let volume = res.find(x => x.id == id);
        if (volume) {
          this.is_ready = true;
          this.status.state = volume.scan.state;
          this.status.bytes_processed = volume.scan.bytes_processed;
          this.status.bytes_to_process = volume.scan.bytes_to_process;
          this.status.end_time = new Date(volume.scan.end_time.$date);
          this.status.percentage = volume.scan.percentage;
          this.status.start_time = new Date(volume.scan.start_time.$date);
          this.status.errors = volume.scan.errors;
        } else {
          this.is_ready = false;
        }
      }, err => console.log(err));
  }
}
