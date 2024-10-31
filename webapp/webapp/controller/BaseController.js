sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "../model/formatter"
], function (Controller, History, formatter) {
    "use strict";

    /**
     * @class
     * @author João Mota @
     * @since  May 2023
     * @name   initial.sapui5.BaseController
     */

    return Controller.extend("authenticator.controller.BaseController", {

        formatter: formatter,

        getNotifModel: function () {
            var oModel = this.getModel();
            debugger;
            var userLanguage = sessionStorage.getItem("oLangu");
            if (!userLanguage) {
                userLanguage = "EN"; // Neste caso, estou definindo a língua diretamente para "FR" como no seu exemplo
            }
            var token = sessionStorage.getItem("rnm_tk");
            var serviceUrlWithLanguage = "/sap/opu/odata/TQA/USR_NOTIFICATIONS_SRV/?" + "sap-language=" + userLanguage;
            var TQAModel = new sap.ui.model.odata.v2.ODataModel({
                serviceUrl: serviceUrlWithLanguage,
                headers: {
                    "authorization": token,
                    "applicationName": "USR_NOTIF",
                }
            });
            // this.setModel(TQAModel);
            return TQAModel;
        },

        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash();

            if (sPreviousHash !== undefined) {
                history.go(-1);
            } else {
                this.getRouter().navTo("TargetMain", {}, true);1
            }
        },
    });

});