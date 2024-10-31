sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("authenticator.controller.ChangePassword", {
		onInit: function () {
			var oModel = new JSONModel(
			);
			this.getView().setModel(oModel, "ChangePassword");

			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.attachRouteMatched(this.onRouteMatched, this);
		},

		onRouteMatched: function () {
			var aRnmUser = this.getModel("global").getProperty("/aRnmUser");
			if (!aRnmUser) {
				this.getRouter().navTo("RouteMain");
			}
			else {
				var aElements = this.getView().$().find(".loginInputField");
				var aRnmUserInput = aElements[0];
				$(aRnmUserInput).val(aRnmUser);
				var oButton = this.getView().byId("LOGIN_CHANGEPASSWORD");
				oButton.$().on("click", this.onPressChangePassword.bind(this, aRnmUser));
				var oButton = this.getView().byId("CHANGE_PASSWORD_RETURN");
				oButton.$().on("click", this.onNavBack.bind(this, aRnmUser));
			}
		},

		onNavBack: function (oEvent, aRnmUser) {
			this.getRouter().navTo("RouteMain");
		},

		onPressChangePassword: function (oEvent, aRnmUser) {
			var that = this,
				aElements = this.getView().$().find(".loginInputField"),
				aRnmUser = aElements[0].value,
				aRnmPass = aElements[1].value,
				aRnmNewPassword = aElements[2].value,
				aRnmNewPassword2 = aElements[3].value,
				oModel = this.getModel();

			if (!aRnmNewPassword || !aRnmPass || !aRnmNewPassword2 || !aRnmUser) {
				sap.m.MessageToast.show("Tem de preencher todos os campos...");
				return;
			}

			if (aRnmNewPassword == aRnmPass || aRnmNewPassword2 == aRnmPass) {
				sap.m.MessageToast.show("A nova senha não pode ser igual à senha atual.");
				return;
			}

			if (aRnmNewPassword != aRnmNewPassword2) {
				sap.m.MessageToast.show("A nova senha inserida não corresponde a confirmação da nova senha.");
				return;
			}

			var oAuthData = {
				username: aRnmUser,
				password: aRnmPass,
				newpassword: aRnmNewPassword
			};

			oModel.read("/AUTHENTICATOR", {
				headers: {
					"authorization": oAuthData.username + ":" + oAuthData.password,
					"authorization-word": oAuthData.newpassword
				},
				success: function (oData, oResponse) {
					if (oData.results[0].Response.includes('SUCCESS')) {
						that.getRouter().navTo("RouteMain");
					}
					else
						sap.m.MessageToast.show(oData.results[0].Response);
				},
				error: function (oError) {
					console.error("Erro na solicitação:", oError);
				}
			});
		}
	});
});
