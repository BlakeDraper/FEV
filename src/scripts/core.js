var stnServicesURL = 'http://stn.wim.usgs.gov/STNServices';
var stnServicesTestURL = 'http://stntest.wim.usgs.gov/STNServices2';
var sensorPageURLRoot = "http://stn.wim.usgs.gov/STNPublicInfo/#/SensorPage?Site=";
var hwmPageURLRoot = "http://stn.wim.usgs.gov/STNPublicInfo/#/HWMPage?Site=";

var fev = fev || {
	data: {
		events: [],
		eventTypes: [],
		states: [],
		counties : [],
		sensorTypes : [],
		sensorStatusTypes : [],
		collectionConditions: [],
		deploymentTypes : [],
		hwmTypes: [],
		hwmQualities : []
	},
	urls: {
		jsonSensorsURLRoot : stnServicesURL + '/Instruments.json',
		xmlSensorsURLRoot: stnServicesURL + '/Instruments.xml',
		csvSensorsURLRoot : stnServicesURL + '/Instruments.csv',

		jsonHWMsURLRoot : stnServicesURL + '/HWMs/FilteredHWMs.json',
		xmlHWMsURLRoot : stnServicesURL + '/HWMs/FilteredHWMs.xml',
		csvHWMsURLRoot : stnServicesURL + '/HWMs/FilteredHWMs.csv',
		hwmFilteredGeoJSONViewURL: stnServicesURL + '/HWMs/FilteredHWMs.geojson',
		hwmGeoJSONViewURL: stnServicesURL + '/hwms.geojson',

		xmlPeaksURLRoot : stnServicesURL + '/PeakSummaries/FilteredPeaks.xml',
		jsonPeaksURLRoot : stnServicesURL + '/PeakSummaries/FilteredPeaks.json',
		csvPeaksURLRoot : stnServicesURL + '/PeakSummaries/FilteredPeaks.csv',
		peaksFilteredGeoJSONViewURL: stnServicesURL + '/PeakSummaries/FilteredPeaks.geojson',

		baroGeoJSONViewURL: stnServicesURL + '/SensorViews.geojson?ViewType=baro_view&',
		metGeoJSONViewURL: stnServicesURL + '/SensorViews.geojson?ViewType=met_view&',
		rdgGeoJSONViewURL: stnServicesURL + '/SensorViews.geojson?ViewType=rdg_view&',
		stormTideGeoJSONViewURL: stnServicesURL + '/SensorViews.geojson?ViewType=stormtide_view&',
		waveHeightGeoJSONViewURL: stnServicesURL + '/SensorViews.geojson?ViewType=waveheight_view&'
	},
	queryStrings: {
	},
	vars : {
		currentEventStartDate_str : "",
		currentEventEndDate_str : "",
		currentEventActive : false
	},
	layerList: 	[
		{
			"ID": "baro",
			"Name": "Barometric Pressure Sensor",
			"Type":"sensor"
		},
		{
			"ID": "stormTide",
			"Name": "Storm Tide Sensor",
			"Type":"sensor"
		},
		{
			"ID": "met",
			"Name": "Meteorological Sensor",
			"Type":"sensor"
		},
		{
			"ID": "waveHeight",
			"Name": "Wave Height Sensor",
			"Type":"sensor"
		},
		{
			"ID": "rdg",
			"Name": "Rapid Deployment Gage",
			"Type":"sensor"
		},
		{
			"ID": "hwm",
			"Name": "High Water Mark",
			"Type":"observed"
		},
		{
			"ID": "peak",
			"Name": "Peak Summary",
			"Type":"observed"
		}
	]
};

var map;
var markerCoords = [];
var oms;

var baroMarkerIcon = L.divIcon({className: 'baroMarker', iconAnchor: [8, 24], popupAnchor: [0, 0]});
var metMarkerIcon = L.divIcon({className: 'metMarker', iconAnchor: [8, 24], popupAnchor: [0, 0]});
var rdgMarkerIcon = L.divIcon({className: 'rdgMarker', iconAnchor: [8, 24], popupAnchor: [0, 0]});
var stormTideMarkerIcon = L.divIcon({className: 'stormTideMarker', iconAnchor: [8, 24], popupAnchor: [0, 0]});
var waveHeightMarkerIcon = L.divIcon({className: 'waveHeightMarker', iconAnchor: [8, 24], popupAnchor: [0, 0]});
var hwmMarkerIcon = L.divIcon({className: 'hwmMarker', iconAnchor: [8, 24], popupAnchor: [0, 0]});
var peaksMarkerIcon = L.divIcon({className: 'peaksMarker', iconAnchor: [8, 24], popupAnchor: [0, 0]});
var nwisMarkerIcon  = L.divIcon({className: 'nwisMarker', iconAnchor: [8, 24], popupAnchor: [0, 0]});

//sensor subgroups for sensor marker cluster group
var	baro = L.layerGroup();
var stormTide = L.layerGroup();
var	met = L.layerGroup();
var rdg = L.layerGroup();
var	waveHeight = L.layerGroup();
var hwm = L.layerGroup();
var peaks = L.layerGroup();
var USGSrtGages = L.featureGroup();

/////markercluster code, can remove eventually
// Marker Cluster Group for sensors
// var sensorMCG = L.markerClusterGroup({
// 	//options here
// 	disableClusteringAtZoom: 8,
// 	spiderfyOnMaxZoom: false,
// 	zoomToBoundsOnClick: true
// });
// var	baro = L.featureGroup.subGroup(sensorMCG);
// var stormTide = L.featureGroup.subGroup(sensorMCG);
// var	met = L.featureGroup.subGroup(sensorMCG);
// var rdg = L.featureGroup.subGroup(sensorMCG);
// var	waveHeight = L.featureGroup.subGroup(sensorMCG);

// Marker Cluster Group for HWMs
// var hwmMCG = L.markerClusterGroup({
// 	//options here
// 	disableClusteringAtZoom: 8,
// 	spiderfyOnMaxZoom: false,
// 	zoomToBoundsOnClick: true,
// 	//create custom icon for HWM clusters
// 	iconCreateFunction: function (cluster) {
// 		return L.divIcon({ html: '<div style="display: inline-block"><span style="display: inline-block" class="hwmClusterText">' + cluster.getChildCount() + '</span></div>',  className: 'hwmClusterMarker' });
// 	}
// });
// var hwm = L.featureGroup.subGroup(hwmMCG);

///end markercluster code//////////////////////////////////////////////////////////////

//main document ready function
$( document ).ready(function() {
	//for jshint
	'use strict';

	$('#peakDatePicker .input-daterange').datepicker({
		format:  "yyyy-mm-dd",
		endDate: "today",
		startView: 2,
		maxViewMode: 3,
		todayBtn: true,
		clearBtn: true,
		multidate: false,
		autoclose: true,
		todayHighlight: true
	});

	//submit event button
	$('#btnSubmitEvent').click(function(){
		//check if an event has been selected
		if ($('#evtSelect_welcomeModal').val() !== null) {
			//if event selected, hide welcome modal and begin filter process
			$('#welcomeModal').modal('hide');
			var eventValue = $('#evtSelect_welcomeModal').val();
			$('#evtSelect_filterModal').val([eventValue]).trigger("change");
			populateEventDates(eventValue);
			filterMapData();
			
		} else {
			//if no event selected, warn user with alert
			alert("Please choose an event to proceed.")
		}
	});

	//url parameter parsing logic
	if (window.location.hash){
		//user has arrived with an event name after the hash on the URL
		//grab the hash value, remove the '#', leaving the event name parameter
		var eventParam = window.location.hash.substring(1);
		//do a service request to match the event name param to an event id for filtering purposes
		$.getJSON( 'https://stn.wim.usgs.gov/STNServices/events/' + eventParam + '.json', {} )
			.done(function( data ) {
				eventParam = data.event_id.toString();
				//set currentEventActive boolean var based on event_status_id value
				data.event_status_id == 1 ? fev.vars.currentEventActive = true :   fev.vars.currentEventActive = false;
				//set event date string vars, cutting off time portion and storing date only; check for undefined because services do not return the property if it has no value
				fev.vars.currentEventStartDate_str = (data.event_start_date == undefined ? '' : data.event_start_date.substr(0,10));
				fev.vars.currentEventEndDate_str = (data.event_end_date == undefined ? '' : data.event_end_date.substr(0,10));
				console.log("Selected event is " + data.event_name + ". START date is " + fev.vars.currentEventStartDate_str + " and END date is " + fev.vars.currentEventEndDate_str + ". Event is active = " + fev.vars.currentEventActive)

				//call filter function, passing the event parameter string and 'true' for the 'isUrlParam' boolean argument
				filterMapData(eventParam, true);
				setEventIndicators(data.event_name, data.event_id);

			})
			.fail(function() {
				console.log( "Request Failed. Most likely invalid event name." );
			});

	} else {
		//show modal and set options - disallow user from bypassing
		$('#welcomeModal').modal({backdrop: 'static', keyboard: false});
	}
	//var url = document.location.href;
	//var root = location.protocol + '//' + location.host;

	function setEventIndicators (eventName, eventID) {
		$('#eventNameDisplay').html(eventName);
		$('#largeEventNameDisplay').html(eventName);
		//TODO: determine why this is not working, though its same code and input as in the btnSubmitEvent function above
		var eventValue = [eventID.toString()];
		$('#evtSelect_filterModal').val([eventValue]).trigger("change");
	}



	/* create map */
	map = L.map('mapDiv').setView([39.833333, -98.583333], 4);
	var layer = L.esri.basemapLayer('Gray').addTo(map);
	var layerLabels;

	L.Icon.Default.imagePath = './images';


	//attach the listener for data disclaimer button after the popup is opened - needed b/c popup content not in DOM right away
	map.on('popupopen', function() {
		$('.data-disclaim').click(function(e){
			$('#aboutModal').modal('show');
			$('#disclaimerTabPane').tab('show')
		});
	});

	//add sensor markercluster group to the map
	//sensorMCG.addTo(map);
	//add sensor subgroups to the map
	//baro.addTo(map);
	//stormTide.addTo(map);
	//met.addTo(map);
	//rdg.addTo(map);
	//waveHeight.addTo(map);
	//add hwm markercluster group to the map
	//hwmMCG.addTo(map);
	// add hwm subgroup to the map
	//hwm.addTo(map);
	//peaks.addTo(map);
	//add USGS rt gages to the map
	USGSrtGages.addTo(map);

	//define layer 'overlays' (leaflet term)
	var sensorOverlays = {
		"<i class='nwisMarker'></i>&nbsp;Real-time Stream Gage" : USGSrtGages
	};
	var observedOverlays = {};
	$.each(fev.layerList, function( index, layer ) {
		if(layer.Type == 'sensor') sensorOverlays["<i class='" + layer.ID + "Marker'></i>&nbsp;" + layer.Name] = window[layer.ID]
		if(layer.Type != 'sensor') observedOverlays["<i class='" + layer.ID + "Marker'></i>&nbsp;" + layer.Name] = window[layer.ID]
	});

	// set up a toggle for the sensors layers and place within legend div, overriding default behavior
	var sensorsToggle = L.control.layers(null, sensorOverlays, {collapsed: false});
	sensorsToggle.addTo(map);
	sensorsToggle._container.remove();
	document.getElementById('sensorsToggleDiv').appendChild(sensorsToggle.onAdd(map));

	// set up toggle for the observed layers and place within legend div, overriding default behavior
	var observedToggle = L.control.layers(null, observedOverlays, {collapsed: false});
	observedToggle.addTo(map);
	observedToggle._container.remove();
	document.getElementById('observedToggleDiv').appendChild(observedToggle.onAdd(map));

	//overlapping marker spidifier
	oms = new OverlappingMarkerSpiderfier(map, {
		keepSpiderfied: true
	});

	//populate initial unfiltered download URLs
	$('#sensorDownloadButtonCSV').attr('href', fev.urls.csvSensorsURLRoot);
	$('#sensorDownloadButtonJSON').attr('href', fev.urls.jsonSensorsURLRoot); 
	$('#sensorDownloadButtonXML').attr('href', fev.urls.xmlSensorsURLRoot);
	$('#hwmDownloadButtonCSV').attr('href', fev.urls.csvHWMsURLRoot);
	$('#hwmDownloadButtonJSON').attr('href', fev.urls.jsonHWMsURLRoot); 
	$('#hwmDownloadButtonXML').attr('href', fev.urls.xmlHWMsURLRoot);
	$('#peaksDownloadButtonCSV').attr('href', fev.urls.csvPeaksURLRoot);
	$('#peaksDownloadButtonJSON').attr('href', fev.urls.jsonPeaksURLRoot); 
	$('#peaksDownloadButtonXML').attr('href', fev.urls.xmlPeaksURLRoot);

	/* sets up data type radio buttons to hide/show the respective forms*/
	$('.dataTypeRadio').each(function(){
		//for the clicked radio
		$(this).on('click', function() {
			var radioId = $(this).attr('id');
			var formToShow = $('#' + radioId + 'Form');
			formToShow.show();
			$('.hiddenForm').not(formToShow).hide();
		});
	});
	$('.check').on('click', function(){
		$(this).find('span').toggle();
	});


	function showGeosearchModal() {
		$('#geosearchModal').modal('show');
	}
	$('#geosearchNav').click(function(){
		showGeosearchModal();
	});
	function showAboutModal () {
		$('#aboutModal').modal('show');
	}
	$('#aboutNav').click(function(){
		showAboutModal();
	});

	function showFiltersModal () {
		$('#filtersModal').modal('show');
	}
	$('#btnChangeFilters').click(function(){
		showFiltersModal();
	});

	$('#btnSubmitFilters').on('click', function() {
		filterMapData();
		$('#filtersModal').modal('hide');
	});

	/* basemap controller */
	function setBasemap(basemap) {
	    if (layer) {
	      map.removeLayer(layer);
	    }
	    layer = L.esri.basemapLayer(basemap);
	    map.addLayer(layer);
	    if (layerLabels) {
	      map.removeLayer(layerLabels);
	    }

	    if (basemap === 'ShadedRelief' || basemap === 'Oceans' || basemap === 'Gray' || basemap === 'DarkGray' || basemap === 'Imagery' || basemap === 'Terrain') {

	      layerLabels = L.esri.basemapLayer(basemap + 'Labels');
	      map.addLayer(layerLabels);
	    }
	}

	$('.basemapBtn').on('click',function() {
	  	var baseMap = this.id.replace('btn','');

	  	// https://github.com/Esri/esri-leaflet/issues/504 submitted issue that esri-leaflet basemaps dont match esri jsapi

	  	switch (baseMap) {
		    case 'Streets': baseMap = 'Streets'; break;
		    case 'Satellite': baseMap = 'Imagery'; break;
		    //case 'Hybrid': baseMap = 'ImageryLabels'; break;
		    case 'Topo': baseMap = 'Topographic'; break;
		    case 'Terrain': baseMap = 'ShadedRelief'; break;
		    case 'Gray': baseMap = 'Gray'; break;
		    // case 'OSM': baseMap = 'n/a'; break;
		    case 'NatGeo': baseMap = 'NationalGeographic'; break;
		    // case 'NatlMap': baseMap = 'n/a'; break;
		}

		setBasemap(baseMap);

	});
  	/* basemap controller */

	/* geocoder control */


	//import USGS search API
	var searchScript = document.createElement('script');
	searchScript.src = 'http://txpub.usgs.gov/DSS/search_api/1.1/api/search_api.min.js';
	searchScript.onload = function() {
		setSearchAPI();
	};
	document.body.appendChild(searchScript);

	function setSearchAPI() {
		// setup must be done after the search_api is loaded and ready ('load' event triggered)
		search_api.on('load', function() {

			$('#chkExtent').change(function(){
				if($(this).is(':checked')){
					console.log('Checked',map.getBounds().getSouth(),map.getBounds().getNorth(),map.getBounds().getWest(),map.getBounds().getEast());
					var mapBounds = map.getBounds();

					search_api.setOpts({
						'LATmin' : mapBounds.getSouth(),
						'LATmax' : mapBounds.getNorth(),
						'LONmin' : mapBounds.getWest(),
						'LONmax' : mapBounds.getEast()
					});
				}
			});

			search_api.setOpts({
				'textboxPosition': 'user-defined',
				'theme': 'user-defined',
				'DbSearchIncludeUsgsSiteSW': true,
				'DbSearchIncludeUsgsSiteGW': true,
				'DbSearchIncludeUsgsSiteSP': true,
				'DbSearchIncludeUsgsSiteAT': true,
				'DbSearchIncludeUsgsSiteOT': true
			});
			
			// define what to do when a location is found
			search_api.on('location-found', function(lastLocationFound) {

				var zoomlevel = 14;
				if (lastLocationFound.Category === 'U.S. State or Territory') zoomlevel = 9;

				map.setView([lastLocationFound.y, lastLocationFound.x], zoomlevel);

				L.popup()
					.setLatLng([lastLocationFound.y,lastLocationFound.x])
					.setContent(
						'<p>' +
							'<b>' + lastLocationFound.label + '</b> '                + '<br/>' +
							'<br/>' +
							'<b>NAME:            </b> ' + lastLocationFound.name     + '<br/>' +
							'<b>CATEGORY:        </b> ' + lastLocationFound.category + '<br/>' +
							'<b>STATE:           </b> ' + lastLocationFound.state    + '<br/>' +
							'<b>COUNTY:          </b> ' + lastLocationFound.county   + '<br/>' +
							'<br/>' +
							'<b>LATITUDE:        </b> ' + lastLocationFound.y        + '<br/>' +
							'<b>LONGITUDE:       </b> ' + lastLocationFound.x        + '<br/>' +
							'<b>ELEVATION (FEET):</b> ' + lastLocationFound.elevFt   + '<br/>' +
							'<br/>' +
							'<b>PERCENT MATCH:   </b> ' + lastLocationFound.pctMatch + '<br/>' +
						'</p>'
					)
					.openOn(map);

			});
			
			// define what to do when no location is found
			search_api.on('no-result', function() {
				// show alert dialog
				console.error('No location matching the entered text could be found.');
			});
			
			// define what to do when a search times out
			search_api.on('timeout', function() {
				// show alert dialog
				console.error('The search operation timed out.');
			});
		});


		$('#searchSubmit').on('click', function(){
			console.log('in search submit');
			$('#sapi-searchTextBox').keyup();
		});
	}

	/* geocoder control */

	/* legend control */
	$('#legendButtonNavBar, #legendButtonSidebar').on('click', function () {
        $('#legend').toggle();
        //return false;
    });
    $('#legendClose').on('click', function () {
        $('#legend').hide();
    });
    /* legend control */

    // map.on('moveend', function(e) {
    //     USGSrtGages.clearLayers();
    //     if (map.hasLayer(USGSrtGages) && map.getZoom() >= 10) {
    //         var bbox = map.getBounds().getSouthWest().lng.toFixed(7) + ',' + map.getBounds().getSouthWest().lat.toFixed(7) + ',' + map.getBounds().getNorthEast().lng.toFixed(7) + ',' + map.getBounds().getNorthEast().lat.toFixed(7);
    //         queryNWISrtGages(bbox);
    //     }
    // });

	///fix to prevent re-rendering nwis rt gages on pan
	map.on('load moveend zoomend', function(e) {
		
		var foundPopup;
		$.each(USGSrtGages.getLayers(), function( index, marker ) {
			var popup = marker.getPopup();
			if (popup) {
				foundPopup = popup._isOpen;
			}
		})
		if (map.getZoom() < 7) USGSrtGages.clearLayers();
		if (map.hasLayer(USGSrtGages) && map.getZoom() >= 7 && !foundPopup) {
			USGSrtGages.clearLayers();
			var bbox = map.getBounds().getSouthWest().lng.toFixed(7) + ',' + map.getBounds().getSouthWest().lat.toFixed(7) + ',' + map.getBounds().getNorthEast().lng.toFixed(7) + ',' + map.getBounds().getNorthEast().lat.toFixed(7);
			queryNWISrtGages(bbox);
		}
	});

	USGSrtGages.on('click', function(e) {
		var popupContent = '';
		$.each(e.layer.data.parameters, function( index, parameter ) {
			//create table, converting timestamp to friendly format using moment.js library
			popupContent += '<tr><td>' + index + '</td><td>' + parameter.Value + '</td><td>' + moment(parameter.Time).format("dddd, MMMM Do YYYY, h:mm:ss a") + '</td></tr>'
		});

		var timeQueryRange = '';
		if (fev.vars.currentEventActive == true && fev.vars.currentEventEndDate_str == '') {
			//use moment.js lib to get current system date string, properly formatted
			fev.vars.currentEventEndDate_str = moment().format('YYYY-MM-DD');
		}
		if (fev.vars.currentEventStartDate_str == '' || fev.vars.currentEventEndDate_str == '') {
			timeQueryRange = '&period=P7D'
		} else {
			timeQueryRange = '&startDT=' + fev.vars.currentEventStartDate_str + '&endDT=' + fev.vars.currentEventEndDate_str;
		}

		//if there is some data, show the div
		//$('#graphContainer').show();

		e.layer.bindPopup('<b>' + e.layer.data.siteName + '</br>Full data link: <a target="_blank" href="http://nwis.waterdata.usgs.gov/nwis/uv?site_no=' + e.layer.data.siteCode[0].value + '">' + e.layer.data.siteCode[0].value + '</a></b><br><table class="table table-condensed"><thead><tr><th>Parameter</th><th>Value</th><th>Timestamp</th></tr></thead><tbody>' + popupContent + '</tbody></table><div id="graphContainer" style="width:100%; height:200px;display:none;"></div>').openPopup();
		//date range example '&startDT=2016-08-28&endDT=2016-09-01'
		//var timeQueryRange = '&startDT=2016-08-28&endDT=2016-09-01';
		//var periodLast7 = '&period=P7D';

		$.getJSON('http://nwis.waterservices.usgs.gov/nwis/iv/?format=json&sites=' + e.layer.data.siteCode[0].value + '&parameterCd=00065' + timeQueryRange, function(data) {
		///temporary substitution of direct address to NWIS server that works
		//$.getJSON('http://nadww01.er.usgs.gov/nwis/iv/?format=json&sites=' + e.layer.data.siteCode[0].value + '&parameterCd=00065' + timeQueryRange, function(data) {

			if (data.value.timeSeries.length <= 0) console.log("No NWIS graph data available for this time period");

			else {
				//if there is some data, show the div
				$('#graphContainer').show();

				//transpose array
				var graphData = [];
				$.map( data.value.timeSeries[0].values[0].value, function( val, i ) {
					graphData.push([Date.parse(val.dateTime),parseFloat(val.value)])
				});
				Highcharts.setOptions({global: { useUTC: false } });
				$('#graphContainer').highcharts({
					chart: {
						type: 'line'
					},
					title: {
						//text: e.layer.data.siteCode[0].agencyCode + ' ' + e.layer.data.siteCode[0].value + ' ' + e.layer.data.siteName
						text: null
					},
					credits: {
						enabled: false
					},
					xAxis: {
						type: "datetime",
						labels: {
							formatter: function () {
								//return Highcharts.dateFormat('%d %b %y', this.value);
								//w/out year
								return Highcharts.dateFormat('%d %b', this.value);
							},
							//rotation: -90,
							align: 'center'
						}
					},
					yAxis: {
						title: { text: 'Gage Height, feet' }
					},
					series: [{
						showInLegend: false,
						data: graphData,
						tooltip: {
							pointFormat: "Gage height: {point.y} feet"
						}
					}]
				});
			}
		});
	})

    //begin latLngScale utility logic/////////////////////////////////////////////////////////////////////////////////////////

	//displays map scale on map load
	//map.on( 'load', function() {
	map.whenReady( function() {
		var mapScale =  scaleLookup(map.getZoom());
		$('#scale')[0].innerHTML = mapScale;
		console.log('Initial Map scale registered as ' + mapScale, map.getZoom());

		var initMapCenter = map.getCenter();
		$('#latitude').html(initMapCenter.lat.toFixed(4));
		$('#longitude').html(initMapCenter.lng.toFixed(4));
	});

//displays map scale on scale change (i.e. zoom level)
	map.on( 'zoomend', function () {
		var mapZoom = map.getZoom();
		var mapScale = scaleLookup(mapZoom);
		$('#scale')[0].innerHTML = mapScale;
	});

//updates lat/lng indicator on mouse move. does not apply on devices w/out mouse. removes 'map center' label
	map.on( 'mousemove', function (cursorPosition) {
		$('#mapCenterLabel').css('display', 'none');
		if (cursorPosition.latlng !== null) {
			$('#latitude').html(cursorPosition.latlng.lat.toFixed(4));
			$('#longitude').html(cursorPosition.latlng.lng.toFixed(4));
		}
	});
//updates lat/lng indicator to map center after pan and shows 'map center' label.
	map.on( 'dragend', function () {
		//displays latitude and longitude of map center
		$('#mapCenterLabel').css('display', 'inline');
		var geographicMapCenter = map.getCenter();
		$('#latitude').html(geographicMapCenter.lat.toFixed(4));
		$('#longitude').html(geographicMapCenter.lng.toFixed(4));
	});

	function scaleLookup(mapZoom) {
		switch (mapZoom) {
			case 19: return '1,128';
			case 18: return '2,256';
			case 17: return '4,513';
			case 16: return '9,027';
			case 15: return '18,055';
			case 14: return '36,111';
			case 13: return '72,223';
			case 12: return '144,447';
			case 11: return '288,895';
			case 10: return '577,790';
			case 9: return '1,155,581';
			case 8: return '2,311,162';
			case 7: return '4,622,324';
			case 6: return '9,244,649';
			case 5: return '18,489,298';
			case 4: return '36,978,596';
			case 3: return '73,957,193';
			case 2: return '147,914,387';
			case 1: return '295,828,775';
			case 0: return '591,657,550';
		}
	}
	//end latLngScale utility logic/////////
});