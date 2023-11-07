sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"./ErrorHandler"
], function (BaseController, JSONModel, ErrorHandler) {
	"use strict";

	return BaseController.extend("authenticator.controller.Launchpad", {
		onInit: function () {
			// Create and set the JSON model
			var oModel = new JSONModel(
				{
					userName: ""
				}
			);
			this.getView().setModel(oModel, "Launchpad");
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.attachRouteMatched(this.onRouteMatched, this);
			// debugger;
			// sap.ui.getCore().getConfiguration().setLanguage(sessionStorage.getItem("oLangu"));

			// Your onInit code here
		},

		onAfterRendering: function () {
			// 
			// var rnm_tk = sessionStorage.getItem('rnm_tk');

			// if (rnm_tk == null) {
			// 	this.getRouter().navTo("RouteMain");
			// }
			// var oModel = this.getModel();

		},

		onRouteMatched: function () {

			var that = this;
			var rnm_tk = sessionStorage.getItem('rnm_tk');
			if (rnm_tk == null || rnm_tk == 'undefined') {
				this.getRouter().navTo("RouteMain");
			} else {
				//ALTEREI
				this.getModel("Launchpad").setProperty("/userName", sessionStorage.getItem("userName").slice(0, 2));
				// this.getModel("Launchpad").setProperty("/userName", "JM");
				var oModel = this.getModel();
				oModel.read("/LAUNCHPADSet", {
					headers: {
						"authorization": rnm_tk
					},
					success: function (oData, oResponse) {
						that.getModel("global").setProperty("/busy", true);
						// CARREGAR AS APPS DISPONÍVEIS 
						that.getModel("global").setProperty("/userName", oData.results[0].UserName);
						that.onLoadLaunchpad(oData.results);
						// that.onOpenApp();
						// console.log(oData);
					},
					error: function (oError) {
						// AQUI LIMPAMOS A SESSÃO PORQUE O TOKEN NÃOE É VALIDO
						sessionStorage.setItem("rnm_tk", 'undefined');
						that.getModel("global").setProperty("/busy", true);
						var sError = JSON.parse(oError.responseText).error.message.value;
						sap.m.MessageBox.alert(sError, {
							icon: "ERROR",
							onClose: null,
							styleClass: '',
							initialFocus: null,
							textDirection: sap.ui.core.TextDirection.Inherit
						});
						that.getRouter().navTo("RouteMain");
					}
				});

			}
		},

		onLoadLaunchpad: function (AppsToAdd) {
			// var oDynamicPage = this.byId("MainContent");
			// oDynamicPage.destroyContent();
			var oDynamicApps = this.byId("DynamicApps");
			oDynamicApps.destroyContent();
			var oDynamicPage = new sap.ui.layout.VerticalLayout({
				width: "100%",
				id: "MainContent"
			});

			var createdGroups = [];
			var that = this;

			AppsToAdd.forEach(element => {
				delete element.__metadata
			});

			//adicionar o title e a vbox
			var verticalLayout = new sap.ui.layout.VerticalLayout({
				width: "100%",
				id: "vlTemp"
			});

			// criar os grupos
			AppsToAdd.forEach(element => {

				if (createdGroups.indexOf(element.GrpId) === -1) {
					var title = new sap.m.Title({
						level: "H4",
						titleStyle: "H4",
						text: element.GrpTitle
					});

					var vBox = new sap.m.VBox({
						id: "vbContent" + element.GrpId
					});

					createdGroups.push(element.GrpId);
					verticalLayout.addContent(title);
					verticalLayout.addContent(vBox);
				}

			});


			AppsToAdd.forEach(element => {
				var genericTile1 = new sap.m.GenericTile({
					// class: "sapUiTinyMarginBegin sapUiTinyMarginTop tileLayout",
					header: element.AppHeader,
					subheader: element.AppSubheader,
					press: function () {
						that.getModel("global").setProperty("/busy", true);
						// sap.ui.core.BusyIndicator.show();
						that.onOpenApp(element.AppLink, element.AppHeader);
					}
				});

				var tileContent1 = new sap.m.TileContent({
					// unit: "0",
					// footer: element.AppFooter
				});

				var imageContent = new sap.m.ImageContent({
					src: element.AppIcon,
					description: "Adicionar Descrição"
				});

				tileContent1.setContent(imageContent);
				genericTile1.addTileContent(tileContent1);

				var vBox = sap.ui.getCore().byId("vbContent" + element.GrpId);
				vBox.addItem(genericTile1);
			})
			oDynamicPage.addContent(verticalLayout);
			oDynamicPage.setProperty("visible", true);
			oDynamicApps.setContent(oDynamicPage);
			that.getModel("global").setProperty("/busy", false);
		},

		onOpenApp: function (AppLink, AppHeader) {

			var that = this;
			var oDynamicPage = this.byId("DynamicApps");

			setTimeout(function () {
				that.getModel("global").setProperty("/busy", true);
				oDynamicPage.destroyContent();
				oDynamicPage.setProperty("visible", true);

				// Criar o Button
				var button = new sap.m.Button({
					icon: "sap-icon://decline",
					layoutData: new sap.m.ToolbarLayoutData({
						shrinkable: true,
						maxWidth: "400px"
					}),
					press: function () {
						that.onRouteMatched();
					}
				});

				var oPage = new sap.m.Page({
					id: "pgContent",
					title: AppHeader,
					showNavButton: false,
					navButtonPress: function () {
						that.onRouteMatched();
					}
				});

				var Refreshbutton = new sap.m.Button({
					icon: "sap-icon://refresh",
					layoutData: new sap.m.ToolbarLayoutData({
						shrinkable: true,
						maxWidth: "400px"
					}),
					press: function () {
						that.onOpenApp(AppLink, AppHeader);
					}
				});

				oPage.addHeaderContent(Refreshbutton);
				oPage.addHeaderContent(button);
				oPage.addContent(new sap.ui.core.HTML({
					id: "tempIFrame",
					content: "<iframe src='" + AppLink + "' width='100%' height='99%' frameBorder='0'></iframe>"
				}));

				oDynamicPage.setContent(oPage);
			}, 1000);



			// Definir o atraso de 5 segundos antes de definir o conteúdo do DynamicPage
			setTimeout(function () {

				that.getModel("global").setProperty("/busy", false);
				// sap.ui.core.BusyIndicator.hide();
			}, 1000);

			// oDynamicPage.setContent(oPage);
			// this.getModel("global").setProperty("/busy", false);

		},

		onPressLogoutPopover: function (oEvent) {
			var that = this;

			var oName = this.getModel("global").getProperty("/userName");
			var oPopover = new sap.m.Popover({
				title: oName, // Título do Popover
				// titleAlignment: 'Center',
				placement: "Bottom", // Posição do Popover
				// contentWidth: "15rem" // Largura do conteúdo do Popover
			});

			var oFlexBox = new sap.m.FlexBox({
				height: "auto",
				alignItems: "Start",
				justifyContent: "End",
				direction: "Column" // Alinhar os itens verticalmente em coluna
			});

			var oBTSettings = new sap.m.Button({
				text: this.getView().getModel("i18n").getResourceBundle().getText("Settings"),
				type: "Unstyled",
				icon: "sap-icon://settings"
			}).addStyleClass("myNavButton")
			// oBTSettings.addStyleClass("sapUiTinyMarginBegin"); // Adicionar classe CSS para espaçamento entre os botões
			oFlexBox.addItem(oBTSettings);

			var oBTAbout = new sap.m.Button({
				text: this.getView().getModel("i18n").getResourceBundle().getText("About"),
				type: "Unstyled",
				icon: "sap-icon://hint",
				press: function (event) {
					sap.m.MessageBox.information(that.getView().getModel("i18n").getResourceBundle().getText("version") + ": " + that.getModel("global").getProperty("/version"));
				}
			}).addStyleClass("myNavButton");
			// oBTAbout.addStyleClass("sapUiTinyMarginBegin"); // Adicionar classe CSS para espaçamento entre os botões
			oFlexBox.addItem(oBTAbout);

			var oBTSignOut = new sap.m.Button({
				text: this.getView().getModel("i18n").getResourceBundle().getText("SignOut"),
				type: "Unstyled",
				icon: "sap-icon://log",
				press: function (event) {

					sap.m.MessageBox.confirm(that.getView().getModel("i18n").getResourceBundle().getText("onLogout"), {
						actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
						emphasizedAction: sap.m.MessageBox.Action.YES,
						onClose: function (oAction) {
							if (oAction == 'YES') {
								that.getModel("global").setProperty("/busy", true);
								sessionStorage.setItem("rnm_tk", 'undefined')
								that.onRouteMatched();
							}
						}
					});

				}
			}).addStyleClass("myNavButton");
			// oBTSignOut.addStyleClass("sapUiTinyMarginBegin"); // Adicionar classe CSS para espaçamento entre os botões
			oFlexBox.addItem(oBTSignOut);

			oPopover.addContent(oFlexBox); // Adicionar a FlexBox ao conteúdo do Popover

			var oView = this.getView();
			oView.addDependent(oPopover);

			var oButton = oEvent.getSource(); // Substitua pelo ID correto do botão que abre o Popover
			oPopover.openBy(oButton);

		}

		// Other controller methods here
	});
});
