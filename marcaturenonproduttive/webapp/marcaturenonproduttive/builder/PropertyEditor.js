sap.ui.define([
    "sap/ui/model/resource/ResourceModel",
    "sap/dm/dme/podfoundation/control/PropertyEditor"
], function (ResourceModel, PropertyEditor) {
    "use strict";
    
    var oFormContainer;

    return PropertyEditor.extend( "kpmg.custom.plugin.marcaturenonproduttive.marcaturenonproduttive.builder.PropertyEditor" ,{

		constructor: function(sId, mSettings){
			PropertyEditor.apply(this, arguments);
			
			this.setI18nKeyPrefix("customComponentListConfig.");
			this.setResourceBundleName("kpmg.custom.plugin.marcaturenonproduttive.marcaturenonproduttive.i18n.builder");
			this.setPluginResourceBundleName("kpmg.custom.plugin.marcaturenonproduttive.marcaturenonproduttive.i18n.i18n");
		},
		
		addPropertyEditorContent: function(oPropertyFormContainer){
			var oData = this.getPropertyData();
			
			this.addInputField(oPropertyFormContainer, "BaseProxyURL", oData);
			this.addInputField(oPropertyFormContainer, "Plant", oData);

            oFormContainer = oPropertyFormContainer;
		},
		
		getDefaultPropertyData: function(){
			return {
				"BaseProxyURL": "https://proxy_server_gd_dm.cfapps.eu20-001.hana.ondemand.com",
				"Plant": "GD03"
			};
		}

	});
});