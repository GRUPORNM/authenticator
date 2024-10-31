sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"./ErrorHandler",
	"sap/m/PDFViewer"
], function (BaseController, JSONModel, ErrorHandler, PDFViewer) {
	"use strict";

	var AppOpen, AppHeaderOpen;

	return BaseController.extend("authenticator.controller.Launchpad", {
		onInit: function () {
			var oModel = new JSONModel(
				{
					userName: "",
					navBack: false
				}
			);

			this.getView().setModel(oModel, "Launchpad");

			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.attachRouteMatched(this.onRouteMatched, this);

			this.boundF5Pressed = this._onF5Pressed.bind(this);

			if (!this._f5ListenerAdded) {
				document.addEventListener('keydown', this.boundF5Pressed);
				this._f5ListenerAdded = true;
			}

			sessionStorage.setItem("oNavBack", false);
		},

		onUpdateNotificationButton: function () {
			var oButton = this.byId("btNotification");

			if (oButton) {
				if (!oButton.hasStyleClass("notifWithRed")) {
					oButton.addStyleClass("notifWithRed");
					oButton.setText("!");
				}
			}
		},

		onOpenUsrNotifApp: function () {
			sessionStorage.setItem("app", "026");
			var oButton = this.byId("btNotification");

			if (oButton) {
				if (oButton.hasStyleClass("notifWithRed")) {
					oButton.removeStyleClass("notifWithRed");
					oButton.setText("");
				}
			}
			this.onRouteMatched();
		},

		onCreatePopupNotification: function (notifText) {
			this.onUpdateNotificationButton();

			var that = this,
				oTile = sap.ui.getCore().byId("App026");

			if (oTile) {
				var oTileContent = oTile.getTileContent()[0];

				if (oTileContent && oTileContent.getContent() instanceof sap.m.NumericContent) {
					var oNumericContent = oTileContent.getContent(),
						oNewValue = parseInt(oNumericContent.getValue()) + 1;

					oNumericContent.setValue(oNewValue);
				}
			}

			var oCloseButton = new sap.m.Button({
				icon: "sap-icon://sys-cancel",
				press: function () {
					oPopup.close();
				},
				type: sap.m.ButtonType.Transparent
			}).addStyleClass("closeButtonStyle");

			var oLink = new sap.m.Link({
				text: this.getView().getModel("i18n").getResourceBundle().getText("readMore"),
				press: function () {
					that.onOpenUsrNotifApp();
				}
			});

			var oVBox = new sap.m.VBox({
				items: [
					new sap.m.Text({
						text: this.getView().getModel("i18n").getResourceBundle().getText("newNotification")
					}),
					oLink
				]
			}).addStyleClass('notificationStyle');

			var oHBox = new sap.m.HBox({
				justifyContent: "SpaceBetween",
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

		onNavBack: function (oEvent) {
			if (sessionStorage.getItem("goToLaunchpad") == "X") {
				sessionStorage.setItem("goToLaunchpad", "");
				if (sessionStorage.getItem("bHistory")) {
					sessionStorage.removeItem("iframeState");
					sessionStorage.removeItem("iframeLink");
					sessionStorage.removeItem("iframeHeader");
					this.onRouteMatched();
				}
				else {
					sessionStorage.removeItem("iframeState");
					sessionStorage.removeItem("iframeLink");
					sessionStorage.removeItem("iframeHeader");
					this.getModel("Launchpad").setProperty("/navBack", false);
					this.onRouteMatched();
				}
			}
			else {
				var iframe = document.getElementById('appIframe'),
					message = {
						action: 'goToMainPage'
					};

				iframe.contentWindow.postMessage(message, '*');
			}
		},

		onAfterRendering: function () {
			var that = this,
				sToken = sessionStorage.getItem("rnm_tk"),
				oNavLogo = document.getElementById("navLogo");

			if (oNavLogo) {
				oNavLogo.addEventListener("click", this.onNavBack.bind(this));
			}

			window.addEventListener("message", function (event) {
				var data = event.data;
				if (data.action === "reloadIframe") {
					that.onOpenApp(AppOpen, AppHeaderOpen);
				}
				else if (data.action === "navTo") {
					//INFORMAÇÃO RECEBIDA
					sessionStorage.setItem("bHistory", data.bHistory);
					sessionStorage.setItem("pathToBack", data.pathToBack);
					sessionStorage.setItem("app", data.appIdToOpen);
					sessionStorage.setItem("sPathOpen", data.pathToOpen);
					sessionStorage.setItem("lastAppOpen", data.appIdToBack);
					sessionStorage.setItem("create", data.create);

					//LIMPAR IFRAME PARA CONSEGUIR CARREGAR A NOVA APP
					sessionStorage.removeItem("iframeState");
					sessionStorage.removeItem("iframeLink");
					sessionStorage.removeItem("iframeHeader");
					that.onRouteMatched();
				}

				if (data.action === "goBack") {
					that.onNavBack();
				}
			});

			if (sessionStorage.getItem("usr_type") === "RT") {
				var fullUrl = window.location.search,
					oParams = new URLSearchParams(fullUrl),
					sPage = oParams.get("page");

				that.onOpenApp("/SAP/BC/UI5_UI5/TQA/MANAGE_BAYS?token=" + sToken + "&page=" + sPage, "Painel de Controlo");
			}
		},

		onOpenNotification: function (oEvent) {
			var oButton = this.byId("btNotification");
			if (oButton) {
				if (oButton.hasStyleClass("notifWithRed")) {
					oButton.removeStyleClass("notifWithRed");
					oButton.setText("");
				}
			}

			if (!this._oPopover) {
				this._oPopover = new sap.m.Popover({
					title: this.getView().getModel("i18n").getResourceBundle().getText("notifications"),
					placement: sap.m.PlacementType.Bottom,
					contentWidth: "300px",
					contentHeight: "400px"
				});

				var oList = new sap.m.List();
				this._oPopover.addContent(oList);
				this.getView().addDependent(this._oPopover);
			}

			var oList = this._oPopover.getContent()[0],
				oNotifModel = this.getNotifModel();

			oNotifModel.read("/xTQAxUSR_NOTIF_DD", {
				success: function (oData) {
					var oTemplate = new sap.m.NotificationListItem({
						title: "{title}",
						description: "{description}",
						datetime: {
							parts: ['sended_at', 'sended_at_hours'],
							formatter: function (date, hours) {
								var ms = hours.ms;
								if (date && ms) {
									var hours = Math.floor(ms / 3600000),
										minutes = Math.floor((ms - (hours * 3600000)) / 60000),
										seconds = Math.floor((ms - (hours * 3600000) - (minutes * 60000)) / 1000);

									hours = ('0' + hours).slice(-2);
									minutes = ('0' + minutes).slice(-2);
									seconds = ('0' + seconds).slice(-2);

									var formattedDate = sap.ui.core.format.DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" }).format(date);
									return formattedDate + " " + hours + ":" + minutes + ":" + seconds;
								}
								return "";
							}
						},
						showCloseButton: false
					});

					oList.bindItems({
						path: "/xTQAxUSR_NOTIF_DD",
						template: oTemplate
					});

					oList.setModel(oNotifModel);
				},
				error: function () {

				}
			});

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

					this.getModel("Launchpad").setProperty("/navBack", false);
					window.location.reload(true);
				}
			}

		},

		onRouteMatched: function (oEvent) {
			if (!oEvent || oEvent.getParameter("name") === 'Launchpad') {
				var oTheme = sessionStorage.getItem("selectedTheme");
				sap.ui.getCore().applyTheme(oTheme);

				// this.onInitWebSocket();

				var styleElement = document.createElement("style");
				styleElement.type = "text/css";
				if (oTheme == "sap_fiori_3_dark" || oTheme == "sap_horizon_dark") {
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
					var AppLink = sessionStorage.getItem("iframeLink"),
						AppHeader = sessionStorage.getItem("iframeHeader");

					sessionStorage.removeItem("iframeState");
					sessionStorage.removeItem("iframeLink");
					sessionStorage.removeItem("iframeHeader");

					this.onOpenApp(AppLink, AppHeader);
				}
				var that = this,
					rnm_tk = sessionStorage.getItem('rnm_tk');

				if (rnm_tk == null || rnm_tk == 'undefined') {
					this.getRouter().navTo("RouteMain");
				} else {
					var userName = sessionStorage.getItem("userName"),
						words = userName.split(' '),
						firstChars = '';

					for (var i = 0; i < words.length; i++) {
						firstChars += words[i].charAt(0);
					}

					firstChars = firstChars.toUpperCase();
					this.getModel("Launchpad").setProperty("/userName", firstChars);

					var userLanguage = sessionStorage.getItem("oLangu");
					if (!userLanguage) {
						userLanguage = "PT";
					}

					var serviceUrlWithLanguage = this.getModel().sServiceUrl + (this.getModel().sServiceUrl.includes("?") ? "&" : "?") + "sap-language=" + userLanguage;
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
								that.getModel("global").setProperty("/busy", false);
								that.getModel("global").setProperty("/userName", oData.results[0].UserName);
								that.getModel("global").setProperty("/partner", oData.results[0].BuSort1);

								if (sessionStorage.getItem("iframeState") != "opened") {
									that.onLoadLaunchpad(oData.results);
								}
							}
							catch {
								that.getModel("global").setProperty("/busy", true);
								sessionStorage.removeItem("iframeState");
								sessionStorage.removeItem("iframeLink");
								sessionStorage.removeItem("iframeHeader");

								sessionStorage.setItem("rnm_tk", 'undefined');
								that.getModel("Launchpad").setProperty("/navBack", false);
								that.onRouteMatched();
							}
						},
						error: function (oError) {
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
			}
		},

		onLoadLaunchpad: function (AppsToAdd) {
			var oDynamicApps = this.byId("DynamicApps");
			oDynamicApps.destroyContent();

			var oDynamicPage = new sap.ui.layout.VerticalLayout({
				width: "100%",
				id: "MainContent"
			});

			var createdGroups = [],
				that = this;

			AppsToAdd.forEach(element => {
				delete element.__metadata
			});

			var verticalLayout = new sap.ui.layout.VerticalLayout({
				width: "100%",
				id: "vlTemp"
			});

			AppsToAdd.forEach(element => {
				if (createdGroups.indexOf(element.GrpId) === -1) {
					var title = new sap.m.Title({
						level: "H4",
						titleStyle: "H4",
						text: element.GrpTitle
					});

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
					id: "App" + element.AppId,
					header: element.AppHeader,
					subheader: element.AppSubheader,
					press: function () {
						if (!element.AppLink)
							that.onOpenDocument(sessionStorage.getItem("oLangu"));
						else
							that.onOpenApp(element.AppLink, element.AppHeader);

						that.getModel("global").setProperty("/busy", true);
					}
				}).addStyleClass("launchpadTile");

				var tileContent1 = new sap.m.TileContent({});

				var imageContent;
				if (element.AppCount != 0) {
					this.byId("bgNotification").setValue(element.AppCount);
					imageContent = new sap.m.NumericContent({
						value: element.AppCount,
						icon: element.AppIcon
					}).addStyleClass("launchpadIcon");
				} else {
					imageContent = new sap.m.ImageContent({
						src: element.AppIcon,
						description: "Adicionar Descrição"
					}).addStyleClass("launchpadIcon");
				}

				tileContent1.setContent(imageContent);
				genericTile1.addTileContent(tileContent1);

				var vBox = sap.ui.getCore().byId("vbContent" + element.GrpId);
				vBox.addItem(genericTile1);

			})

			oDynamicPage.addContent(verticalLayout);
			oDynamicPage.setProperty("visible", true);
			oDynamicApps.setContent(oDynamicPage);

			that.getModel("global").setProperty("/busy", false);

			if (sessionStorage.getItem("app")) {
				var oTile = sap.ui.getCore().byId("App" + sessionStorage.getItem("app"));

				oTile.firePress();

				that.getModel("global").setProperty("/busy", true);
			} else
				if (sessionStorage.getItem("lastAppOpen") || sessionStorage.getItem("bHistory")) {
					var oTile = sap.ui.getCore().byId("App" + sessionStorage.getItem("lastAppOpen"));
					sessionStorage.removeItem("lastAppOpen");
					sessionStorage.removeItem("bHistory");

					if (sessionStorage.getItem("pathToBack")) {
						sessionStorage.setItem("sPathBack", sessionStorage.getItem("pathToBack"))
						sessionStorage.removeItem("pathToBack");
					}
					oTile.firePress();

					that.getModel("global").setProperty("/busy", true);
				}
		},

		onOpenApp: function (AppLink, AppHeader) {
			if (sessionStorage.getItem("app")) {
				sessionStorage.removeItem("app");

				if (sessionStorage.getItem("sPathOpen") && sessionStorage.getItem("create") === "true") {
					AppLink = AppLink + sessionStorage.getItem("sPathOpen");

					sessionStorage.removeItem("sPathOpen");
					sessionStorage.removeItem("create");
				}
			}

			var that = this,
				oDynamicPage = this.byId("DynamicApps");

			AppOpen = AppLink;
			AppHeaderOpen = AppHeader;

			if (AppLink && AppHeader) {

				this.__iframeOpened = true;
				this.getModel("Launchpad").setProperty("/navBack", true);

				sessionStorage.setItem("iframeState", "opened");
				sessionStorage.setItem("iframeLink", AppLink);
				sessionStorage.setItem("iframeHeader", AppHeader);


				setTimeout(function () {
					that.getModel("global").setProperty("/busy", true);
					oDynamicPage.destroyContent();
					oDynamicPage.setProperty("visible", true);

					var oPage = new sap.m.Page({
						id: "pgContent",
						title: AppHeader,
						showNavButton: false,
						navButtonPress: function () {
							that.onRouteMatched();
						}
					});

					oPage.addContent(new sap.ui.core.HTML({
						content: "<iframe id='appIframe' src='" + AppLink + "' width='100%' height='99%' frameBorder='0'></iframe>"
					}));

					oDynamicPage.setContent(oPage);
				}, 100);

				setTimeout(function () {
					that.getModel("global").setProperty("/busy", false);
				}, 100);
			}
		},

		onSearch: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			this.filterTiles(sValue);
		},

		filterTiles: function (sValue) {
			// Função para remover acentos
			function removeAccents(value) {
				return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
			}

			sValue = removeAccents(sValue.toLowerCase());

			var oVerticalLayout = sap.ui.getCore().byId("vlTemp");
			if (oVerticalLayout) {
				oVerticalLayout.getContent().forEach(function (content, index) {

					if (content instanceof sap.f.GridContainer) {
						let visibleTilesCount = 0;

						content.getItems().forEach(function (tile) {
							var tileHeader = tile.getHeader();
							if (tileHeader) {
								tileHeader = removeAccents(tileHeader.toLowerCase());
								if (tileHeader.indexOf(sValue) === -1) {
									tile.setVisible(false);
								} else {
									tile.setVisible(true);
									visibleTilesCount++;
								}
							}
						});

						if (visibleTilesCount === 0) {
							content.setVisible(false);
							if (index > 0 && oVerticalLayout.getContent()[index - 1] instanceof sap.m.Title) {
								oVerticalLayout.getContent()[index - 1].setVisible(false);
							}
						} else {
							content.setVisible(true);
							if (index > 0 && oVerticalLayout.getContent()[index - 1] instanceof sap.m.Title) {
								oVerticalLayout.getContent()[index - 1].setVisible(true);
							}
						}
					}
				});
			}
		},

		openSettingsDialog: function () {
			var that = this,
				oMLanguages = new sap.ui.model.json.JSONModel("model/local.json"),
				serviceUrlWithLanguage = this.getModel().sServiceUrl,
				rnm_tk = sessionStorage.getItem("rnm_tk");

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
								alignItems: "Center",
							})
						]
					})
				],
				buttons: [
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

								var oEntry = {
									Usrid: sessionStorage.getItem("usrid"),
									UsrTheme: oTheme.getSelectedKey(),
									UsrLanguage: oLangu,
									UsrShortcuts: ""
								};

								if (oShortcuts.getSelected())
									oEntry.UsrShortcuts = "X";
								else
									oEntry.UsrShortcuts = "";

								oModel.update("/AUTHENTICATOR('" + oEntry.Usrid + "')", oEntry, {
									success: function (oData) {
										that.getModel().refresh(true);
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

							that.onRouteMatched();
							oDialog.close();
						}
					}),
					new sap.m.Button({
						text: this.getView().getModel("i18n").getResourceBundle().getText("cancel"),
						press: function () {
							oDialog.close();
						}
					}),
				],
				afterClose: function () {
					oDialog.destroy();
				}
			});
			oSelect.setSelectedKey(sessionStorage.getItem("oLangu"));
			oTheme.setSelectedKey(sessionStorage.getItem("selectedTheme"));

			var check = false;

			if (sessionStorage.getItem("shortcuts") == 'true') {
				check = true;
			}
			oShortcuts.setSelected(check);

			this.getView().addDependent(oDialog);
			oDialog.open();
		},

		openHelpDialog: function () {
			if (!this._oDialog) {
				this._oDialog = new sap.m.Dialog({
					title: "{i18n>helpDialogTitle}",
					content: new sap.m.Text({ text: "{i18n>greetingText}" }),
					beginButton: new sap.m.Button({
						text: "OK",
						press: function () {
							this._oDialog.close();
						}.bind(this)
					})
				});

				this.getView().addDependent(this._oDialog);

				this._oDialog.setModel(this.getView().getModel("i18n"), "i18n");
			}
			this._oDialog.open();
		},

		onPressLogoutPopover: function (oEvent) {
			var that = this,
				oName = this.getModel("global").getProperty("/userName");

			var oPopover = new sap.m.Popover({
				showHeader: false,
				placement: "Bottom",
			}).addStyleClass("popoverLogout");

			var oFlexBox = new sap.m.FlexBox({
				height: "auto",
				alignItems: "Start",
				justifyContent: "End",
				direction: "Column"
			});

			var oHeader = new sap.m.FlexBox({
				alignItems: "Center",
				width: "100%",
				justifyContent: "Start",
				items: [
					new sap.m.Text({
						text: oName
					}).addStyleClass("avatarTextName")
				]
			}).addStyleClass("mt-5 mb-5 AvatarHeader")

			oFlexBox.addItem(oHeader);

			var oBTSettings = new sap.m.Button({
				text: this.getView().getModel("i18n").getResourceBundle().getText("Settings"),
				type: "Unstyled",
				icon: "sap-icon://action-settings",
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
						+ sessionStorage.getItem("partner"));
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

								that.getModel("Launchpad").setProperty("/navBack", false);
								sessionStorage.setItem("rnm_tk", 'undefined');
								sessionStorage.clear();
								that.getRouter().navTo("RouteMain");
							}
						}
					});

				}
			}).addStyleClass("myNavButton");

			oFlexBox.addItem(oBTSignOut);
			oPopover.addContent(oFlexBox);

			var oView = this.getView(),
				oButton = oEvent.getSource();

			oView.addDependent(oPopover);
			oPopover.openBy(oButton);

		},

		onOpenDocument: function (UsrLanguage) {
			var oModel = this.getView().getModel(),
				that = this,
				DocType;

			switch (UsrLanguage) {
				case "EN":
					DocType = "001";
					break;
				case "PT":
					DocType = "002";
					break;

				case "ES":
					DocType = "003";
					break;
			}

			oModel.read("/DOCUMENTS", {
				filters: [new sap.ui.model.Filter("DocType", "EQ", DocType)],
				success: function (oData) {
					if (oData.results.length > 0) {
						that.onOpenPDF(oData.results[0].Document)
					}
				}.bind(this),
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
		},

		onOpenPDF: function (oDocument) {
			this._pdfViewer = new sap.m.PDFViewer();

			if (oDocument != '') {
				oDocument = "data:application/pdf;base64," + oDocument;

				if (oDocument.indexOf(',') != -1)
					var decodedPdfContent = oDocument.substring(oDocument.indexOf(',') + 1, oDocument.length);

				var decodedPdfContent = atob(decodedPdfContent),
					byteArray = new Uint8Array(decodedPdfContent.length)

				for (var i = 0; i < decodedPdfContent.length; i++) {
					byteArray[i] = decodedPdfContent.charCodeAt(i);
				}

				var blob = new Blob([byteArray.buffer], { type: "application/pdf" }),
					_pdfurl = URL.createObjectURL(blob);

				this._PDFViewer = new sap.m.PDFViewer({
					width: "auto",
					showDownloadButton: false,
					source: _pdfurl
				});

				jQuery.sap.addUrlWhitelist("blob");

				this.getModel("global").setProperty("/busy", false);
				this._PDFViewer.open();
			}
		},
	});
});
