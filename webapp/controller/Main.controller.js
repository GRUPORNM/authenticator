sap.ui.define([
    "./BaseController"
],
    function (BaseController) {
        "use strict";

        return BaseController.extend("authenticator.controller.Main", {

            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.attachRouteMatched(this.onRouteMatched, this);
            },

            onRouteMatched: function () {
                var rnm_tk = sessionStorage.getItem('rnm_tk');
                if (rnm_tk == 'undefined' || !rnm_tk) {
                    sessionStorage.clear();
                    this.getModel("global").setProperty("/busy", false);

                    var aElements = this.getView().$().find(".loginInputField"),
                        aRnmUser = aElements[0],
                        aRnmPass = aElements[1];

                    $(aRnmUser).val('');
                    $(aRnmPass).val('');
                    return;
                }
                else if (rnm_tk != null) {
                    this.getModel("global").setProperty("/busy", true);
                    this.getRouter().navTo("Launchpad");
                }
            },

            onAfterRendering: function () {
                var that = this;
                this.getView().$().find(".loginInputField").on("keydown", function (oEvent) {
                    if (oEvent.key === "Enter" || oEvent.which === 13) {

                        that.onPress();
                    }
                });

                var idiomaCookie = this.getCookie("idioma");

                if (idiomaCookie) {
                    this.getView().$().find(".loginSelect").val(idiomaCookie);
                }

                var oButtonA = this.getView().byId("LOGIN_SUBMIT_BLOCK");
                oButtonA.$().on("click", this.onPress.bind(this));
                var oButton = this.getView().byId("LOGIN_CHANGE_PASSWORD_BLOCK");
                oButton.$().on("click", this.onPressChangePassword.bind(this));
                var aElements = this.getView().$().find(".loginInputField");
                var aRnmUser = aElements[0].value;
                aElements[0].classList.add("loginInputField")
            },

            onPressChangePassword: function () {
                sessionStorage.clear();
                var aElements = this.getView().$().find(".loginInputField"),
                    aRnmUser = aElements[0].value;

                if (aRnmUser.length > 0) {
                    this.getModel("global").setProperty("/aRnmUser", aRnmUser);
                    this.getRouter().navTo("ChangePassword");
                }
                else {
                    aElements[0].classList.add("loginInputFieldError")
                    sap.m.MessageToast.show("É necessário preencher o campo de utilizador");
                }
            },

            onPress: function () {
                var that = this,
                    aElements = this.getView().$().find(".loginInputField"),
                    oLangu = this.getView().$().find(".loginSelect")[0].value,
                    aRnmUser = aElements[0].value,
                    aRnmPass = aElements[1].value,
                    oModel = this.getModel();

                sessionStorage.setItem("oLangu", oLangu);
                sap.ui.getCore().getConfiguration().setLanguage(oLangu);

                var oAuthData = {
                    username: aRnmUser,
                    password: aRnmPass
                };


                oModel.read("/AUTHENTICATOR", {
                    headers: {
                        "authorization": oAuthData.username + ":" + oAuthData.password
                    },
                    success: function (oData, oResponse) {
                        var cookieHeaderValue = document.cookie;
                        sessionStorage.setItem('cookiesTK', cookieHeaderValue);

                        if (oData.results[0].Response.includes('RNMTK_')) {
                            that.getModel("global").setProperty("/rnm_tk", oData.results[0].Response);
                            that.getModel("global").setProperty("/userName", oData.results[0].Name);
                            that.getModel("global").setProperty("/partner", oData.results[0].CompanyName);
                            that.getModel("global").setProperty("/usrid", oData.results[0].Usrid);
                            that.getModel("global").setProperty("/citizenPhoto", oData.results[0].CitizenPhoto);
                            sessionStorage.setItem("usrid", oData.results[0].Usrid);
                            sessionStorage.setItem("usr_type", oData.results[0].UsrType);
                            sessionStorage.setItem("partner", oData.results[0].CompanyName);
                            sessionStorage.setItem("userName", oData.results[0].Name);
                            sessionStorage.setItem("rnm_tk", oData.results[0].Response);
                            sessionStorage.setItem("citizenPhoto", oData.results[0].CitizenPhoto);
                            sessionStorage.setItem("oLangu", oData.results[0].UsrLanguage);
                            sap.ui.getCore().getConfiguration().setLanguage(oData.results[0].UsrLanguage);
                            
                            var oTheme;
                            if (oData.results[0].UsrTheme == "")
                                oTheme = "sap_fiori_3";
                            else
                                oTheme = oData.results[0].UsrTheme;
                            sessionStorage.setItem("selectedTheme", oTheme);

                            var UsrShortcuts = "";
                            if (oData.results[0].UsrShortcuts == "")
                                UsrShortcuts = false;
                            else
                                UsrShortcuts = true;
                            sessionStorage.setItem("shortcuts", UsrShortcuts);

                            that.getRouter().navTo("Launchpad");
                            that.getModel("global").setProperty("/busy", true);
                        }
                        else
                            sap.m.MessageToast.show(oData.results[0].Response);
                    },
                    error: function (oError) {
                        console.error("Erro na solicitação:", oError);
                    }
                });
            },

            getCookie: function (nomeDoCookie) {
                var cookies = document.cookie.split(';');
                for (var i = 0; i < cookies.length; i++) {
                    var cookie = cookies[i].trim();
                    if (cookie.indexOf(nomeDoCookie + "=") === 0) {
                        return cookie.substring(nomeDoCookie.length + 1, cookie.length);
                    }
                }
                return null;
            },
        });
    });
