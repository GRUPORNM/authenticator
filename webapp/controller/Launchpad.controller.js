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
					userName: "",
					navBack: false
				}
			);
			this.getView().setModel(oModel, "Launchpad");

			var oData = {
				messages: [
					{ sender: "John Doe", text: "Hi there!", timestamp: "10:00 AM" },
					{ sender: "Jane Doe", text: "Hello!", timestamp: "10:01 AM" }
				]
			};

			// Definindo o modelo local com dados de exemplo
			var oModel = new sap.ui.model.json.JSONModel(oData);
			this.getView().setModel(oModel, "Chat");

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

			sessionStorage.setItem("oNavBack", false);
		},

		onUpdateNotificationButton: function () {
			var oButton = this.byId("btNotification");

			if (oButton) {
				// var $button = oButton.$();  // Obtenha o jQuery DOM reference para o elemento
				// Verifique se o elemento tem a classe "notifWithRed"
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
			//adicionar animação ao button na navbar
			this.onUpdateNotificationButton();
			var that = this;

			var oTile = sap.ui.getCore().byId("App026");

			if (oTile) {
				// Obtenha o TileContent. Assumindo que há apenas um TileContent.
				var oTileContent = oTile.getTileContent()[0];
				// Verifique se o TileContent existe e é uma instância de NumericContent.
				if (oTileContent && oTileContent.getContent() instanceof sap.m.NumericContent) {
					// Obtenha o NumericContent.
					var oNumericContent = oTileContent.getContent();

					// Atualize o valor.
					var oNewValue = parseInt(oNumericContent.getValue()) + 1;
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
					// TEXTO DA NOTIFICAÇÃO 
					// new sap.m.Text({
					// 	text: notifText
					// }),
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
					// this.byId("btNavBack").setProperty("visible", false);
					this.getModel("Launchpad").setProperty("/navBack", false);
					this.onRouteMatched();
				}
			}
			else
			{
				var iframe = document.getElementById('appIframe'); 
				var message = {
					action: 'goToMainPage'
				};
			
				iframe.contentWindow.postMessage(message, '*');
			}
			// if (sessionStorage.getItem("bHistory")) {
			// 	sessionStorage.removeItem("iframeState");
			// 	sessionStorage.removeItem("iframeLink");
			// 	sessionStorage.removeItem("iframeHeader");
			// 	this.onRouteMatched();
			// }
			// else {
			// 	sessionStorage.removeItem("iframeState");
			// 	sessionStorage.removeItem("iframeLink");
			// 	sessionStorage.removeItem("iframeHeader");
			// 	// this.byId("btNavBack").setProperty("visible", false);
			// 	this.getModel("Launchpad").setProperty("/navBack", false);
			// 	this.onRouteMatched();
			// }
		},

		onAfterRendering: function () {
			var that = this;
			var oNavLogo = document.getElementById("navLogo");
			if (oNavLogo) {
				oNavLogo.addEventListener("click", this.onNavBack.bind(this));
			}
			window.addEventListener("message", function (event) {
				var data = event.data;
				if (data.action === "reloadIframe") {
					// Aqui, recarregue o iframe

					that.onOpenApp(AppOpen, AppHeaderOpen);
				}
				else (data.action === "navTo")
				{

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
			});
		},

		onOpenNotificationPopover: function (oEvent) {
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

			// Carrega os dados do OData sempre que o popover for aberto
			var oList = this._oPopover.getContent()[0];  // Assumindo que o primeiro conteúdo do popover é a lista
			var oNotifModel = this.getNotifModel();

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
									// Convertendo milissegundos para horas, minutos e segundos
									var hours = Math.floor(ms / 3600000);  // 1 hour = 3600000 ms
									var minutes = Math.floor((ms - (hours * 3600000)) / 60000); // 1 minute = 60000 ms
									var seconds = Math.floor((ms - (hours * 3600000) - (minutes * 60000)) / 1000);

									// Formate em 2 dígitos
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
					// Tratar erros aqui, se necessário
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
					// this.byId("btNavBack").setProperty("visible", false);
					this.getModel("Launchpad").setProperty("/navBack", false);
					window.location.reload(true);
				}
			}

		},

		onRouteMatched: function (oEvent) {

			if (!oEvent || oEvent.getParameter("name") === 'Launchpad') {
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
				// var rnm_tk = sessionStorage.getItem('rnm_tk');
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
								// that.byId("btNavBack").setProperty("visible", false);
								that.getModel("Launchpad").setProperty("/navBack", false);
								sessionStorage.setItem("rnm_tk", 'undefined');
								that.onRouteMatched();
							}
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

				// var imageContent = new sap.m.ImageContent({
				// 	src: element.AppIcon,
				// 	description: "Adicionar Descrição"
				// });

				//30102023
				if (element.AppCount != 0)
					var imageContent = new sap.m.NumericContent({
						value: element.AppCount,
						icon: element.AppIcon
					});
				else {
					var imageContent = new sap.m.ImageContent({
						src: element.AppIcon,
						description: "Adicionar Descrição"
					});
				}


				tileContent1.setContent(imageContent);
				genericTile1.addTileContent(tileContent1);

				var vBox = sap.ui.getCore().byId("vbContent" + element.GrpId);
				vBox.addItem(genericTile1);
			})

			// this.createChatButton();

			// var oText = new sap.m.Text({
			// 	text: "1231221"
			// });

			// oDynamicPage.addItem(oText);
			// this._oChatButton = new sap.m.Button({
			// 	id: "chatButton",
			// 	icon: "sap-icon://discussion",
			// 	press: this.createChatPopover.bind(this),
			// 	tooltip: "{i18n>chatButtonTooltip}",
			// 	type: sap.m.ButtonType.Unstyled
			// }).addStyleClass("customChatButton");

			verticalLayout.addContent(this._oChatButton);
			oDynamicPage.addContent(verticalLayout);
			oDynamicPage.setProperty("visible", true);
			oDynamicApps.setContent(oDynamicPage);

			that.getModel("global").setProperty("/busy", false);

			// setTimeout(function () {
			// 	if (this._oChatButton && this._oChatButton.getDomRef()) {
			// 		// Certifique-se de que o botão esteja renderizado antes de habilitar o arraste
			// 		this._enableChatButtonHorizontalDrag();
			// 	} else {
			// 		// Caso o botão não esteja no DOM após os 10 segundos, talvez você queira tentar novamente ou lidar com o erro
			// 		console.error("Chat button was not rendered in time to enable dragging.");
			// 	}
			// }.bind(this), 1500);

			if (sessionStorage.getItem("app")) {

				var oTile = sap.ui.getCore().byId("App" + sessionStorage.getItem("app"));
				oTile.firePress();
				// NewEntry
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
					// NewEntry
					that.getModel("global").setProperty("/busy", true);
				}
		},

		_enableChatButtonHorizontalDrag: function () {

			var oButton = sap.ui.getCore().byId("chatButton");
			var oDomRef = oButton.getDomRef();

			var startX, startLeft;

			var doDrag = function (e) {
				var newX = startLeft + (e.clientX - startX);
				newX = Math.max(0, newX) + 25; // Evitar que o botão vá além da borda esquerda
				newX = Math.min(window.innerWidth - oDomRef.offsetWidth, newX) - 20; // Evitar que o botão vá além da borda direita
				oDomRef.style.left = newX + 'px';
			};

			var stopDrag = function () {
				document.removeEventListener('mousemove', doDrag);
				document.removeEventListener('mouseup', stopDrag);
			};

			oDomRef.addEventListener('mousedown', function (e) {
				startX = e.clientX;
				startLeft = oDomRef.offsetLeft;
				document.addEventListener('mousemove', doDrag);
				document.addEventListener('mouseup', stopDrag);
			});
		},



		createChatPopover: function () {
			if (!this._oChatPopover) {
				// Template para as mensagens
				var oMessageTemplate = new sap.m.FeedListItem({
					sender: "{Chat>sender}",
					text: "{Chat>text}",
					timestamp: "{Chat>timestamp}"
				}).addStyleClass("chatMessageItem");

				// ScrollContainer para as mensagens
				var oScrollContainer = new sap.m.ScrollContainer({
					vertical: true,
					height: "350px", // Ajuste de acordo com a altura desejada
					content: [
						new sap.m.List({
							items: {
								path: "Chat>/messages",
								template: oMessageTemplate
							}
						}).addStyleClass("customMessageList")
					]
				});

				// Campo de entrada para novas mensagens
				this._oMessageInput = new sap.m.Input({
					id: "inChat",
					width: "160%",
					placeholder: "{i18n>...}",
					submit: this.sendMessage.bind(this)
				}).addStyleClass("sapUiTinyMarginBegin");

				var oSendButton = new sap.m.Button({
					icon: "sap-icon://feeder-arrow",
					type: sap.m.ButtonType.Emphasized,
					press: this.sendMessage.bind(this)
				}); // Isso adiciona uma pequena margem no começo, o que pode ser necessário dependendo do layout.

				var oInputHBox = new sap.m.HBox({
					alignItems: sap.m.FlexAlignItems.Center,
					justifyContent: sap.m.FlexJustifyContent.SpaceBetween,
					items: [this._oMessageInput, oSendButton],
					width: "100%" // Certifique-se de que a HBox ocupe 100% da largura disponível
				}).addStyleClass("sapUiTinyMarginBottom");


				// VBox para o layout principal do popover
				var oChatVBox = new sap.m.VBox({
					items: [oScrollContainer, oInputHBox]
				});

				// Criação do Popover
				this._oChatPopover = new sap.m.Popover({
					showHeader: false,
					placement: sap.m.PlacementType.VerticalPreferredBottom,
					content: [oChatVBox],
					contentWidth: "350px",
					afterOpen: function () {
						oController._scrollToBottom();
					}
				}).addStyleClass("customChatPopover");

				this._oChatPopover.attachAfterClose(function () {
					this._oChatPopover.close(); // Esconde o popover em vez de destruí-lo
				}.bind(this));

				// Adiciona o Popover como um dependente da view
				this.getView().addDependent(this._oChatPopover);
			} else {
				// Se o popover já existe, apenas o reabra e realinhe a rolagem
				this._oChatPopover.openBy(this._oChatButton);
				this._scrollToBottom();
			}

			if (this._oChatPopover.isOpen()) {
				this._scrollToBottom();
			}

			// Abre o Popover
			this._oChatPopover.openBy(this._oChatButton);

		},

		sendMessage: function (oEvent) {
			var sValue = oEvent.getParameter("value") || this._oMessageInput.getValue();
			var oChatModel = this.getView().getModel("Chat");

			if (sValue.trim()) {
				// Adiciona a nova mensagem ao modelo
				var aMessages = oChatModel.getProperty("/messages");
				aMessages.push({
					sender: "You",
					text: sValue.trim(),
					timestamp: new Date().toLocaleTimeString()
				});
				oChatModel.setProperty("/messages", aMessages);

				// Limpa o campo de entrada
				this._oMessageInput.setValue("");

				// Atualizar o modelo para refletir as mudanças
				oChatModel.refresh(true);

				// Chama o método de rolagem
				this._scrollToBottom();
			}
		},

		_scrollToBottom: function () {
			// oMessageList é o primeiro item dentro do ScrollContainer que é o primeiro item da VBox
			var oScrollContainer = this._oChatPopover.getContent()[0].getItems()[0];
			var oDomRef = oScrollContainer.getDomRef();
			if (oDomRef) {
				setTimeout(function () {
					oDomRef.scrollTop = oDomRef.scrollHeight;
				}, 0); // O atraso de 0ms garante que a rolagem aconteça após as atualizações do DOM
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


				// if (sessionStorage.getItem("app") == 'App013') {
				// 	sessionStorage.removeItem("lastAppOpen");
				// 	
				// 	if (!sessionStorage.getItem("sPathOpen"))
				// 		AppLink = AppLink + "#/NewEntry";
				// 	// else {
				// 	// 	// AppLink = AppLink + "#/xTQAxDRIVERS_DD(partner="+ sessionStorage.getItem('partner') + ",usrid=" + sessionStorage.getItem('userid') + "')";
				// 	// 	AppLink = AppLink + "#/xTQAxDRIVERS_DD" + sessionStorage.getItem("sPathOpen");
				// 	// 	sessionStorage.removeItem("showDetail");
				// 	// 	sessionStorage.removeItem("driverDetail");
				// 	// 	// sessionStorage.removeItem("partner");
				// 	// 	sessionStorage.removeItem("sPathOpen");
				// 	// }
				// }
				// else if (sessionStorage.getItem("app") == 'App012') {
				// 	AppLink = AppLink + "#/xTQAxEQUIPMENTS_DD(request_id=guid'" + sessionStorage.getItem("requestid") + "',partner='" + sessionStorage.getItem("partner") + "')";
				// 	sessionStorage.removeItem("EquipmentDetail");
				// 	sessionStorage.removeItem("showDetail");
				// 	sessionStorage.removeItem("partner");
				// 	sessionStorage.removeItem("requestid");
				// }
				// this.getModel("global").setProperty("/busy", false);
				// sessionStorage.removeItem("create");
				// // sessionStorage.removeItem("app");
			}

			// if (sessionStorage.getItem("app") == 'App019') {
			// 	sessionStorage.removeItem("app");
			// }

			var that = this;
			var oDynamicPage = this.byId("DynamicApps");

			AppOpen = AppLink;
			AppHeaderOpen = AppHeader;


			if (AppLink && AppHeader) {

				this.__iframeOpened = true;
				// this.byId("btNavBack").setProperty("visible", true);
				this.getModel("Launchpad").setProperty("/navBack", true);

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
						content: "<iframe id='appIframe' src='" + AppLink + "' width='100%' height='99%' frameBorder='0'></iframe>"
					}));

					oDynamicPage.setContent(oPage);
				}, 500);



				// Definir o atraso de 05 segundos antes de definir o conteúdo do DynamicPage
				setTimeout(function () {
					that.getModel("global").setProperty("/busy", false);
					// sap.ui.core.BusyIndicator.hide();
				}, 500);
			}
			// oDynamicPage.setContent(oPage);
			// this.getModel("global").setProperty("/busy", false);

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

			// Convertendo o valor da pesquisa para minúsculas e sem acentos
			sValue = removeAccents(sValue.toLowerCase());

			// Primeiro, vamos obter o VerticalLayout onde os GridContainers estão
			var oVerticalLayout = sap.ui.getCore().byId("vlTemp");
			if (oVerticalLayout) {
				oVerticalLayout.getContent().forEach(function (content, index) {
					// Para cada content dentro do VerticalLayout, verificamos se é um GridContainer
					if (content instanceof sap.f.GridContainer) {
						let visibleTilesCount = 0;

						content.getItems().forEach(function (tile) {
							// Aqui, para cada tile dentro do GridContainer, verificamos o AppHeader
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

						// Se não houver tiles visíveis, ocultamos o GridContainer e o título do grupo associado
						if (visibleTilesCount === 0) {
							content.setVisible(false);
							// Assumindo que o título do grupo está sempre acima do GridContainer no VerticalLayout
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

		openHelpDialog: function () {
			if (!this._oDialog) {
				this._oDialog = new sap.m.Dialog({
					title: "{i18n>helpDialogTitle}", // Referencia o título do diálogo via i18n
					content: new sap.m.Text({ text: "{i18n>greetingText}" }), // Referencia o texto via i18n
					beginButton: new sap.m.Button({
						text: "OK",
						press: function () {
							this._oDialog.close();
						}.bind(this)
					})
				});

				// Para garantir que os modelos de dados, incluindo o i18n, estão disponíveis no diálogo
				this.getView().addDependent(this._oDialog);

				// Além disso, conectar o diálogo ao modelo de internacionalização
				this._oDialog.setModel(this.getView().getModel("i18n"), "i18n");
			}

			// Abrir o diálogo
			this._oDialog.open();
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
				icon: "sap-icon://settings",
				press: function (event) {
					that.openSettingsDialog();
				}
			}).addStyleClass("myNavButton")
			// oBTSettings.addStyleClass("sapUiTinyMarginBegin"); // Adicionar classe CSS para espaçamento entre os botões
			oFlexBox.addItem(oBTSettings);

			// var oBTHelp = new sap.m.Button({
			// 	text: this.getView().getModel("i18n").getResourceBundle().getText("Ajuda"),
			// 	type: "Unstyled",
			// 	icon: "sap-icon://sys-help",
			// 	press: function (event) {
			// 		that.openHelpDialog();
			// 	}
			// }).addStyleClass("myNavButton")
			// oFlexBox.addItem(oBTHelp);

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
								// that.byId("btNavBack").setProperty("visible", false);
								that.getModel("Launchpad").setProperty("/navBack", false);
								sessionStorage.setItem("rnm_tk", 'undefined');
								sessionStorage.clear();
								that.getRouter().navTo("RouteMain");
								// that.onRouteMatched();
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
