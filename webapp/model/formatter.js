sap.ui.define([
   "sap/ui/core/format/DateFormat"
], function(DateFormat){
	"use strict";
	
	/**
     * @class
     * @author João Mota @ 
     * @since  May 2023
     * @name   initial.sapui5.formatter
     */
	var Formatter = {
		
		/**
		 * Date formatter
		 * @param {Date} oValue - The date value to be formatted
		 * @public
		 */
		dateFormatter: function(oValue){
			var sValue = null;
			
			if(oValue != ""){
				sValue = DateFormat.getDateInstance({format: "yMd"}, sap.ui.getCore().getConfiguration().getLocale()).format(oValue);
			}
			
			return sValue;
		},
		
	};
	
	return Formatter;
});