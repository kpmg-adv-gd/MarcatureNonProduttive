sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "../BaseController",
    "../../utilities/CommonCallManager",
    "../../utilities/GenericDialog"
], function (JSONModel, BaseController, CommonCallManager, Dialog) {
    "use strict";

    return Dialog.extend("kpmg.custom.plugin.marcaturenonproduttive.marcaturenonproduttive.controller.popup.MarkingPopup", {

        open: function (oView, oController, wbsModel, cellSelected, day) {
            var that = this;
            that.MarkingPopupModel = new JSONModel();
            that.wbsModel = wbsModel;
            that.MainPODcontroller = oController;
            that.cellSelected = cellSelected;
            that.day = day;

            that._initDialog("kpmg.custom.plugin.marcaturenonproduttive.marcaturenonproduttive.view.popup.MarkingPopup", oView, that.MarkingPopupModel);

            that.loadMarkingData();
            that.loadWBS();

            that.openDialog();
            that.clearData();
        },

        clearData: function () {
            var that = this;
            that.getView().byId("hhInputId").setValue("");
            that.getView().byId("mmInputId").setValue("");
        },

        loadWBS: function () {
            var that = this;
            var wbs = [{
                wbs : "",
                wbs_description: ""
            }];
            that.wbsModel.getProperty("/wbs").filter(item => item.user_group.includes(that.wbsModel.getProperty("/myUserGroup"))).forEach(element => {
                if (wbs.filter(item => item.wbs == element.wbs).length == 0) {
                    wbs.push({
                        wbs: element.wbs,
                        wbs_description: element.wbs_description
                    })
                }
            });
            that.MarkingPopupModel.setProperty("/wbs", wbs);
        },
        
        onchangeWBS: function (oEvent) {
            var that = this;
            var wbsSelected = oEvent.getParameters().selectedItem.getProperty("key");
            var items = that.wbsModel.getProperty("/wbs").filter(item => item.user_group.includes(that.wbsModel.getProperty("/myUserGroup")))
                .filter(item => item.wbs == wbsSelected);
            that.MarkingPopupModel.setProperty("/wbsActivity", [...[{activity_id: "", activity_id_description: ""}], ...items]);
            that.MarkingPopupModel.setProperty("/wbsActivitySelected", "");
            that.MarkingPopupModel.setProperty("/wbsSelected", wbsSelected);
        },

        onChangeWBSActivity: function (oEvent) {
            var that = this;
            var wbsSelectedActivity = oEvent.getParameters().selectedItem.getProperty("key");
            var wbsSelected = that.MarkingPopupModel.getProperty("/wbsSelected")
            var confirmationNumber = that.wbsModel.getProperty("/wbs").filter(item => item.wbs == wbsSelected && item.activity_id == wbsSelectedActivity)[0].confirmation_number;
            var network = that.wbsModel.getProperty("/wbs").filter(item => item.wbs == wbsSelected && item.activity_id == wbsSelectedActivity)[0].network;
            that.MarkingPopupModel.setProperty("/confirmationNumber", confirmationNumber);
            that.MarkingPopupModel.setProperty("/network", network);
        },

        loadMarkingData: function () {
            var that = this;
            that.MarkingPopupModel.setProperty("/personnelNumber", that.wbsModel.getProperty("/erpPersonnelNumber"));
            that.MarkingPopupModel.setProperty("/day", that.day)
            if (that.cellSelected == null) {
                that.MarkingPopupModel.setProperty("/value", "0");
            }else{
                that.MarkingPopupModel.setProperty("/value", "" + that.cellSelected.VALUE);
            }
        },

        onUpdateButtonPressed: function (oEvent) {
            var that = this;

            if (!that._oUpdatePopover) {
                that._oTable = new sap.m.Table("updateTable", {
                    mode: "SingleSelectMaster",
                    columns: [
                        new sap.m.Column({ header: new sap.m.Label({ text: "Progressive Eco" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Process Id" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Flux Type" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Type Modification" }) })
                    ],
                    items: {
                        path: "updateModel>/rows",
                        template: new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: "{updateModel>prog_eco}" }),
                                new sap.m.Text({ text: "{updateModel>process_id}" }),
                                new sap.m.Text({ text: "{updateModel>flux_type}" }),
                                new sap.m.Text({ text: "{updateModel>type}" })
                            ]
                        })
                    },
                    selectionChange: function (oEvent) {
                        var oSelectedItem = oEvent.getParameter("listItem");
                        var oContext = oSelectedItem.getBindingContext("updateModel");
                        that._selectedProgEco = oContext.getProperty("prog_eco");
                        that._selectedProcessId = oContext.getProperty("process_id");
                        that._selectedFluxType = oContext.getProperty("flux_type");
                        that._selectedTypeModification = oContext.getProperty("type");
                        that._oConfirmUpdateButton.setEnabled(true);
                    }
                });

                that._oUpdatePopover = new sap.m.Popover({
                    showHeader: false,
                    placement: "Right",
                    contentWidth: "600px",
                    contentHeight: "300px",
                    content: [
                        new sap.m.SearchField({
                            placeholder: "Search description...",
                            liveChange: function (oEvent) {
                                var sQuery = oEvent.getParameter("newValue");
                                var oTable = that._oTable;
                                var oBinding = oTable.getBinding("items");
                                var aFilters = [];

                                if (sQuery) {
                                    var oFilter = new sap.ui.model.Filter(
                                        "description",
                                        sap.ui.model.FilterOperator.Contains,
                                        sQuery
                                    );
                                    aFilters.push(oFilter);
                                }

                                oBinding.filter(aFilters);
                            }
                        }),
                        that._oTable

                    ],
                    footer: new sap.m.Toolbar({
                        content: [
                            new sap.m.Button({
                                text: "Confirm",
                                enabled: false,
                                press: function () {
                                    that.onConfirmUpdateSelection();
                                }
                            }),
                            new sap.m.Button({
                                text: "Cancel",
                                press: function () {
                                    that.getView().byId("selectedUpdateText").setText("");
                                }
                            }),
                            new sap.m.Button({
                                text: "Close",
                                press: function () {
                                    that._oUpdatePopover.close();
                                }
                            })
                        ]
                    })
                });

                that.getView().addDependent(that._oUpdatePopover);
                that._oConfirmUpdateButton = that._oUpdatePopover.getFooter().getContent()[0];
            }

            that._oConfirmUpdateButton.setEnabled(false);
            that._selectedProgEco = null;
            that._selectedProcessId = null;
            that._selectedFluxType = null;
            that._selectedTypeModification = null;
            that.onGetUpdateTable();
            that._oUpdatePopover.openBy(oEvent.getSource());

        },
        onConfirmUpdateSelection: function () {
            var that = this;

            if (!!that._selectedProgEco ) {
                that.getView().byId("selectedUpdateText").setText(that._selectedProgEco);
                that._oUpdatePopover.close();
            } else if (!!that._selectedProcessId ){
                that.getView().byId("selectedUpdateText").setText(that._selectedProcessId);
                that._oUpdatePopover.close();
            } else {
                sap.m.MessageToast.show("No Modification selected.");
            }

        },
        onGetUpdateTable: function(){
            var that=this;
            var that = this;

            var infoModel = that.MainPODcontroller.getInfoModel();
            var sfc = infoModel.getProperty("/selectedSFC/sfc");
            var order = infoModel.getProperty("/selectedSFC/order");
            var plant = infoModel.getProperty("/plant");
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathModificationApi = "/db/getModificationsBySfc";
            let url = BaseProxyURL + pathModificationApi;

            let params = {
                plant:plant,
                order:order
            };

            // Callback di successo
            var successCallback = function (response) {
                var oModel = new JSONModel();
                oModel.setProperty("/rows", response);
                that.getView().setModel(oModel, "updateModel");;
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onHHInputChange: function(oEvent){
            var that=this;
            let value = oEvent.getParameters().value;
            let hhInput = that.getView().byId("hhInputId");
            if(value.length>2) hhInput.setValue(value.substring(0,2));
        },
        onMMInputChange: function(oEvent){
            var that=this;
            var that=this;
            let value = oEvent.getParameters().value;
            let mmInput = that.getView().byId("mmInputId");
            if(value.length>2) mmInput.setValue(value.substring(0,2));
        },

        validate: function () {
            var that = this;
            var hhInputValue = that.getView().byId("hhInputId").getValue();
            var mmInputValue = that.getView().byId("mmInputId").getValue();

            if( (hhInputValue == "" && mmInputValue=="") || (parseInt(hhInputValue,10)==0 && parseInt(mmInputValue,10)==0) ){
                return false;
            } else if( (parseInt(hhInputValue,10)==0 && mmInputValue=="") || (hhInputValue=="" && parseInt(mmInputValue,10)==0) ){
                return false;
            }else if(hhInputValue==""){
                hhInputValue="00";
            } else if (mmInputValue==""){
                mmInputValue="00";
            }
            if(parseInt(mmInputValue,10)<0 || parseInt(mmInputValue,10)>59) return false;

            let confirmation_number = that.MarkingPopupModel.getProperty("/confirmationNumber");
            let wbs = that.MarkingPopupModel.getProperty("/wbsSelected");
            let wbsActivity = that.MarkingPopupModel.getProperty("/wbsActivitySelected");
            let personnelNumber = that.MarkingPopupModel.getProperty("/personnelNumber");
            if(!wbs || !wbsActivity || !confirmation_number || !personnelNumber) return false;

            return true;
        },

        onConfirmPress: function () {
            var that = this;

            if (that.validate()) {
                const today = new Date();
                const today00 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                if (that.MarkingPopupModel.getProperty("/day") < today00) {
                    sap.m.MessageBox.show(
                        "You're saving for a past date, continue?", // Messaggio da visualizzare
                        {
                            icon: sap.m.MessageBox.Icon.WARNING, // Tipo di icona
                            title: "Warning",         // Titolo della MessageBox
                            actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL], 
                            onClose: function(oAction) {          // Callback all'interazione
                                if (oAction == "OK") that.onConfirm();
                            }
                        }
                    );
                }else{
                    that.onConfirm();
                }
            } else {
                that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("markNP.errorMessage.validateMarking"));
            }
        },

        onConfirm: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var plant = infoModel.getProperty("/plant");
            let user = infoModel.getProperty("/user_id");
            
            var personnelNumber = that.MarkingPopupModel.getProperty("/personnelNumber");
            let network = that.MarkingPopupModel.getProperty("/network");
            var wbsActivity = that.MarkingPopupModel.getProperty("/wbsActivitySelected");
            var day = that.MarkingPopupModel.getProperty("/day");
            var rowSelectedWBS = that.wbsModel.getProperty("/wbs").filter(item => item.network == network && item.activity_id == wbsActivity)[0];
            let confirmation_number = that.MarkingPopupModel.getProperty("/confirmationNumber");

            var hh = parseInt(that.getView().byId("hhInputId").getValue(),10);
            var mm = parseInt(that.getView().byId("mmInputId").getValue(),10);
            if(!hh) hh=0;
            if(!mm) mm=0;
            var duration = Math.round( (hh + (mm/60)) * 100);

            let params = {
                plant: plant,
                activityNumber: network,
                activityNumberId: wbsActivity,
                cancellation: "",
                confirmation: "",
                confirmationCounter: "",
                confirmationNumber: confirmation_number,
                date: that.formatDate(day),
                duration: "" + duration,
                durationUom: "HCN",
                personalNumber: personnelNumber,
                reasonForVariance: "",
                unCancellation: "",
                unConfirmation: "X",
                rowSelectedWBS: rowSelectedWBS,
                userId: user
            }

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathSendMarkingApi = "/api/sendZDMConfirmations";
            let url = BaseProxyURL + pathSendMarkingApi;

            // Callback di successo
            var successCallback = function (response) {
                that.MainPODcontroller.showToast(that.MainPODcontroller.getI18n("marking.success.message"));
                sap.ui.getCore().getEventBus().publish("WBS", "loadDateCalendar", null);
                that.onClosePopup();
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
                that.MainPODcontroller.showErrorMessageBox(error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that,true,true);
        },

        onClosePopup: function () {
            var that = this;
            that.closeDialog();
        },

        formatDate: function (oDate) {
            if (!oDate) return "";

            // Se oDate è una stringa ISO, la convertiamo in oggetto Date
            if (typeof oDate === "string") {
                oDate = new Date(oDate);
            }

            const giorno = oDate.getDate().toString().padStart(2, '0');
            const mese = (oDate.getMonth() + 1).toString().padStart(2, '0'); // i mesi partono da 0
            const anno = oDate.getFullYear();

            return `${giorno}/${mese}/${anno}`;
        }
    })
}
)