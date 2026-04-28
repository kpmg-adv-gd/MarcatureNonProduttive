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
            that.getView().byId("selectedVarianceText").setText("")
            that.getView().byId("selectedUpdateText").setText("");
            that.MarkingPopupModel.setProperty("/coordinationActivity", false);
            that._selectedCause = null;
            that._selectedDescription = null;
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
            var wbsSelected = this.MarkingPopupModel.getProperty("/wbsSelected");
            if (wbsSelected == "") {
                that.MarkingPopupModel.setProperty("/wbeSelected", "");
                that.MarkingPopupModel.setProperty("/wbsActivitySelected", "");
                that.MarkingPopupModel.setProperty("/confirmationNumber", "");
                that.MarkingPopupModel.setProperty("/network", "");
                that.MarkingPopupModel.setProperty("/coordinationActivity", false);
                return;
            }
            var datas = that.wbsModel.getProperty("/wbs").filter(item => item.user_group.includes(that.wbsModel.getProperty("/myUserGroup")))
                .filter(item => item.wbs == wbsSelected);
            var items = [];
            datas.forEach(data => {
                if (items.filter(item => item.wbe == data.wbe).length == 0) {
                    items.push({
                        wbe: data.wbe,
                        wbe_description: data.wbe_description,
                        user_group: data.user_group,
                        activities: [{
                            activity_id: data.activity_id,
                            activity_id_description: data.activity_id_description
                        }]
                    })
                }else{
                    items.filter(item => item.wbe == data.wbe)[0].activities.push({
                        activity_id: data.activity_id,
                        activity_id_description: data.activity_id_description
                    })
                }
            })
            that.MarkingPopupModel.setProperty("/wbe", [...[{wbe: "", wbe_description: "", user_group: ""}], ...items]);
            that.MarkingPopupModel.setProperty("/wbsSelected", wbsSelected);
            // reset
            that.MarkingPopupModel.setProperty("/wbeSelected", "");
            that.MarkingPopupModel.setProperty("/wbsActivitySelected", "");
            that.MarkingPopupModel.setProperty("/confirmationNumber", "");
            that.MarkingPopupModel.setProperty("/network", "");
            that.MarkingPopupModel.setProperty("/coordinationActivity", false);
        },

        onchangeWBE: function (oEvent) {
            var that = this;
            var wbeSelected = oEvent.getParameters().selectedItem.getProperty("key");
            if (wbeSelected == "") {
                // reset
                that.MarkingPopupModel.setProperty("/wbsActivitySelected", "");
                that.MarkingPopupModel.setProperty("/confirmationNumber", "");
                that.MarkingPopupModel.setProperty("/network", "");
                that.MarkingPopupModel.setProperty("/coordinationActivity", false);
                return;
            }
            var datas = that.MarkingPopupModel.getProperty("/wbe").filter(item => item.user_group.includes(that.wbsModel.getProperty("/myUserGroup")))
                .filter(item => item.wbe == wbeSelected)[0].activities;
            var items = [];
            datas.forEach(data => {
                if (items.filter(item => item.activity_id == data.activity_id).length == 0) {
                    items.push({
                        activity_id: data.activity_id,
                        activity_id_description: data.activity_id_description,
                    })
                }
            })
            that.MarkingPopupModel.setProperty("/wbsActivity", [...[{activity_id: "", activity_id_description: ""}], ...items]);
            that.MarkingPopupModel.setProperty("/wbeSelected", wbeSelected);
            // reset
            that.MarkingPopupModel.setProperty("/wbsActivitySelected", "");
            that.MarkingPopupModel.setProperty("/confirmationNumber", "");
            that.MarkingPopupModel.setProperty("/network", "");
            that.MarkingPopupModel.setProperty("/coordinationActivity", false);
        },

        onChangeWBSActivity: function (oEvent) {
            var that = this;
            var wbsSelectedActivity = oEvent.getParameters().selectedItem.getProperty("key");
            if (wbsSelectedActivity == "") {
                // reset
                that.MarkingPopupModel.setProperty("/confirmationNumber", "");
                that.MarkingPopupModel.setProperty("/network", "");
                that.MarkingPopupModel.setProperty("/coordinationActivity", false);
                return;
            }
            var wbsSelected = that.MarkingPopupModel.getProperty("/wbsSelected")
            var rowSelected = that.wbsModel.getProperty("/wbs").filter(item => item.wbs == wbsSelected && item.activity_id == wbsSelectedActivity && item.wbe == that.MarkingPopupModel.getProperty("/wbeSelected"))[0]
            var confirmationNumber = rowSelected.confirmation_number;
            var coordinationActivity =  rowSelected.coordination_activity;
            var network = rowSelected.network;
            that.MarkingPopupModel.setProperty("/confirmationNumber", confirmationNumber);
            that.MarkingPopupModel.setProperty("/network", network);
            that.MarkingPopupModel.setProperty("/coordinationActivity", coordinationActivity);

            var plannedLabor = rowSelected.duration;
            var uom_planned_labor =  rowSelected.duration_uom;
            var marked_labor = rowSelected.marked_labor;
            var uom_marked_labor = rowSelected.marked_uom;
            var varianceLabor = rowSelected.variance_labor;
            try { var remainingLabor = Number(plannedLabor) - Number(marked_labor) } catch(e) { var remainingLabor = 0 };
            that.MarkingPopupModel.setProperty("/plannedLabor", plannedLabor);
            that.MarkingPopupModel.setProperty("/uom_planned_labor", uom_planned_labor);
            that.MarkingPopupModel.setProperty("/markedLabor", marked_labor);
            that.MarkingPopupModel.setProperty("/uom_marked_labor", uom_marked_labor);
            that.MarkingPopupModel.setProperty("/remainingLabor", remainingLabor);
            that.MarkingPopupModel.setProperty("/varianceLabor", varianceLabor);
            that.getZDefects();
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
            var plant = infoModel.getProperty("/plant");

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathModificationApi = "/db/getModificationsByWBE";
            let url = BaseProxyURL + pathModificationApi;

            let params = {
                plant:plant,
                wbe: that.MarkingPopupModel.getProperty("/wbeSelected")
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
            let coordinationActivity = that.MarkingPopupModel.getProperty("/coordinationActivity");
            if(!wbs || !wbsActivity || !confirmation_number || !personnelNumber) return false;

            if (coordinationActivity) {
                let modification = that.getView().byId("selectedUpdateText").getText() || "";
                let variance = that.getView().byId("selectedVarianceText").getText() || "";
                var defect = that.MarkingPopupModel.getProperty("/defectSelected") || "";
                if (modification != "" && variance == "") return false;
                if (variance != "" && modification == "" && defect == "") return false;
            }

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

            let modification = that.getView().byId("selectedUpdateText").getText() || "";
            let variance = that.getView().byId("selectedVarianceText").getText() || "";
            var defect = that.MarkingPopupModel.getProperty("/defectSelected") || "";

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
                unCancellation: "",
                unConfirmation: "X",
                rowSelectedWBS: rowSelectedWBS,
                userId: user,
                modification: modification == "" ? null : modification,
                reasonForVariance: variance == "" ? null : that._selectedCause,
                defect: defect == "" ? null : defect
            }

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathSendMarkingApi = "/api/sendZDMConfirmations";
            let url = BaseProxyURL + pathSendMarkingApi;

            // Callback di successo
            var successCallback = function (response) {
                that.MainPODcontroller.showToast(that.MainPODcontroller.getI18n("marking.success.message"));
                sap.ui.getCore().getEventBus().publish("WBS", "loadDateCalendar", null);
                sap.ui.getCore().getEventBus().publish("WBS", "loadWBS", null);
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
        },



        
        onGetReasonsForVariance: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathReasonForVarianceApi = "/db/getReasonsForVariance";
            let url = BaseProxyURL + pathReasonForVarianceApi;

            let params = {};

            // Callback di successo
            var successCallback = function (response) {
                var oModel = new JSONModel();
                oModel.setProperty("/rows", response);
                that.getView().setModel(oModel, "varianceModel");;
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        onVarianceButtonPressed: function (oEvent) {
            var that = this;

            if (!that._oVariancePopover) {
                that._oTable = new sap.m.Table("varianceTable", {
                    mode: "SingleSelectMaster",
                    columns: [
                        new sap.m.Column({ header: new sap.m.Label({ text: "Plant" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Cause" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Notes" }) })
                    ],
                    items: {
                        path: "varianceModel>/rows",
                        template: new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: "{varianceModel>plant}" }),
                                new sap.m.Text({ text: "{varianceModel>cause}" }),
                                new sap.m.Text({ text: "{varianceModel>description}" }),
                                new sap.m.Text({ text: "{varianceModel>notes}" })
                            ]
                        })
                    },
                    selectionChange: function (oEvent) {
                        var oSelectedItem = oEvent.getParameter("listItem");
                        var oContext = oSelectedItem.getBindingContext("varianceModel");
                        that._selectedCause = oContext.getProperty("cause");
                        that._selectedDescription = oContext.getProperty("description");
                        that._oConfirmButton.setEnabled(true);
                    }
                });

                that._oVariancePopover = new sap.m.Popover({
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
                                    that.onConfirmVarianceSelection();
                                }
                            }),
                            new sap.m.Button({
                                text: "Cancel",
                                press: function () {
                                    that.getView().byId("selectedVarianceText").setText("");
                                }
                            }),
                            new sap.m.Button({
                                text: "Close",
                                press: function () {
                                    that._oVariancePopover.close();
                                }
                            })
                        ]
                    })
                });

                that.getView().addDependent(that._oVariancePopover);
                that._oConfirmButton = that._oVariancePopover.getFooter().getContent()[0];
            }

            that._oConfirmButton.setEnabled(false);
            that._selectedCause = null;
            that._selectedDescription = null;

            that.onGetReasonsForVariance();
            that._oVariancePopover.openBy(oEvent.getSource());
        },
        onConfirmVarianceSelection: function () {
            var that = this;
            var varianceSelection;

            if (that._selectedCause && that._selectedDescription) {
                varianceSelection = that._selectedCause;
                that.getView().byId("selectedVarianceText").setText(that._selectedDescription);

                that._oVariancePopover.close();
            } else {
                varianceSelection = "";
                sap.m.MessageToast.show("No reason selected.");
            }

            return varianceSelection;
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
        
        getZDefects: function () {
            var that=this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            
            var plant = infoModel.getProperty("/plant");

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathOrderBomApi = "/db/selectZDefectByWBE";
            let url = BaseProxyURL+pathOrderBomApi; 

            let params={
                plant:plant,
                wbe: that.MarkingPopupModel.getProperty("/wbeSelected")
            };

            // Callback di successo
            var successCallback = function(response) {
                that.MarkingPopupModel.setProperty("/defects", [...[{id:"", title:"", variance: ""}], ...response]);
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        
        onChangeDefect: function (oEvent) {
            var that = this;
            var variance = this.MarkingPopupModel.getProperty("/defects").filter(item => item.id == this.MarkingPopupModel.getProperty("/defectSelected"))[0].variance;
            var variance_description = this.MarkingPopupModel.getProperty("/defects").filter(item => item.id == this.MarkingPopupModel.getProperty("/defectSelected"))[0].variance_description;
            that.getView().byId("selectedVarianceText").setText(variance);
            that._selectedCause = variance
            that._selectedDescription = variance_description
        },
    })
}
)