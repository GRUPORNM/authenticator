sap.ui.define(
  [
    "./BaseController",
    "sap/ui/model/json/JSONModel"
  ],
  function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("authenticator.controller.App", {
      onInit() {
        var oViewModel = new JSONModel({
          busy: false,
          delay: 0,
          userName: " ",
          version: "0.0.1"
        });

        this.setModel(oViewModel, "global");

      },


    });
  }
);
