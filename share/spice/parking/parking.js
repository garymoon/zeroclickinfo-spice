(function (env) {
    "use strict";
    
    var userLanguage = navigator.languages || // New (experimental)
        navigator.systemLanguage || // IE
        navigator.language;    // Old
    
    
    var canUseIntl = (  
        window.Intl && 
        window.Intl.NumberFormat && // Check if Intl.NumberFormat exists
        // and test for issues like https://code.google.com/p/chromium/issues/detail?id=370849
        Intl.NumberFormat('en-us',{ style: 'currency', currency: 'USD' }).format(1) !==
        Intl.NumberFormat('en-us',{ style: 'currency', currency: 'CAD' }).format(1));    
    
    // item.price is an unformatted decimal number
    // item.currencyFormatted is an ISO 4217 currency code
    // attempt to use Intl.NumberFormat to generate a localized price 
    // otherwise make pritty prices for USD and CAD or fallback on the ISO 4217 currency code
    function priceFormatter(item) { 
        if (canUseIntl) {
            return  new Intl.NumberFormat(
                userLanguage, {   
                    style: 'currency',
                    currency: item.currencyFormatted,
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2 })
                .format(item.price);
        } else {
            var prefix = item.currencyFormatted.toUpperCase();
            
            if(prefix === 'USD') {
                prefix = '$';
            }
            if(prefix === 'CAD'){
                prefix = 'CA$';
            }
            
            return prefix + parseFloat(item.price).toFixed(2);
        }      
    }
    
    env.ddg_spice_parking = function(api_result){
        
        // Check that results were returned successfully
        if (!api_result || !api_result.success || api_result.resultsCount === 0) {
            return Spice.failed('parking');        
        }
        
        function normalize(item){
            // skip unless there's at least one image
            if (!item.images[0]) {
                return null;
            }
            
            // Get a localized price
            item.price = priceFormatter(item);
            
            var normalizedItem = {
                /* item */
              name: item.displayName,
              distance: item.distanceString,
              image: item.images[0].imagePathMedium,
                
                /* details */
              img: item.images[0].imagePath,
                
              address: item.address1,
              lat: item.latitude,
              lon: item.longitude
            };
            
            return normalizedItem;            
        }
        
        // Render the response
        Spice.add({
            id: "parking",
            name: "Parking",
            model: 'Place',
            view: 'Places',
            data: api_result.data.locations,
            meta: {
                primaryText: "Parking Near: " + api_result.data.search.displayText,                
                sourceName: "ParkingPanda.com",
                sourceUrl: 'https://www.parkingpanda.com/Search/?ref=duckduck&location=' + api_result.data.search.query
            },
            normalize: normalize,
            templates: {                
                group: 'places',
                item: Spice.parking.item
            }
        });
    };
}(this));