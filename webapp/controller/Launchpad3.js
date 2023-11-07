sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"./ErrorHandler"
], function (BaseController, JSONModel, ErrorHandler) {
	"use strict";

	var AppOpen, AppHeaderOpen;

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

			this.boundF5Pressed = this._onF5Pressed.bind(this);
			// Your onInit code here

			if (!this._f5ListenerAdded) {
				document.addEventListener('keydown', this.boundF5Pressed);
				this._f5ListenerAdded = true;
			}

		},

		onNavBack: function (oEvent) {
			if (sessionStorage.getItem("bHistory")) {

				sessionStorage.setItem("app", sessionStorage.getItem("lastAppOpen"));
				sessionStorage.setItem("bHistoryCheck", true);
				sessionStorage.removeItem("bHistory");
				sessionStorage.removeItem("iframeState");
				sessionStorage.removeItem("iframeLink");
				sessionStorage.removeItem("iframeHeader");
				this.onRouteMatched();
			}
			else {
				sessionStorage.removeItem("iframeState");
				sessionStorage.removeItem("iframeLink");
				sessionStorage.removeItem("iframeHeader");
				this.byId("btNavBack").setProperty("visible", false);
				window.location.reload(true);
			}
		},

		onAfterRendering: function () {
			var that = this;
			window.addEventListener("message", function (event) {
				var data = event.data;

				if (data === "reloadIframe") {
					that.onOpenApp(AppOpen, AppHeaderOpen);
				} else if (["onCreateEquipments", "onCreateDrivers"].includes(data)) {
					var appMap = {
						"onCreateEquipments": "App012",
						"onCreateDrivers": "App013"
					};

					sessionStorage.setItem("bHistory", true);
					sessionStorage.setItem("lastAppOpen", "App019");
					sessionStorage.setItem("create", true);
					sessionStorage.setItem("app", appMap[data]);

					["iframeState", "iframeLink", "iframeHeader"].forEach(function (key) {
						sessionStorage.removeItem(key);
					});

					that.onRouteMatched();
				}
			});
		},

		_onF5Pressed: function (event) {
			if (event.which === 116 || (event.ctrlKey && event.which === 82)) {
				event.preventDefault();

				if (this.__iframeOpened)
					this.onOpenApp(AppOpen, AppHeaderOpen);
				else {

					sessionStorage.removeItem("iframeState");
					sessionStorage.removeItem("iframeLink");
					sessionStorage.removeItem("iframeHeader");
					this.byId("btNavBack").setProperty("visible", false);
					window.location.reload(true);
				}
			}

		},

		onRouteMatched: function () {
			var that = this;

			this._setThemeBasedStyles();
			this.__iframeOpened = false;

			if (sessionStorage.getItem("iframeState") === "opened") {
				this.onOpenApp(sessionStorage.getItem("iframeLink"), sessionStorage.getItem("iframeHeader"));
				["iframeState", "iframeLink", "iframeHeader"].forEach(sessionStorage.removeItem.bind(sessionStorage));
			}

			if (!sessionStorage.getItem('rnm_tk')) {
				this.getRouter().navTo("RouteMain");
				return;
			}

			this._loadUserProfileAndApps();
		},

		_setThemeBasedStyles: function () {
			var oTheme = sessionStorage.getItem("selectedTheme");
			sap.ui.getCore().applyTheme(oTheme);

			var buttonColor = oTheme === "sap_fiori_3_dark" ? "white" : "black";
			var styleContent = `
				.myNavButton {
					color: ${buttonColor} !important;
				}
				.myNavButton:hover {
					color: ${buttonColor} !important;
					border-color: transparent !important;
					background-color: rgba(247, 247, 247, 0.1) !important;
				}
				.myTextColor {
					color: ${buttonColor} !important;
				}
			`;

			var styleElement = document.createElement("style");
			styleElement.type = "text/css";
			styleElement.innerHTML = styleContent;
			document.head.appendChild(styleElement);
		},

		_loadUserProfileAndApps: function () {
			var that = this;
			var userName = sessionStorage.getItem("userName");
			this.getModel("Launchpad").setProperty("/userName", this._extractInitials(userName));

			var userLanguage = sessionStorage.getItem("oLangu") || "PT";
			var serviceUrlWithLanguage = this.getModel().sServiceUrl + (this.getModel().sServiceUrl.includes("?") ? "&" : "?") + "sap-language=" + userLanguage;

			var oModel = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: serviceUrlWithLanguage,
				headers: {
					"authorization": sessionStorage.getItem('rnm_tk'),
					"launchpadlangu": userLanguage
				}
			});

			oModel.read("/LAUNCHPADSet", {
				success: function (oData) {
					try {
						that.getModel("global").setProperty("/busy", true);
						that.getModel("global").setProperty("/userName", oData.results[0].UserName);
						that.getModel("global").setProperty("/partner", oData.results[0].BuSort1);
						if (sessionStorage.getItem("iframeState") !== "opened") {
							that.onLoadLaunchpad(oData.results);
						}
					} catch {
						that._resetAndReload();
					}
				},
				error: function (oError) {
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
		},

		_extractInitials: function (name) {
			return (name.match(/\b\w/g) || []).join('').toUpperCase();
		},

		_resetAndReload: function () {
			this.getModel("global").setProperty("/busy", true);
			["iframeState", "iframeLink", "iframeHeader"].forEach(sessionStorage.removeItem.bind(sessionStorage));
			this.byId("btNavBack").setProperty("visible", false);
			sessionStorage.setItem("rnm_tk", 'undefined');
			this.onRouteMatched();
		},

		onLoadLaunchpad: function (AppsToAdd) {
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
					id: "App" + element.AppId,
					header: element.AppHeader,
					subheader: element.AppSubheader,
					press: function () {
						that.getModel("global").setProperty("/busy", true);
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
			if (sessionStorage.getItem("create") || sessionStorage.getItem("bHistoryCheck")) {
				var oTile = sap.ui.getCore().byId(sessionStorage.getItem("app"));
				oTile.firePress();
				that.getModel("global").setProperty("/busy", true);
			}

		},

		onOpenApp: function (AppLink, AppHeader) {
			var that = this;
			var oDynamicPage = this.byId("DynamicApps");

			this._checkSessionState(AppLink);

			AppOpen = AppLink;
			AppHeaderOpen = AppHeader;

			if (!AppLink || !AppHeader) return;

			this._configureAppProperties();

			setTimeout(function () {
				that._initializeContent(oDynamicPage, AppLink, AppHeader);
			}, 1000);

			setTimeout(function () {
				that.getModel("global").setProperty("/busy", false);
			}, 1000);
		},

		_checkSessionState: function (AppLink) {
			if (sessionStorage.getItem("create") || sessionStorage.getItem("bHistoryCheck")) {
				if (sessionStorage.getItem("app") === 'App013') AppLink += "#/NewEntry";
				this.getModel("global").setProperty("/busy", false);
				sessionStorage.removeItem("create");
				sessionStorage.removeItem("app");
			}
		},

		_configureAppProperties: function () {
			this.__iframeOpened = true;
			this.byId("btNavBack").setProperty("visible", true);

			sessionStorage.setItem("iframeState", "opened");
			sessionStorage.setItem("iframeLink", AppOpen);
			sessionStorage.setItem("iframeHeader", AppHeaderOpen);
		},

		_initializeContent: function (page, AppLink, AppHeader) {
			var that = this;

			page.destroyContent();
			page.setProperty("visible", true);

			var oPage = new sap.m.Page({
				id: "pgContent",
				title: AppHeader,
				showNavButton: false,
				navButtonPress: function () {
					that.onRouteMatched();
				}
			});

			oPage.addContent(new sap.ui.core.HTML({
				id: "tempIFrame",
				content: `<iframe src='${AppLink}' width='100%' height='99%' frameBorder='0'></iframe>`
			}));

			page.setContent(oPage);
			that.getModel("global").setProperty("/busy", true);
		},

		openSettingsDialog: function () {
			var that = this;

			var createSelect = function (modelPath, model) {
				return new sap.m.Select({
					items: {
						path: modelPath,
						template: new sap.ui.core.Item({
							key: "{languages>key}",
							text: "{languages>text}"
						})
					}
				});
			};

			this.getView().setModel(new sap.ui.model.json.JSONModel("model/local.json"), "languages");

			var oModel = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: this.getModel().sServiceUrl,
				headers: {
					"authorization": sessionStorage.getItem("rnm_tk")
				}
			});

			var oSelect = createSelect("languages>/languages");
			var oTheme = createSelect("languages>/themes");

			var i18n = this.getView().getModel("i18n").getResourceBundle();

			var oDialog = new sap.m.Dialog({
				title: i18n.getText("Settings"),
				content: [
					new sap.ui.layout.form.SimpleForm({
						content: [
							new sap.m.Label({ text: i18n.getText("Language") }).addStyleClass("myTextColor"),
							oSelect,
							new sap.m.Label({ text: i18n.getText("appTheme") }).addStyleClass("myTextColor"),
							oTheme
						]
					})
				],
				buttons: [
					new sap.m.Button({
						text: i18n.getText("cancel"),
						press: function () {
							oDialog.close();
						}
					}),
					new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: i18n.getText("save"),
						press: function () {
							that._updateSettings(oSelect, oTheme, oModel);
							oDialog.close();
						}
					})
				],
				afterClose: function () {
					oDialog.destroy();
				}
			});

			oSelect.setSelectedKey(sessionStorage.getItem("oLangu"));
			oTheme.setSelectedKey(sessionStorage.getItem("selectedTheme"));

			this.getView().addDependent(oDialog);
			oDialog.open();
		},

		_updateSettings: function (oSelect, oTheme, oModel) {
			var that = this;

			var newLang = oSelect.getSelectedKey();
			if (newLang !== sessionStorage.getItem("oLangu")) {
				sessionStorage.setItem("oLangu", newLang);
				sap.ui.getCore().getConfiguration().setLanguage(newLang);
			}
			if (oTheme.getSelectedKey() !== sessionStorage.getItem("selectedTheme")) {
				sessionStorage.setItem("selectedTheme", oTheme.getSelectedKey());

				var oEntry = {
					Usrid: sessionStorage.getItem("usrid"),
					UsrTheme: oTheme.getSelectedKey()
				};

				oModel.update("/AUTHENTICATOR('" + oEntry.Usrid + "')", oEntry, {
					success: function () {
						that.getModel().refresh(true);
					},
					error: function (oError) {
						sap.m.MessageBox.alert(JSON.parse(oError.responseText).error.message.value, {
							icon: "ERROR"
						});
					}
				});
			}

			that.onRouteMatched();
		},

		onPressLogoutPopover: function (oEvent) {
			var that = this;

			var oName = this.getModel("global").getProperty("/userName");
			var oPopover = new sap.m.Popover({
				title: oName, // Título do Popover
				placement: "Bottom", // Posição do Popover
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
				icon: "sap-icon://settings",
				press: function (event) {
					that.openSettingsDialog();
				}
			}).addStyleClass("myNavButton")
			oFlexBox.addItem(oBTSettings);

			var oBTAbout = new sap.m.Button({
				text: this.getView().getModel("i18n").getResourceBundle().getText("About"),
				type: "Unstyled",
				icon: "sap-icon://hint",
				press: function (event) {
					sap.m.MessageBox.information(that.getView().getModel("i18n").getResourceBundle().getText("version")
						+ ": " + that.getModel("global").getProperty("/version") + "\r\n\n"
						+ that.getView().getModel("i18n").getResourceBundle().getText("partner") + ": "
						+ that.getModel("global").getProperty("/partner"));
				}
			}).addStyleClass("myNavButton");
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
								sessionStorage.removeItem("iframeState");
								sessionStorage.removeItem("iframeLink");
								sessionStorage.removeItem("iframeHeader");
								sessionStorage.removeItem("usrid");
								that.byId("btNavBack").setProperty("visible", false);
								sessionStorage.setItem("rnm_tk", 'undefined');
								that.onRouteMatched();
							}
						}
					});

				}
			}).addStyleClass("myNavButton");
			oFlexBox.addItem(oBTSignOut);

			oPopover.addContent(oFlexBox); // Adicionar a FlexBox ao conteúdo do Popover

			var oView = this.getView();
			oView.addDependent(oPopover);

			var oButton = oEvent.getSource(); // Substitua pelo ID correto do botão que abre o Popover
			oPopover.openBy(oButton);

		}


		// onPressLogoutPopover: function(oEvent) {
		// 	var that = this;
		// 	var i18n = this.getView().getModel("i18n").getResourceBundle();
		// 	var globalModel = this.getModel("global");

		// 	var createButton = function(textKey, icon, pressFunction) {
		// 		return new sap.m.Button({
		// 			text: i18n.getText(textKey),
		// 			type: "Unstyled",
		// 			icon: "sap-icon://" + icon,
		// 			press: pressFunction
		// 		}).addStyleClass("myNavButton");
		// 	};

		// 	var oPopover = new sap.m.Popover({
		// 		title: globalModel.getProperty("/userName"), 
		// 		placement: "Bottom"
		// 	});

		// 	var oFlexBox = new sap.m.FlexBox({
		// 		height: "auto",
		// 		alignItems: "Start",
		// 		justifyContent: "End",
		// 		direction: "Column"
		// 	});

		// 	var buttons = [
		// 		{
		// 			key: "Settings",
		// 			icon: "settings",
		// 			press: function() { that.openSettingsDialog(); }
		// 		},
		// 		{
		// 			key: "About",
		// 			icon: "hint",
		// 			press: function() {
		// 				var message = i18n.getText("version") + ": " + globalModel.getProperty("/version") + "\r\n\n" + i18n.getText("partner") + ": " + globalModel.getProperty("/partner");
		// 				sap.m.MessageBox.information(message);
		// 			}
		// 		},
		// 		{
		// 			key: "SignOut",
		// 			icon: "log",
		// 			press: function() {
		// 				var message = i18n.getText("onLogout");
		// 				sap.m.MessageBox.confirm(message, {
		// 					actions: [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO],
		// 					emphasizedAction: sap.m.MessageBox.Action.YES,
		// 					onClose: function(oAction) {
		// 						if (oAction == 'YES') {
		// 							that._handleLogoutActions();
		// 						}
		// 					}
		// 				});
		// 			}
		// 		}
		// 	];

		// 	buttons.forEach(function(button) {
		// 		oFlexBox.addItem(createButton(button.key, button.icon, button.press));
		// 	});

		// 	oPopover.addContent(oFlexBox);

		// 	var oView = this.getView();
		// 	oView.addDependent(oPopover);

		// 	oPopover.openBy(oEvent.getSource());
		// },

		// _handleLogoutActions: function() {
		// 	var globalModel = this.getModel("global");
		// 	globalModel.setProperty("/busy", true);
		// 	["iframeState", "iframeLink", "iframeHeader", "usrid"].forEach(sessionStorage.removeItem.bind(sessionStorage));
		// 	this.byId("btNavBack").setProperty("visible", false);
		// 	sessionStorage.setItem("rnm_tk", 'undefined');
		// 	this.onRouteMatched();
		// }



	});
});
