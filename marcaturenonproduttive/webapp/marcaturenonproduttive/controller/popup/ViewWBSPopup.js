sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "../BaseController",
    "../../utilities/CommonCallManager",
    "../../utilities/GenericDialog"
], function (JSONModel, BaseController, CommonCallManager, Dialog) {
    "use strict";

    return Dialog.extend("kpmg.custom.plugin.marcaturenonproduttive.marcaturenonproduttive.controller.popup.ViewWBSPopup", {
        ID: 0,
        open: function (oView, oController, selectedWBS, mode) {
            var that = this;
            that.ViewWBSPopupModel = new JSONModel();
            that.MainController = oController;
            that.selectedWBS = selectedWBS;

            that._initDialog("kpmg.custom.plugin.marcaturenonproduttive.marcaturenonproduttive.view.popup.ViewWBSPopup", oView, that.ViewWBSPopupModel);

            that.ViewWBSPopupModel.setProperty("/mode", mode);
            if (mode == "create") {
                that.clearData();
            }else{
                that.ViewWBSPopupModel.setProperty("/wbs", selectedWBS);
            }
            
            that.openDialog();
        },

        clearData: function () {
            var that = this;
            that.ViewWBSPopupModel.setProperty("/wbs", {
                wbe: "",
                wbe_description: "",
                wbs: "",
                wbs_description: "",
                confirmation_number: "",
                activity_id: "",
                activity_id_description: "",
                user_group: "",
                network: "",
                network_description: ""
            });
        },

        onConfirm: function () {
            var that = this;

            if (that.validate()) {
                that.saveWBS();
            }else{
                that.MainController.showErrorMessageBox(that.MainController.getI18n("markNP.errorMessage.fieldMandatory"));
            }
        },

        validate: function () {
            var that = this;
            var wbs = that.ViewWBSPopupModel.getProperty("/wbs");
            if (wbs.wbe == "" || wbs.wbe_description == "" || wbs.wbs == "" || wbs.wbs_description == "" || wbs.wbs_description == "" || wbs.wbe == "" || wbs.wbe_description == "" || wbs.network == "" 
                || wbs.network_description == "" || wbs.activity_id == "" || wbs.activity_id_description == "" || wbs.confirmation_number == "" || wbs.user_group == "") {
                return false;
            }else{
                return true;
            }
        },

        saveWBS: function () {
            var that = this;
            let wbs = that.ViewWBSPopupModel.getProperty("/wbs")
            var infoModel = that.MainController.getInfoModel();
            var plant = infoModel.getProperty("/plant");
    
            let BaseProxyURL = that.MainController.getInfoModel().getProperty("/BaseProxyURL");
            if (that.ViewWBSPopupModel.getProperty("/mode") == "create") {
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
                that.MainController.showToast("WBS saved successfully.");
                sap.ui.getCore().getEventBus().publish("WBS", "loadWBS", null);
                that.onClosePopup();
            }
            // Callback di errore
            var errorCallback = function (error) {
                if (error == "KEY_DUPLICATE") {
                    that.MainController.showErrorMessageBox(that.MainController.getI18n("markNP.errorMessage.duplicateKey"));
                }else{
                    console.log("Chiamata POST fallita: ", error);
                }
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onClosePopup: function () {
            var that = this;
            that.closeDialog();
        },
        
        toggleBusyIndicator: function () {
            var that = this;
            var busyState = that.treeTable.getBusy();
            that.treeTable.setBusy(!busyState);
        }
    })
}
)