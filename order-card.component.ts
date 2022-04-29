import { HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MzToastService } from 'ngx-materialize';
import { CustomGreaterThanTenNumberValidator } from '../../general/directives/custom-validation/custom-greaterthanten-validator.directive';
import { CustomOnlyWholeNumberValidator } from '../../general/directives/custom-validation/custom-onlywholenumber-validator.directive';
import { DialogOptionsModel, IDialogData } from '../../general/modal-popup/dialog.model';
import { DialogService } from '../../general/modal-popup/dialog.service';
import { SubmitService } from '../../general/services/submit/submit.service';
import { PrepaidConstants } from '../helpers/prepaid-constants';
import { OrderCardPopupComponent } from '../order-card-popup/order-card-popup.component';
import { PrepaidCardService } from '../services/prepaid-card.service';

@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.css']
})
export class OrderCardComponent implements OnInit {
  isShow: boolean=false;
  orderCardCtl: FormGroup;
  noOFCardCtrl: FormControl;
  jsondata: any = [];
  datalist: any;
  isLoaded: boolean = false;
  isViewShow: boolean = false;
  isDataSave:any;
  cardPriceList = [];
  cardDiscountList = [];
  noOfCard: any;
  activeLable: boolean = false;


  constructor(private formBuilder: FormBuilder, private dialogService: DialogService,
    private submitService: SubmitService, private toastService: MzToastService, private PopupService: PrepaidCardService, public translate: TranslateService) {

    this.orderCardCtl = formBuilder.group(
      {
        noOFCardCtrl: ['', [Validators.required, CustomOnlyWholeNumberValidator.validate()]]
      });
      }


  ngOnInit() {
    this.PopupService.isOrderDataSaveGet.subscribe(data => {
      if (data == 'Success') {
        this.isLoaded = false;
        this.getCardOrderList();
      }
      else {
        this.getCardOrderList();
        this.isShow = false;
        this.ViewPlans(0);
      }
    });

  }

  ViewPlans(event) {
    console.log(event);
    this.noOfCard = event;
    if (event == -1 && this.orderCardCtl.get('noOFCardCtrl').value > 0) {
      this.noOfCard = this.orderCardCtl.get('noOFCardCtrl').value;
      this.isShow = true;
    }
    else if (event != -1 && event != 0) {
      this.orderCardCtl.get('noOFCardCtrl').setValue(event);
      this.isShow = true;
    }
    else if (event == 0) {
      this.noOfCard = event;
    }
    else {
      this.noOfCard = null;
      this.isShow = false;
    }

    if (this.noOfCard != null) {
      this.submitService.getData(PrepaidConstants.PREPAID_CARD_PRICE_LIST_API + "?OnOfCard=" + this.noOfCard)
        .subscribe(data => {
          if (data.type == HttpEventType.Response) {
            if (data.body != undefined && data.body.length > 0) {
              if (event == 0) {
                this.cardDiscountList = data.body;
                this.isViewShow = true;
              }
              else {
                this.cardPriceList = null;
                this.cardPriceList = data.body;
              }
            } else {
              this.isShow = false;
            }
          }
        }, error => {
          this.toastService.show(error.error.message, 4000, 'red');
        });
  }
  }
  getCardOrderList() {
    this.submitService.getData(PrepaidConstants.PREPAID_CARD_ORDER_DETAILS_GET_API)
      .subscribe(data => {
        if (data.body != null && data.body != undefined && data.body.length > 0) {
          this.datalist = data.body;
          this.jsondata =
          {
            "column": [
              { 'header': 'Order Date', 'columnDef': 'inserted_on' },
              { 'header': 'Order Id', 'columnDef': 'tran_id' },
              { 'header': 'Numer Of Card', 'columnDef': 'no_of_card' },
              { 'header': 'Amount Per Card', 'columnDef': 'amount_per_card' },
              { 'header': 'Total Amount', 'columnDef': 'total_amount' },
              { 'header': 'Order Status', 'columnDef': 'transaction_status' },
              { 'header': 'Delivery Address', 'columnDef': 'delivery_address' },
              { 'header': 'Delivery Status', 'columnDef': 'delivery_status' },
              { 'header': 'Source', 'columnDef': 'source' },

            ],
            "data": data.body
          };
          this.isLoaded = true;
        }
        else { this.datalist = null; this.jsondata = null;}
      }, error => {
        this.toastService.show(error.error.message, 4000, 'red');
      });
  }

  orderShow() {

    var discountData = {
      no_of_card: this.noOfCard,
      amount_per_card: this.cardPriceList[0].amount_per_card,
      total_amount: this.cardPriceList[0].total_amount
    };

    this.PopupService.setDiscountData(discountData);
    this.showCustomDialog();
  }
  showCustomDialog() {
    let options = new DialogOptionsModel<IDialogData>();
    this.dialogService.ShowDialog(OrderCardPopupComponent, options);
  }
}
