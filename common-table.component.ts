
import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter, TemplateRef } from '@angular/core';
import { ExcelService } from '../../services/convert-excel/excel.service';
import { PdfService } from '../../services/convert-pdf/pdf.service';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { MzToastService } from 'ngx-materialize';
import { SubmitService } from '../../services/submit/submit.service';
import { HttpEventType } from '@angular/common/http';
import { ServicePackConstants } from '../../../service-pack/helpers/service-pack-constants';
import { RechargeConstants } from '../../../recharge/helpers/recharge-constants';
import { RechargePopupService } from '../../../recharge/recharge-popup-service/recharge-popup-service.service';
import { DialogService } from '../../modal-popup/dialog.service';
import { DialogOptionsModel, IDialogData } from '../../modal-popup/dialog.model';
import { ComplainService } from '../../../complain/complain-service/complain-service.service';
import { Router } from '@angular/router';
import * as jsPDF from 'jspdf';
import * as html2canvas from 'html2canvas';
import { DataSharingService } from '../../services/data-sharing/data-sharing.service';
import { TransactionPopupComponent } from "../../../aeps/transaction-popup/transaction-popup.component";
import { BBPSReceiptComponent } from '../../../bbps/bbps-receipt/bbps-receipt.component';
import { VerifyOtpComponent } from '../verify-otp/verify-otp.component';
import { Constants } from '../../../general/helpers/constants';
import { Observable, Subscription } from 'rxjs';
import { TransactionReceiptComponent } from '../../../remittance/transaction-receipt/transaction-receipt.component';
import { APTransactionPopupComponent } from '../../../aadhar-pay/transaction-popup/transaction-popup.component';
import { CashDepositTransactionPopupComponent } from '../../../cash-deposit/transaction-popup/transaction-popup.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-common-table',
  templateUrl: './common-table.component.html',
  styleUrls: ['./common-table.component.css'],
})

export class CommonTableComponent {
  placeholder: any = 'Transaction Id';
  topSearch: string = 'top10';
  @Input() jsonData: any = [];
  @Input() reportName: string;
  @Input() isShowTable: boolean = false;
  myDate = new Date();
  columns: any = [];
  @ViewChild('table') table: ElementRef;
  @ViewChild('reportContent') reportContent: ElementRef;

  @Output() repeatData: EventEmitter<any> = new EventEmitter<any>();

  searchFG: FormGroup;
  searchTextCtrl: FormControl;

  isShowSearchInput: boolean;
  isSearchDataNotFound: boolean;
  colCount: number;
  isSearchShow: boolean;
  isExportShow: boolean;
  isRefundOtp: boolean = false;
  statusColumnDef: string = "status_name";

  private refresheventsSubscription: Subscription;
  @Input() refresh: Observable<void>;

  @Input("bodyc") bodyc: TemplateRef<any>;
  @Input("headc") headc: TemplateRef<any>;


  constructor(private router: Router, private fb: FormBuilder, private excelService: ExcelService, private pdfService: PdfService,
    private submitService: SubmitService, private toastService: MzToastService
    , private dialogService: DialogService, private sharing: DataSharingService,public translate:TranslateService) {
  }

  ngOnInit() {

    this.isExportShow = false;
    this.isSearchShow = false;
    if (this.jsonData.searchOnTableLoad) {
      this.showTop10();
    } else {
      this.isShowTable = true;
    }


    if (this.refresh != undefined)
      this.refresheventsSubscription = this.refresh.subscribe(() => this.showTop10());

    this.colCount = this.jsonData.column.length;

    this.isShowSearchInput = false;

    if (this.jsonData.data)
      this.jsonData.data.length == 0 ? this.isSearchDataNotFound = true : this.isSearchDataNotFound = false;

    this.columns = [];
    var colms = [];
    let index = 0;
    this.placeholder = this.jsonData.placeholder == undefined ? this.placeholder : this.jsonData.placeholder;
    this.topSearch = this.jsonData.topSearch == undefined ? this.topSearch : this.jsonData.topSearch;

    this.jsonData.column.forEach((value: object) => {
      var col1 = { "columnDef": value["columnDef"], header: value["header"], cell: (element: any) => `${element[value["columnDef"]]}` };
      colms.push(col1);
      index = index + 1;
      this.columns = colms;
    });
    var isPrint = { "columnDef": "Receipt", header: "Receipt", cell: (element: any) => '' };
    var isComplain = { "columnDef": "Complain", header: "Complain", cell: (element: any) => '' };
    var isRepeat = { "columnDef": "Repeat", header: "Repeat", cell: (element: any) => '' };
    var isSearch = { "columnDef": "Search", header: "Search", cell: (element: any) => '' };
    var isRefundOtp = { "columnDef": "VerifyRefundOtp", header: "Refund", cell: (element: any) => '' };


    if (this.jsonData.isPrint != undefined && this.jsonData.isPrint == true) {
      colms.push(isPrint);
    }

    if (this.jsonData.isComplain != undefined && this.jsonData.isComplain == true) {
      colms.push(isComplain);
    }

    if (this.jsonData.isRepeat != undefined && this.jsonData.isRepeat == true) {
      colms.push(isRepeat);
    }

    if (this.jsonData.isSearch != undefined && this.jsonData.isSearch == true) {
      this.isSearchShow = true;
    }

    if (this.jsonData.isExportShow != undefined && this.jsonData.isExportShow == true) {
      this.isExportShow = true;
    }

    if (this.jsonData.statusColumnDef != undefined && this.jsonData.statusColumnDef != null && this.jsonData.statusColumnDef != "") {
      this.statusColumnDef = this.jsonData.statusColumnDef;
    }

    if (this.jsonData.isRefundOtp != undefined && this.jsonData.isRefundOtp == true) {
      colms.push(isRefundOtp);
    }

    this.searchFG = this.fb.group({
      searchTextCtrl: ['', Validators.required]
    });
  }

  ngOnDestroy() {
    if (this.refresheventsSubscription != undefined)
      this.refresheventsSubscription.unsubscribe();
  }

  exportExcel(): void {

    this.excelService.convetTableToExcel(this.table.nativeElement, this.reportName);
  }

  exportPDF() {
    this.pdfService.exportAsPdfFile(this.table.nativeElement, this.reportName);
  }

  showSearchInput() {
    this.isShowSearchInput = true;
    this.searchFG.get('searchTextCtrl').setValue('');
  }

  showTop10() {
    this.isShowTable = false;
    this.isShowSearchInput = false;
    this.isSearchDataNotFound = false;
    if (this.jsonData.searchAPI != undefined) {
      this.getListBySearchText(this.topSearch, this.jsonData.searchServiceName);
    }
  }

  raiseComplain(row: any) {
    let complainData;
    complainData = {
      transaction_id: row.transaction_id,
      service_name: this.jsonData.searchServiceName
    }
    this.router.navigate(['/home/complain-page'], { queryParams: complainData });
  }

  searchData() {

    this.isSearchDataNotFound = false;
    let sText;
    sText = this.searchFG.get('searchTextCtrl').value;

    if (sText != '') {
      this.isShowTable = false;
      this.getListBySearchText(sText.toUpperCase(), this.jsonData.searchServiceName);
    } else {

      this.toastService.show('Search text cannot be empty', 4000, 'red');
    }
    this.isShowSearchInput = false;
  }

  getListBySearchText(search, searchFor) {
    this.jsonData.data = null;
    let l1, l2;
    l1 = search.length;
    l2 = (search.match(RegExp('\\.', 'g')) || []).length;
    if (l1 != l2) {
      this.submitService.getData(this.jsonData.searchAPI + search + '/' + searchFor)
        .subscribe(data => {

          if (data.type == HttpEventType.Response) {
            if (data.body != undefined) {
              this.jsonData.data = data.body;
              this.isShowTable = true;

            } else {
              this.isShowTable = true;
              this.isShowSearchInput = false;
              this.isSearchDataNotFound = true;
            }
          } else {
            this.isShowTable = true;
            this.isShowSearchInput = false;
            this.isSearchDataNotFound = true;

          }
        }, error => {
          this.isShowTable = true;
          this.isShowSearchInput = false;
          this.isSearchDataNotFound = true;
          this.toastService.show(error.error.message, 4000, 'red');
        });
    } else {
      this.isShowTable = true;
      this.isShowSearchInput = false;
      this.isSearchDataNotFound = true;
    }
  }

  repeatProcess(row: any) {
    this.repeatData.emit(row);
  }

  getStatusColor(status) {
    switch (status) {
      case 'Successful':
        return '#7BD80F';
      case 'Pending':
        return '#FFD300';
      case 'In Pending':
        return '#FFD300';
      case 'Refunded':
        return '#FF5F73';
    }
  }

  checkStatus(row) {
    if (row[this.jsonData.statusCheckColumn] != null && row[this.jsonData.statusCheckColumn] != undefined
      && row[this.jsonData.statusCheckColumn] != "") {
      this.submitService.getData(this.jsonData.statusCheckAPI + row[this.jsonData.statusCheckColumn])
        .subscribe(data => {
          if (data.body.sender != null && data.body.sender != undefined) { // for money transfer
            if (data.body.otp) {
              this.toastService.show(data.body.message, 4000, 'green');
              let TxnData = { sender_mobile: data.body.sender, transaction_id: row[this.jsonData.statusCheckColumn], channel_name: row.channel_name };
              this.VerifyRefundOtp(TxnData);
            }
            else {
              this.toastService.show(data.body.message, 4000, 'green');
              this.showTop10();
            }
          }
          else {
            this.toastService.show(data.body, 4000, 'green');
            this.showTop10();
          }
        }, error => {
          this.toastService.show(error.error.message, 4000, 'red');
          this.showTop10();
        });
    }
  }

  print(row: any) {
    if (this.jsonData.searchServiceName != undefined && this.jsonData.searchServiceName == 'AEPS') {
      let options = new DialogOptionsModel<IDialogData>();
      options.data = <IDialogData>{
        message: {
          aepsTranDetails: row
        }
      }
      this.dialogService.opendialog(TransactionPopupComponent, options);
    }

    if (this.jsonData.searchServiceName != undefined && this.jsonData.searchServiceName == 'Bill Payment') {
      let options = new DialogOptionsModel<IDialogData>();
      options.data = <IDialogData>{
        message: {
          bbpsTranDetails: row
        }
      }
      this.dialogService.opendialog(BBPSReceiptComponent, options);
    }
    if (this.jsonData.searchServiceName != undefined && this.jsonData.searchServiceName == 'Aadhaar Pay') {
      let options = new DialogOptionsModel<IDialogData>();
      options.data = <IDialogData>{
        message: {
          aepsTranDetails: row
        }
      }
      this.dialogService.opendialog(APTransactionPopupComponent, options);
    }
    if (this.jsonData.searchServiceName != undefined && this.jsonData.searchServiceName == 'Money Transfer') {
      this.showReceipt(row.identifier);
    }
    if (this.jsonData.searchServiceName != undefined && this.jsonData.searchServiceName == 'Cash Deposit') {
      let options = new DialogOptionsModel<IDialogData>();
      options.data = <IDialogData>{
        message: {
          cashDepositTranDetails: row
        }
      }
      this.dialogService.opendialog(CashDepositTransactionPopupComponent, options);
    }
  }

  VerifyRefundOtp(row) {
    let otpdata = {
      sender_mobile: row.sender_mobile,
      for_refund: true,
      transaction_id: row.transaction_id,
      channel: row.channel_name
    }
    const options = <DialogOptionsModel<IDialogData>>{
      data: <IDialogData>{
        message: {
          mobileNumber: row.sender_mobile,
          processName: "Beneficiary Refund",
          labelText: "Enter OTP",
          btnText: "Verify OTP",
          otpSize: 0,
          is3rdParty: true,
          dataToSend: otpdata,
          otpVeryfyUrl: "api/remittance/verify-otp-for-refund",
          otpResendUrl: "api/remittance/resend-otp"
        }
      },
      top: '20vh',
      backdrop: true,
      closeOutsideClick: false
    };

    this.dialogService.ShowDialog(VerifyOtpComponent, options)
      .then(result => {
        if (result != null) {
          if (result.isverified)
          {
            this.showTop10();
            this.toastService.show(result.message, Constants.MESSAGE_SHOW_TIME, Constants.MESSAGE_SUCCESS_STYLE);
          }
          else
            this.toastService.show(result.message, Constants.MESSAGE_SHOW_TIME, Constants.MESSAGE_FAIL_STYLE);
        }
      });
  }

  showReceipt(idenifier: string) {

    this.submitService.getData("api/remittance/get-agent-transaction/" + idenifier + "/DMT", true)
      .subscribe(
        data => {
          if (data.body != null && (data.body.length > 0)) {
            let reciptData = data.body;
            const options = <DialogOptionsModel<IDialogData>>{
              data: <IDialogData>{
                message: {
                  isExhaust: false,
                  reciptData: reciptData
                }
              },
              top: '20vh',
              backdrop: true,
              closeOutsideClick: true
            };
            this.dialogService.ShowDialog(TransactionReceiptComponent, options)
              .then((result) => {
                if (result) { }
              });
          }
        },
        Error => {
          if (Error.error.message == undefined)
            this.toastService.show(Error.error, Constants.MESSAGE_SHOW_TIME, Constants.MESSAGE_FAIL_STYLE);
          else
            this.toastService.show(Error.error.message, Constants.MESSAGE_SHOW_TIME, Constants.MESSAGE_FAIL_STYLE);
        });
  }
}
