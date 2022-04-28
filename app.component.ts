import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'sampleProject';

  constructor(private router: Router) {


  }

  ngOnInit(): void { }
  getDataByTranId(event: any) {
    let tranId = event.target.value;
    if (!!tranId) {
      this.router.navigate(['/home/reports'], { queryParams: { ID: tranId } });
    }
  }
}
