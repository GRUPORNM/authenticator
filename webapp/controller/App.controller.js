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
          version: "1.8"
        });

        this.setModel(oViewModel, "global");

      },


    });
  }
);
