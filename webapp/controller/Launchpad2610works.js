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
			// 
			// sap.ui.getCore().getConfiguration().setLanguage(sessionStorage.getItem("oLangu"));
			this.boundF5Pressed = this._onF5Pressed.bind(this);
			// Your onInit code here

			if (!this._f5ListenerAdded) {
				document.addEventListener('keydown', this.boundF5Pressed);
				this._f5ListenerAdded = true;
			}

		},

		onCreatePopupNotification: function (notifText) {
			var oCloseButton = new sap.m.Button({
				icon: "sap-icon://sys-cancel",
				press: function () {
					oPopup.close();
				},
				type: sap.m.ButtonType.Transparent
			}).addStyleClass("closeButtonStyle");

			var oLink = new sap.m.Link({
				text: "Saber Mais",
				href: "#",  // Substitua pelo URL desejado
				target: "_blank"
			});

			var oVBox = new sap.m.VBox({
				items: [
					new sap.m.Text({
						text: notifText
					}),
					oLink
				]
			}).addStyleClass('notificationStyle');

			var oHBox = new sap.m.HBox({
				justifyContent: "SpaceBetween", // Distribuirá o conteúdo e o botão de fechamento nas extremidades opostas
				items: [
					oVBox,
					oCloseButton
				]
			});

			var oPanel = new sap.m.Panel({
				content: [oHBox],
				width: "auto",
				height: "auto"
			}).addStyleClass("customPanelStyle");

			var oPopup = new sap.ui.core.Popup(oPanel, /*modal=*/ false, /*shadow=*/ true, /*autoClose=*/ false);
			oPopup.setPosition(sap.ui.core.Popup.Dock.EndBottom, sap.ui.core.Popup.Dock.EndBottom, window, "-25 0", "fit");

			oPopup.open();

			setTimeout(() => {
				oPopup.close();
			}, 5000);
		},

		onInitWebSocket: function () {

			var that = this;

			var hostLocation = window.location,

				socket, socketHostURI, webSocketURI;

			if (hostLocation.protocol === 'https:') {

				socketHostURI = 'wss:';

			} else {

				socketHostURI = 'ws:';

			}

			socketHostURI += '//' + hostLocation.host;

			// webSocketURI = socketHostURI + '/sap/bc/apc/tqa/apc';
			webSocketURI = "ws://erpdev.rnm.local:50000" + '/sap/bc/apc/tqa/apc';
			// webSocketURI = socketHostURI + '/sap/bc/apc/tqa/tcp_apc';

			var tokenUser = sessionStorage.getItem('rnm_tk');

			if (tokenUser) {

				socket = new WebSocket(webSocketURI);

				socket.onerror = function (error) {
					console.error("WebSocket Error: ", error);
				};

				socket.onopen = function () {
					socket.send(JSON.stringify({ token: tokenUser }));
				};

				socket.onmessage = function (notification) {

					if (notification.data !== undefined) {

						jQuery.sap.require('sap.m.MessageBox');

						sap.m.InstanceManager.closeAllDialogs();

						that.getOwnerComponent().getModel().refresh();

						that.onCreatePopupNotification(notification.data);

					}

				};

				socket.onclose = function () {
					that.onInitWebSocket();
				};
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
				this.onRouteMatched();
				// JOMOTA 27/09/2023
				// window.location.reload(true);
			}
		},

		onAfterRendering: function () {
			// this.byId("_IDGenDynamicPageTitle1").addContent(new sap.m.Text({ text: "ASDAS"}));

			var that = this;
			window.addEventListener("message", function (event) {
				var data = event.data;
				if (data.action === "reloadIframe") {
					// Aqui, recarregue o iframe
					that.onOpenApp(AppOpen, AppHeaderOpen);
				}
				else if (data.action === "onCreateEquipments" || data.action === "navToDrivers") {
					// GUARDAR HISTÓRICO PARA O NAVBACK SALTAR PARA A APLICAÇÃO ANTERIOR
					sessionStorage.setItem("bHistory", true);
					sessionStorage.setItem("lastAppOpen", "App019");
					if (data.action === "onCreateEquipments") {
						sessionStorage.setItem("create", true);
						sessionStorage.setItem("app", "App012");
						sessionStorage.removeItem("iframeState");
						sessionStorage.removeItem("iframeLink");
						sessionStorage.removeItem("iframeHeader");
						that.onRouteMatched();
					}
					else if (data.action === "navToDrivers") {
						debugger;
						sessionStorage.setItem("create", true);
						sessionStorage.setItem("app", "App013");
						sessionStorage.setItem("sPathOpen", data.pathToOpen);
						sessionStorage.setItem("sPathBack", data.pathToback);
						sessionStorage.removeItem("iframeState");
						sessionStorage.removeItem("iframeLink");
						sessionStorage.removeItem("iframeHeader");
						that.onRouteMatched();
					}
				}
				// else if (data.action === "onDriverDetail" || data.action === "onEquipmentDetail") {
				// 	sessionStorage.setItem("bHistory", true);
				// 	sessionStorage.setItem("lastAppOpen", "App019");
				// 	sessionStorage.setItem("showDetail", true);
				// 	if (data.action === "onEquipmentDetail") {
				// 		sessionStorage.setItem("app", "App012");
				// 		sessionStorage.setItem("EquipmentDetail", true);
				// 		sessionStorage.setItem("partner", data.partner);
				// 		sessionStorage.setItem("requestid", data.requestid);
				// 		sessionStorage.removeItem("iframeState");
				// 		sessionStorage.removeItem("iframeLink");
				// 		sessionStorage.removeItem("iframeHeader");
				// 		that.onRouteMatched();
				// 	}
				// 	else if (data.action === "onDriverDetail") {
				// 		sessionStorage.setItem("app", "App013");
				// 		sessionStorage.setItem("driverDetail", true);
				// 		sessionStorage.setItem("partner", data.partner);
				// 		sessionStorage.setItem("userid", data.user);
				// 		sessionStorage.removeItem("iframeState");
				// 		sessionStorage.removeItem("iframeLink");
				// 		sessionStorage.removeItem("iframeHeader");
				// 		that.onRouteMatched();
				// 	}
				// }
			});



		},


		onOpenNotificationPopover: function (oEvent) {
			if (!this._oPopover) {
				this._oPopover = new sap.m.Popover({
					title: this.getView().getModel("i18n").getResourceBundle().getText("notifications"),
					placement: sap.m.PlacementType.Bottom,
					contentWidth: "300px",  // Ajuste conforme necessário
					contentHeight: "400px"  // Ajuste conforme necessário
				});

				debugger;
				var oNotifModel = this.getNotifModel();
				var oList = new sap.m.List({
					items: {
						path: "/xTQAxUSR_NOTIF_DD",
						template: new sap.m.NotificationListItem({
							title: "{title}",
							description: "{description}",
							datetime: {
								path: "sended_at",
								type: new sap.ui.model.type.Date({ pattern: "dd/MM/yyyy" })
							}
							// priority: "{priority}"
						})
					}
				});

				oList.setModel(oNotifModel);

				this._oPopover.addContent(oList);
				this.getView().addDependent(this._oPopover);
			}

			this._oPopover.openBy(oEvent.getSource());
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

			//Definir o tema
			var oTheme = sessionStorage.getItem("selectedTheme");
			sap.ui.getCore().applyTheme(oTheme);

			this.onInitWebSocket();

			var styleElement = document.createElement("style");
			styleElement.type = "text/css";
			if (oTheme == "sap_fiori_3_dark") {
				styleElement.innerHTML = `
				.myNavButton {
					color: white !important;
				}

				.myNavButton:hover {
					color: white !important;
					border-color: transparent !important;
					background-color: rgb(247, 247, 247, 0.1) !important ;
				}
				
				.myTextColor {
					color: white !important;
				}


				.sapMLabel{
					color: white !important;
				}


				.sapFDynamicPageTitle .sapMBtnIcon {
					color: #91c8f6 !important;
				}

			`;
			}
			else {
				styleElement.innerHTML = `
				.myNavButton {
					color: black !important;
				}

				.myNavButton:hover {
					color: black !important;
					border-color: transparent !important;
					background-color: rgb(247, 247, 247, 0.1) !important ;
				}
				
				.myTextColor {
					color: black !important;
				}

				.sapMLabel{
					color: black !important;
				}

				.sapFDynamicPageTitle .sapMBtnIcon {
					color: #91c8f6 !important;
				}
			`;
			}


			document.head.appendChild(styleElement);



			this.__iframeOpened = false;
			if (sessionStorage.getItem("iframeState") === "opened") {
				var AppLink = sessionStorage.getItem("iframeLink");
				var AppHeader = sessionStorage.getItem("iframeHeader");
				sessionStorage.removeItem("iframeState");
				sessionStorage.removeItem("iframeLink");
				sessionStorage.removeItem("iframeHeader");
				this.onOpenApp(AppLink, AppHeader);
			}
			var that = this;
			var rnm_tk = sessionStorage.getItem('rnm_tk');
			if (rnm_tk == null || rnm_tk == 'undefined') {
				this.getRouter().navTo("RouteMain");
			} else {
				//ALTEREI

				var userName = sessionStorage.getItem("userName");
				var words = userName.split(' ');
				// Inicializar uma variável para armazenar as primeiras letras
				var firstChars = '';
				// Loop através das palavras e obter a primeira letra de cada uma
				for (var i = 0; i < words.length; i++) {
					firstChars += words[i].charAt(0);
				}
				// Converter as primeiras letras para maiúsculas
				firstChars = firstChars.toUpperCase();
				this.getModel("Launchpad").setProperty("/userName", firstChars);

				var userLanguage = sessionStorage.getItem("oLangu");
				if (!userLanguage) {
					userLanguage = "PT"; // Neste caso, estou definindo a língua diretamente para "FR" como no seu exemplo
				}
				var serviceUrlWithLanguage = this.getModel().sServiceUrl + (this.getModel().sServiceUrl.includes("?") ? "&" : "?") + "sap-language=" + userLanguage;

				// this.getModel("Launchpad").setProperty("/userName", "JM");

				var oModel = new sap.ui.model.odata.v2.ODataModel({
					serviceUrl: serviceUrlWithLanguage,
					headers: {
						"authorization": rnm_tk,
						"launchpadlangu": userLanguage
					}
				});

				oModel.read("/LAUNCHPADSet", {
					success: function (oData, oResponse) {

						try {
							that.getModel("global").setProperty("/busy", true);
							// CARREGAR AS APPS DISPONÍVEIS 
							that.getModel("global").setProperty("/userName", oData.results[0].UserName);
							that.getModel("global").setProperty("/partner", oData.results[0].BuSort1);
							if (sessionStorage.getItem("iframeState") != "opened")
								that.onLoadLaunchpad(oData.results);
						}
						catch {
							that.getModel("global").setProperty("/busy", true);
							sessionStorage.removeItem("iframeState");
							sessionStorage.removeItem("iframeLink");
							sessionStorage.removeItem("iframeHeader");
							that.byId("btNavBack").setProperty("visible", false);
							sessionStorage.setItem("rnm_tk", 'undefined');
							that.onRouteMatched();
						}

						// if (oData.results) {
						// 	that.getModel("global").setProperty("/busy", true);
						// 	// CARREGAR AS APPS DISPONÍVEIS 
						// 	that.getModel("global").setProperty("/userName", oData.results[0].UserName);
						// 	that.getModel("global").setProperty("/partner", oData.results[0].BuSort1);
						// 	if (sessionStorage.getItem("iframeState") != "opened")
						// 		that.onLoadLaunchpad(oData.results);
						// }
						// else {
						// 	that.getModel("global").setProperty("/busy", true);
						// 	sessionStorage.removeItem("iframeState");
						// 	sessionStorage.removeItem("iframeLink");
						// 	sessionStorage.removeItem("iframeHeader");
						// 	that.byId("btNavBack").setProperty("visible", false);
						// 	sessionStorage.setItem("rnm_tk", 'undefined');
						// 	that.onRouteMatched();
						// }
						// that.onOpenApp();
						// console.log(oData);
					},
					error: function (oError) {
						// AQUI LIMPAMOS A SESSÃO PORQUE O TOKEN NÃO É VALIDO
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

					// var vBox = new sap.m.VBox({
					// 	id: "vbContent" + element.GrpId
					// });
					var vBox = new sap.f.GridContainer({
						id: "vbContent" + element.GrpId,
						containerQuery: true
					}).addStyleClass("gridContainerGap");

					createdGroups.push(element.GrpId);
					verticalLayout.addContent(title);
					verticalLayout.addContent(vBox);
				}

			});


			AppsToAdd.forEach(element => {
				var genericTile1 = new sap.m.GenericTile({
					// class: "sapUiTinyMarginBegin sapUiTinyMarginTop tileLayout",
					id: "App" + element.AppId,
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
			if (sessionStorage.getItem("create") || sessionStorage.getItem("bHistoryCheck")) {
				var oTile = sap.ui.getCore().byId(sessionStorage.getItem("app"));
				oTile.firePress();
				// NewEntry
				that.getModel("global").setProperty("/busy", true);
			}

		},

		// onLoadLaunchpad: function (AppsToAdd) {
		// 	// var oDynamicPage = this.byId("MainContent");
		// 	// oDynamicPage.destroyContent();
		// 	var oDynamicApps = this.byId("DynamicApps");
		// 	oDynamicApps.destroyContent();
		// 	var oDynamicPage = new sap.ui.layout.VerticalLayout({
		// 		width: "100%",
		// 		id: "MainContent"
		// 	});

		// 	var createdGroups = [];
		// 	var that = this;

		// 	AppsToAdd.forEach(element => {
		// 		delete element.__metadata
		// 	});

		// 	//adicionar o title e a vbox
		// 	var verticalLayout = new sap.ui.layout.VerticalLayout({
		// 		width: "100%",
		// 		id: "vlTemp"
		// 	});

		// 	// criar os grupos
		// 	AppsToAdd.forEach(element => {

		// 		if (createdGroups.indexOf(element.GrpId) === -1) {
		// 			var title = new sap.m.Title({
		// 				level: "H4",
		// 				titleStyle: "H4",
		// 				text: element.GrpTitle
		// 			});

		// 			var vBox = new sap.m.VBox({
		// 				id: "vbContent" + element.GrpId
		// 			});

		// 			createdGroups.push(element.GrpId);
		// 			verticalLayout.addContent(title);
		// 			verticalLayout.addContent(vBox);
		// 		}

		// 	});


		// 	AppsToAdd.forEach(element => {
		// 		var genericTile1 = new sap.m.GenericTile({
		// 			// class: "sapUiTinyMarginBegin sapUiTinyMarginTop tileLayout",
		// 			id: "App" + element.AppId,
		// 			header: element.AppHeader,
		// 			subheader: element.AppSubheader,
		// 			press: function () {
		// 				that.getModel("global").setProperty("/busy", true);
		// 				// sap.ui.core.BusyIndicator.show();
		// 				that.onOpenApp(element.AppLink, element.AppHeader);
		// 			}
		// 		});

		// 		var tileContent1 = new sap.m.TileContent({
		// 			// unit: "0",
		// 			// footer: element.AppFooter
		// 		});

		// 		var imageContent = new sap.m.ImageContent({
		// 			src: element.AppIcon,
		// 			description: "Adicionar Descrição"
		// 		});

		// 		tileContent1.setContent(imageContent);
		// 		genericTile1.addTileContent(tileContent1);

		// 		var vBox = sap.ui.getCore().byId("vbContent" + element.GrpId);
		// 		vBox.addItem(genericTile1);
		// 	})
		// 	oDynamicPage.addContent(verticalLayout);
		// 	oDynamicPage.setProperty("visible", true);
		// 	oDynamicApps.setContent(oDynamicPage);
		// 	that.getModel("global").setProperty("/busy", false);
		// 	if (sessionStorage.getItem("create") || sessionStorage.getItem("bHistoryCheck")) {
		// 		var oTile = sap.ui.getCore().byId(sessionStorage.getItem("app"));
		// 		oTile.firePress();
		// 		// NewEntry
		// 		that.getModel("global").setProperty("/busy", true);
		// 	}

		// },

		onOpenApp: function (AppLink, AppHeader) {

			if (sessionStorage.getItem("create") || sessionStorage.getItem("bHistoryCheck") || sessionStorage.getItem("showDetail")) {
				if (sessionStorage.getItem("app") == 'App013') {
					sessionStorage.setItem("app", sessionStorage.getItem("lastAppOpen"));
					sessionStorage.removeItem("lastAppOpen");
					debugger;
					if (!sessionStorage.getItem("sPathOpen")) 
						AppLink = AppLink + "#/NewEntry";
					// else {
					// 	// AppLink = AppLink + "#/xTQAxDRIVERS_DD(partner="+ sessionStorage.getItem('partner') + ",usrid=" + sessionStorage.getItem('userid') + "')";
					// 	AppLink = AppLink + "#/xTQAxDRIVERS_DD" + sessionStorage.getItem("sPathOpen");
					// 	sessionStorage.removeItem("showDetail");
					// 	sessionStorage.removeItem("driverDetail");
					// 	// sessionStorage.removeItem("partner");
					// 	sessionStorage.removeItem("sPathOpen");
					// }
				}
				else if (sessionStorage.getItem("app") == 'App012') {
					AppLink = AppLink + "#/xTQAxEQUIPMENTS_DD(request_id=guid'" + sessionStorage.getItem("requestid") + "',partner='" + sessionStorage.getItem("partner") + "')";
					sessionStorage.removeItem("EquipmentDetail");
					sessionStorage.removeItem("showDetail");
					sessionStorage.removeItem("partner");
					sessionStorage.removeItem("requestid");
				}
				this.getModel("global").setProperty("/busy", false);
				sessionStorage.removeItem("create");
				// sessionStorage.removeItem("app");
			}

			if(sessionStorage.getItem("app") == 'App019')
			{
				sessionStorage.removeItem("app");
			}

			var that = this;
			var oDynamicPage = this.byId("DynamicApps");

			AppOpen = AppLink;
			AppHeaderOpen = AppHeader;


			if (AppLink && AppHeader) {

				this.__iframeOpened = true;
				this.byId("btNavBack").setProperty("visible", true);

				sessionStorage.setItem("iframeState", "opened");
				sessionStorage.setItem("iframeLink", AppLink);
				sessionStorage.setItem("iframeHeader", AppHeader);


				setTimeout(function () {
					that.getModel("global").setProperty("/busy", true);
					oDynamicPage.destroyContent();
					oDynamicPage.setProperty("visible", true);

					// Criar o Button
					// var button = new sap.m.Button({
					// 	icon: "sap-icon://decline",
					// 	layoutData: new sap.m.ToolbarLayoutData({
					// 		shrinkable: true,
					// 		maxWidth: "400px"
					// 	}),
					// 	press: function () {
					// 		sessionStorage.removeItem("iframeState");
					// 		sessionStorage.removeItem("iframeLink");
					// 		sessionStorage.removeItem("iframeHeader");
					// 		that.onRouteMatched();
					// 	}
					// });

					var oPage = new sap.m.Page({
						id: "pgContent",
						title: AppHeader,
						showNavButton: false,
						navButtonPress: function () {
							that.onRouteMatched();
						}
					});

					// var Refreshbutton = new sap.m.Button({
					// 	icon: "sap-icon://refresh",
					// 	layoutData: new sap.m.ToolbarLayoutData({
					// 		shrinkable: true,
					// 		maxWidth: "400px"
					// 	}),
					// 	press: function () {
					// 		that.onOpenApp(AppLink, AppHeader);
					// 	}
					// });

					// oPage.addHeaderContent(Refreshbutton);
					// oPage.addHeaderContent(button);
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
			}
			// oDynamicPage.setContent(oPage);
			// this.getModel("global").setProperty("/busy", false);

		},

		openSettingsDialog: function () {
			var that = this;
			var oMLanguages = new sap.ui.model.json.JSONModel("model/local.json");


			var serviceUrlWithLanguage = this.getModel().sServiceUrl;
			var rnm_tk = sessionStorage.getItem("rnm_tk");

			var oModel = new sap.ui.model.odata.v2.ODataModel({
				serviceUrl: serviceUrlWithLanguage,
				headers: {
					"authorization": rnm_tk
				}
			});

			this.getView().setModel(oMLanguages, "languages");

			var oSelect = new sap.m.Select({
				items: {
					path: "languages>/languages",
					template: new sap.ui.core.Item({
						key: "{languages>key}",
						text: "{languages>text}"
					})
				}
			});
			var oTheme = new sap.m.Select({
				items: {
					path: "languages>/themes",
					template: new sap.ui.core.Item({
						key: "{languages>key}",
						text: "{languages>text}"
					})
				}
			});


			var oShortcuts = new sap.m.CheckBox({ text: this.getView().getModel("i18n").getResourceBundle().getText("allShortCuts") });
			var oDialog = new sap.m.Dialog({
				title: this.getView().getModel("i18n").getResourceBundle().getText("Settings"),
				content: [
					new sap.ui.layout.form.SimpleForm({
						content: [
							new sap.m.Label({
								text: this.getView().getModel("i18n").getResourceBundle().getText("Language"),
							}).addStyleClass("myTextColor"),
							oSelect,
							new sap.m.Label({
								text: this.getView().getModel("i18n").getResourceBundle().getText("appTheme")
							}).addStyleClass("myTextColor"),
							oTheme,
							new sap.m.Label({ text: this.getView().getModel("i18n").getResourceBundle().getText("shortCuts") }).addStyleClass("myTextColor"),
							new sap.m.HBox({
								items: [
									oShortcuts,
									new sap.m.Link({
										text: this.getView().getModel("i18n").getResourceBundle().getText("readMore"),
										press: function () {
											if (!this._oDialog) {
												this._oDialog = new sap.m.Dialog({
													title: this.getView().getModel("i18n").getResourceBundle().getText("shortcutsInformation"),
													content: new sap.m.Text({
														text: this.getView().getModel("i18n").getResourceBundle().getText("shortcutsInformationText")
													}).addStyleClass("sapUiSmallMargin"),
													beginButton: new sap.m.Button({
														text: "Close",
														press: function () {
															this._oDialog.close();
														}.bind(this)
													})
												});
											}
											this._oDialog.open();
										}.bind(this)
									})
								],
								// justifyContent: "SpaceBetween",
								alignItems: "Center",
							})
						]
					})
				],
				buttons: [
					new sap.m.Button({
						text: this.getView().getModel("i18n").getResourceBundle().getText("cancel"),
						press: function () {
							oDialog.close();
						}
					}),
					new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: this.getView().getModel("i18n").getResourceBundle().getText("save"),
						press: function () {
							var oLangu = oSelect.getSelectedKey();
							if (oLangu != sessionStorage.getItem("oLangu")) {
								sessionStorage.setItem("oLangu", oLangu);
								sap.ui.getCore().getConfiguration().setLanguage(oLangu);
							}
							if (oTheme.getSelectedKey() != sessionStorage.getItem("selectedTheme") || oShortcuts.getSelected() != sessionStorage.getItem("shortcuts")) {
								sessionStorage.setItem("selectedTheme", oTheme.getSelectedKey());
								sessionStorage.setItem("shortcuts", oShortcuts.getSelected().toString());

								var oEntry = {};
								oEntry.Usrid = sessionStorage.getItem("usrid");
								oEntry.UsrTheme = oTheme.getSelectedKey();
								if (oShortcuts.getSelected())
									oEntry.UsrShortcuts = "X";
								else
									oEntry.UsrShortcuts = "";




								oModel.update("/AUTHENTICATOR('" + oEntry.Usrid + "')", oEntry, {
									success: function (oData) {
										that.getModel().refresh(true);
										// sap.m.MessageBox.success("Equipamento Atualizado!");
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
									}
								});

							}
							// if (oShortcuts.getSelected() != sessionStorage.getItem("shortcuts")) {
							// 	
							// 	sessionStorage.setItem("shortcuts", oShortcuts.getSelected().toString());
							// 	var oEntry = {};
							// 	oEntry.Usrid = sessionStorage.getItem("usrid");
							// 	if (oShortcuts.getSelected())
							// 		oEntry.UsrShortcuts = "X";
							// 	else
							// 		oEntry.UsrShortcuts = "";



							// 	oModel.update("/AUTHENTICATOR('" + oEntry.Usrid + "')", oEntry, {
							// 		success: function (oData) {
							// 			that.getModel().refresh(true);
							// 			// sap.m.MessageBox.success("Equipamento Atualizado!");
							// 		},
							// 		error: function (oError) {
							// 			var sError = JSON.parse(oError.responseText).error.message.value;
							// 			sap.m.MessageBox.alert(sError, {
							// 				icon: "ERROR",
							// 				onClose: null,
							// 				styleClass: '',
							// 				initialFocus: null,
							// 				textDirection: sap.ui.core.TextDirection.Inherit
							// 			});
							// 		}
							// 	});
							// }

							that.onRouteMatched();
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

			var check = false;
			if (sessionStorage.getItem("shortcuts") == 'true')
				check = true;
			oShortcuts.setSelected(check);

			this.getView().addDependent(oDialog);
			oDialog.open();
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

			var oBTInbox = new sap.m.Button({
				text: this.getView().getModel("i18n").getResourceBundle().getText("Inbox"),
				type: "Unstyled",
				icon: "sap-icon://inbox",
				press: function (event) {
					that.openSettingsDialog();
				}
			}).addStyleClass("myNavButton")
			oFlexBox.addItem(oBTInbox);

			var oBTSettings = new sap.m.Button({
				text: this.getView().getModel("i18n").getResourceBundle().getText("Settings"),
				type: "Unstyled",
				icon: "sap-icon://settings",
				press: function (event) {
					that.openSettingsDialog();
				}
			}).addStyleClass("myNavButton")
			// oBTSettings.addStyleClass("sapUiTinyMarginBegin"); // Adicionar classe CSS para espaçamento entre os botões
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
