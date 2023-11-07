sap.ui.define([
    "./BaseController"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController) {
        "use strict";

        return BaseController.extend("authenticator.controller.Main", {

            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.attachRouteMatched(this.onRouteMatched, this);
            },

            onRouteMatched: function () {
                var rnm_tk = sessionStorage.getItem('rnm_tk');
                if (rnm_tk == 'undefined') {
                    this.getModel("global").setProperty("/busy", false);
                    var aElements = this.getView().$().find(".loginInputField");
                    var aRnmUser = aElements[0];
                    var aRnmPass = aElements[1];

                    // Limpar os valores dos campos de entrada
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
                    if (oEvent.key === "Enter" || oEvent.which === 13) {  // 13 é o código da tecla Enter
                        debugger;
                        that.onPress();
                    }
                });
                var oButtonA = this.getView().byId("LOGIN_SUBMIT_BLOCK");
                oButtonA.$().on("click", this.onPress.bind(this));
                var oButton = this.getView().byId("LOGIN_CHANGE_PASSWORD_BLOCK");
                oButton.$().on("click", this.onPressChangePassword.bind(this));
                var aElements = this.getView().$().find(".loginInputField");
                var aRnmUser = aElements[0].value;
                aElements[0].classList.add("loginInputField")
            },

            onPressChangePassword: function () {
                var aElements = this.getView().$().find(".loginInputField");
                var aRnmUser = aElements[0].value;
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

                var that = this;
                var aElements = this.getView().$().find(".loginInputField");
                var oLangu = this.getView().$().find(".loginSelect")[0].value;
                sessionStorage.setItem("oLangu", oLangu);
                sap.ui.getCore().getConfiguration().setLanguage(oLangu);
                var aRnmUser = aElements[0].value;
                var aRnmPass = aElements[1].value;
                var oModel = this.getModel();

                // Defina os dados de autenticação
                var oAuthData = {
                    username: aRnmUser,
                    password: aRnmPass
                };


                oModel.read("/AUTHENTICATOR", {
                    headers: {
                        "authorization": oAuthData.username + ":" + oAuthData.password
                    },
                    success: function (oData, oResponse) {
                        // Manipule a resposta bem-sucedida aqui
                        // console.log("Dados recuperados:", oData);

                        var cookieHeaderValue = document.cookie;
                        sessionStorage.setItem('cookiesTK', cookieHeaderValue);

                        if (oData.results[0].Response.includes('RNMTK_')) {
                            that.getModel("global").setProperty("/rnm_tk", oData.results[0].Response);
                            that.getModel("global").setProperty("/userName", oData.results[0].Name);
                            that.getModel("global").setProperty("/partner", oData.results[0].Partner);
                            that.getModel("global").setProperty("/usrid", oData.results[0].Usrid);
                            sessionStorage.setItem("usrid", oData.results[0].Usrid);
                            sessionStorage.setItem("userName", oData.results[0].Name);
                            sessionStorage.setItem("rnm_tk", oData.results[0].Response);
                            var oTheme;
                            if (oData.results[0].UsrTheme == "")
                                oTheme = "sap_fiori_3";
                            else
                                oTheme = oData.results[0].UsrTheme;
                            debugger;
                            sessionStorage.setItem("selectedTheme", oTheme);
                            var UsrShortcuts = "";
                            debugger;
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
                        // Manipule o erro da solicitação aqui
                        console.error("Erro na solicitação:", oError);
                    }
                });

                // this.getRouter().navTo("Launchpad");
            }
        });
    });
