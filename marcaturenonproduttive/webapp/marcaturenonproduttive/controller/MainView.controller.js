sap.ui.define([
    'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager",
    "./popup/ViewWBSPopup",
    "./popup/MarkingPopup",
	"sap/ui/core/date/UI5Date"
], function (jQuery, JSONModel, BaseController, CommonCallManager, ViewWBSPopup, MarkingPopup, UI5Date) {
	"use strict";

	return BaseController.extend("kpmg.custom.plugin.marcaturenonproduttive.marcaturenonproduttive.controller.MainView", {
		wbsModel: new JSONModel(),
        ViewWBSPopup: new ViewWBSPopup(),
        MarkingPopup: new MarkingPopup(),

        onInit: function () {
			BaseController.prototype.onInit.apply(this, arguments);				           
            this.getView().setModel(this.wbsModel, "wbsModel");			           
            sap.ui.getCore().getEventBus().subscribe("WBS", "loadWBS", this.loadTableWBS, this);
            sap.ui.getCore().getEventBus().subscribe("WBS", "loadDateCalendar", this.loadDateCalendar, this);
		},

        onAfterRendering: function() {
           var that = this;
           that.loadTableWBS();
           that.loadDateCalendar();
           that.wbsModel.setProperty("/calendarValue", []);
           that.wbsModel.setProperty("/wbs", []);
           that.wbsModel.setProperty("/visibleTabWBS", false);
           that.wbsModel.setProperty("/months", [
            { "key": "0", "month": "January" },
            { "key": "1", "month": "February" },
            { "key": "2", "month": "March" },
            { "key": "3", "month": "April" },
            { "key": "4", "month": "May" },
            { "key": "5", "month": "June" },
            { "key": "6", "month": "July" },
            { "key": "7", "month": "August" },
            { "key": "8", "month": "September" },
            { "key": "9", "month": "October" },
            { "key": "10", "month": "November" },
            { "key": "11", "month": "December" }
           ]);
           that.wbsModel.setProperty("/years", [
            { key:  ""+(new Date().getFullYear()+3) , year: ""+(new Date().getFullYear()+3)},
            { key:  ""+(new Date().getFullYear()+2) , year: ""+(new Date().getFullYear()+2)},
            { key:  ""+(new Date().getFullYear()+1) , year: ""+(new Date().getFullYear()+1)},
            { key:  ""+new Date().getFullYear() , year: ""+new Date().getFullYear()},
            { key:  ""+(new Date().getFullYear()-1) , year: ""+(new Date().getFullYear()-1)},
            { key:  ""+(new Date().getFullYear()-2) , year: ""+(new Date().getFullYear()-2)},
            { key:  ""+(new Date().getFullYear()-3) , year: ""+(new Date().getFullYear()-3)},
           ]);

           that.loadMyUserGroup();
        },

        loadMyUserGroup: function () {
            var that = this;
           
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/getUserGroup";
            let url = BaseProxyURL + pathGetMarkingDataApi;
            
            let plant = that.getInfoModel().getProperty("/plant");
            let user = that.getInfoModel().getProperty("/user_id");

            let params = {
                plant: plant,
                userId: user
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response) {
                    that.wbsModel.setProperty("/myUserGroup", response);
                }
                that.loadAccessUserGroup();
            }
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        loadAccessUserGroup: function () {
            var that = this;
           
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/getAccessUserGroupWBS";
            let url = BaseProxyURL + pathGetMarkingDataApi;
            
            let plant = that.getInfoModel().getProperty("/plant");
            let userGroup = that.wbsModel.getProperty("/myUserGroup");

            let params = {
                plant: plant,
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response && response.includes(userGroup)) {
                    that.wbsModel.setProperty("/visibleTabWBS", true);
                }else{
                    that.wbsModel.setProperty("/visibleTabWBS", false);
                }
            }
            // Callback di errore
            var errorCallback = function (error) {
                that.wbsModel.setProperty("/visibleTabWBS", false);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onGoPress: function () {
            var that = this;
            var oMonthSelect = that.byId("monthSelect").getSelectedKey();
            var oYearSelect = that.byId("yearSelect").getSelectedKey();

            if (!oMonthSelect || !oYearSelect || oMonthSelect == "" || oYearSelect == "") {
                that.showErrorMessageBox(that.getI18n("markNP.errorMessage.noFilter"));
                return;
            }

            var iMonth = parseInt(oMonthSelect, 10); // 0-based index
            var iYear = parseInt(oYearSelect, 10);

            // Imposto la nuova data al primo giorno del mese selezionato
            var oNewDate = new Date(iYear, iMonth, 1);

            // Aggiorno direttamente la proprietà startDate del calendario
            var oCalendar = that.byId("calendar");
            oCalendar.setStartDate(oNewDate);
            that.viewChange();
        },

        // Intercetta cambio di sezione
        changeTabSection: function (oEvent) {
            var that = this;
            
            var sSelectedKey = oEvent.getParameter("selectedKey");
            if (sSelectedKey == "WBS") {
                that.loadTableWBS();
            }else{
                that.loadDateCalendar();
            }
        },

        _decorateCells: function () {
            var that = this;
            var giorniSegnati = that.wbsModel.getProperty("/calendarValue");

            // Timeout per essere sicuri che il DOM sia aggiornato
            setTimeout(function () {
                // Recupera tutte le celle giorno nella vista Month
                var aDayCells = document.querySelectorAll('.sapMSPCMonthDay');

                aDayCells.forEach(function (oCell) {
                    var sDate = oCell.getAttribute("sap-ui-date"); // Data in formato ISO
                    if (!sDate) {
                        return;
                    }

                    var sDay = new Date(Number(sDate)) // Prendo solo YYYY-MM-DD
                    var sDay00 = new Date(sDay.getFullYear(), sDay.getMonth(), sDay.getDate());

                    // Pulisco eventuali vecchi elementi
                    var oExisting = oCell.querySelector('.myCustomNumber');
                    if (oExisting) {
                        oExisting.remove();
                    }

                    var foundDay = giorniSegnati.filter(item => item.DAY.getTime() == sDay00.getTime());
                    if (foundDay.length > 0) {
                        // Aggiungo il numero al centro della cella
                        var oDiv = document.createElement("div");
                        oDiv.className = "myCustomNumber";
                        oDiv.innerText = foundDay[0].VALUE;
                        oCell.appendChild(oDiv);

                        oDiv.onclick = function () {
                            that.selectedDatesChange(foundDay[0].DAY, true); // Passo la data al controller
                        };

                        // Aggiungo classe custom per eventuali colorazioni
                        oCell.classList.add("myCustomCell");
                    } else {
                        oCell.classList.remove("myCustomCell");
                    }
                });
            }, 100);
        },

        selectedDatesChange: function (oEvent, dayFromClickNumber) { 
            var that = this;
            that._decorateCells();
            // Apro la popup sul giorno selezionato
            if (dayFromClickNumber) {
                var day = oEvent;
            }else{
                var day = oEvent.getParameter("startDate");
            }

            const today = new Date();
            const today00 = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            if (day > today00) {
                that.showToast(that.getI18n("markNP.errorMessage.dateFuture"))
            }else{
                var dayClicked = that.wbsModel.getProperty("/calendarValue").filter(item => item.DAY.getTime() == day.getTime());
                if (dayClicked.length > 0) {
                    var cellSelected = dayClicked[0];
                }else{
                    var cellSelected = null;
                }
                that.MarkingPopup.open(that.getView(), that, that.wbsModel, cellSelected, day);
            }

        },

        // Intercetta il cambio del mese
        viewChange: function () { this._decorateCells() },

        loadTableWBS: function (pathWBS, confirmationNumber) {
            var that = this;
            
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/db/unproductive/wbs";
            let url = BaseProxyURL + pathGetMarkingDataApi;
            let plant = that.getInfoModel().getProperty("/plant");

            let params = {
                plant: plant
            };

            // Callback di successo
            var successCallback = function (response) {
                if (pathWBS && confirmationNumber) {
                    that.wbsModel.setProperty(pathWBS, response.filter(item => item.confirmation_number == confirmationNumber)[0]);
                    that.wbsModel.setProperty(pathWBS + "/mode", "read");
                }else{
                    response.forEach(item => item.mode = "read");
                    that.wbsModel.setProperty("/wbs", response)
                }
            }
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onPressCreateWBS: function () {
            var that = this;
            let plant = that.getInfoModel().getProperty("/plant");

            if (that.wbsModel.getProperty("/wbs").filter(item => item.mode == "create").length > 0) {
                that.showErrorMessageBox(that.getI18n("markNP.errorMessage.createRow"));
                return;
            }

            that.wbsModel.getProperty("/wbs").push({
                plant: plant,
                wbe: "",
                wbe_description: "",
                wbs: "",
                wbs_description: "",
                confirmation_number: "",
                activity_id: "",
                activity_id_description: "",
                user_group: "",
                network: "",
                network_description: "",
                mode: "create"
            })
            that.wbsModel.refresh();
        },

        onPressCancelWBS: function () {
            var that = this;

            var oTable = this.byId("wbsTable");
            var aSelectedIndices = oTable.getSelectedIndices(); // Array degli indici selezionati
            if (aSelectedIndices.length == 0) {
                that.showErrorMessageBox(that.getI18n("markNP.errorMessage.noRowSelected"));
                return;
            }

            sap.m.MessageBox.show(
                that.getI18n("markNP.warningMessage.confirmCancel"), // Messaggio da visualizzare
                {
                    icon: sap.m.MessageBox.Icon.WARNING, // Tipo di icona
                    title: "Warning",         // Titolo della MessageBox
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL], 
                    onClose: function(oAction) {          // Callback all'interazione
                        if (oAction == "OK") that.confirmCancelWBS();
                    }
                }
            );
        },

        confirmCancelWBS: function () {
            var that = this;
            var confirmationNumberList = [];
            var oTable = this.byId("wbsTable");
            var aSelectedIndices = oTable.getSelectedIndices(); // Array degli indici selezionati
            aSelectedIndices.forEach(function(iIndex) {
                // Ottieni il context della riga selezionata
                var oContext = oTable.getContextByIndex(iIndex);
                var oRowData = oContext.getObject();
                if (oRowData.mode != "read") {
                    that.showErrorMessageBox(that.getI18n("markNP.errorMessage.cancelNotRead")); // Messaggio da visualizzare
                    return;
                }
                confirmationNumberList.push({
                    confirmation_number: oRowData.confirmation_number
                });
            });



            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/db/unproductive/wbs/delete";
            let url = BaseProxyURL + pathGetMarkingDataApi;
            let plant = that.getInfoModel().getProperty("/plant");

            let params = {
                plant: plant,
                confirmationNumberList: confirmationNumberList
            };

            // Callback di successo
            var successCallback = function (response) {
                that.showToast(that.getI18n("markNP.success.cancelWBS"));
                that.loadTableWBS();
            }
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onPressEditWBS: function (oEvent) {
            var that = this;
            let pathSelectedWBS = oEvent.getSource().getParent().getBindingContext("wbsModel").getPath()
            that.wbsModel.setProperty(pathSelectedWBS + "/mode", "edit");
        },

        onPressCopyWBS: function (oEvent) {
            var that = this;
            var oTable = this.byId("wbsTable");
            var aSelectedIndices = oTable.getSelectedIndices(); // Array degli indici selezionati

            
            if (that.wbsModel.getProperty("/wbs").filter(item => item.mode == "create").length > 0) {
                that.showErrorMessageBox(that.getI18n("markNP.errorMessage.createRow"));
                return;
            }

            if (aSelectedIndices.length != 1) {
                that.showErrorMessageBox(that.getI18n("markNP.errorMessage.copyRow"));
                return;
            }
            var oContext = oTable.getContextByIndex(aSelectedIndices[0]);
            var oRowData = oContext.getObject();
            let plant = that.getInfoModel().getProperty("/plant");

            that.wbsModel.getProperty("/wbs").push({
                plant: plant,
                wbe: oRowData.wbe,
                wbe_description: oRowData.wbe_description,
                wbs:  oRowData.wbs,
                wbs_description:  oRowData.wbs_description,
                confirmation_number: "",
                activity_id:  oRowData.activity_id,
                activity_id_description: oRowData.activity_id_description,
                user_group:  oRowData.user_group,
                network:  oRowData.network,
                network_description:  oRowData.network_description,
                mode: "create"
            })
            that.wbsModel.refresh();
        },

        onPressBackWBS: function (oEvent) {
            var that = this;
            let pathSelectedWBS = oEvent.getSource().getParent().getBindingContext("wbsModel").getPath();
            let confirmationNumber = oEvent.getSource().getParent().getBindingContext("wbsModel").getObject().confirmation_number;

            if (that.wbsModel.getProperty(pathSelectedWBS + "/mode") == "create") {
                var datas = [];
                that.wbsModel.getProperty("/wbs").forEach(item => {
                    if (item.mode != "create") {
                        datas.push(item)
                    }
                })
                that.wbsModel.setProperty("/wbs", datas);
            }else{
                that.loadTableWBS(pathSelectedWBS, confirmationNumber);
            }
        },

        onPressSaveWBS: function (oEvent) {
            var that = this;
            let selectedWBS = oEvent.getSource().getParent().getBindingContext("wbsModel").getObject();
            let pathSelectedWBS = oEvent.getSource().getParent().getBindingContext("wbsModel").getPath();

            if (that.validate(selectedWBS)) {
                that.saveWBS(selectedWBS, pathSelectedWBS);
            }else{
                that.showErrorMessageBox(that.getI18n("markNP.errorMessage.fieldMandatory"));
            }
        },

        validate: function (wbs) {
            var that = this;
            if (wbs.wbe == "" || wbs.wbe_description == "" || wbs.wbs == "" || wbs.wbs_description == "" || wbs.wbs_description == "" || wbs.wbe == "" || wbs.wbe_description == "" || wbs.network == "" 
                || wbs.network_description == "" || wbs.activity_id == "" || wbs.activity_id_description == "" || wbs.confirmation_number == "" || wbs.user_group == "") {
                return false;
            }else{
                return true;
            }
        },

        saveWBS: function (wbs, pathWBS) {
            var that = this;
            let plant = that.getInfoModel().getProperty("/plant");
    
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");

            if (wbs.mode == "create") {
                var pathGetMarkingDataApi = "/db/unproductive/wbs/create";
            }else{
                var pathGetMarkingDataApi = "/db/unproductive/wbs/update";
            }
            let url = BaseProxyURL + pathGetMarkingDataApi;
            

            let params = {
                plant: plant, 
                wbe: wbs.wbe, 
                wbe_description: wbs.wbe_description, 
                wbs: wbs.wbs, 
                wbs_description: wbs.wbs_description, 
                network: wbs.network, 
                network_description: wbs.network_description, 
                activity_id: wbs.activity_id, 
                activity_id_description: wbs.activity_id_description, 
                confirmation_number: wbs.confirmation_number, 
                user_group: wbs.user_group
            };

            // Callback di successo
            var successCallback = function (response) {
                that.showToast(that.getI18n("markNP.success.savedWBS"));
                that.wbsModel.setProperty(pathWBS + "/mode", "read");
            }
            // Callback di errore
            var errorCallback = function (error) {
                if (error == "KEY_DUPLICATE") {
                    that.showErrorMessageBox(that.getI18n("markNP.errorMessage.duplicateKey"));
                }else{
                    console.log("Chiamata POST fallita: ", error);
                }
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        loadDateCalendar: function () {
            var that = this;
           
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/getPersonnelNumber";
            let url = BaseProxyURL + pathGetMarkingDataApi;
            
            let plant = that.getInfoModel().getProperty("/plant");
            let user = that.getInfoModel().getProperty("/user_id");

            let params = {
                plant: plant,
                userId: user
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response) {
                    that.wbsModel.setProperty("/erpPersonnelNumber", response);
                    that.getDayAndValueCalendar(response);
                }
            }
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        getDayAndValueCalendar: function(erpPersonnelNumber) {
            var that = this;

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/db/unproductive/marcature";
            let url = BaseProxyURL + pathGetMarkingDataApi;
            let plant = that.getInfoModel().getProperty("/plant");

            let params = {
                plant: plant,
                erpPersonnelNumber: erpPersonnelNumber
            };

            // Callback di successo
            var successCallback = function (response) {
                // Logica per creare risultati da mostrare sul calendario
                response.forEach(item => {
                    // Splittiamo la stringa
                    const [giorno, mese, anno] = item.DAY.split('/').map(Number);
                    // Creiamo la data (attenzione: il mese in JS parte da 0)
                    const data = new Date(anno, mese - 1, giorno);

                    item.DAY = data;
                    item.VALUE = that.formatHCN(item.VALUE);
                });
                that.wbsModel.setProperty("/calendarValue", response);
                that._decorateCells();
            }
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        formatHCN: function(centesimi) {
            const ore = Math.floor(centesimi / 100);
            const minuti = Math.round((centesimi % 100) * 0.6); // 1 centesimo = 0.6 minuti
            return ore + "h " + minuti.toString().padStart(2, '0') + "m";
        }

	});
});