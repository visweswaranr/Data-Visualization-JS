// Load the Visualization API and the corechart package.
google.load('visualization', '1.0', {'packages':['corechart']});
// Set a callback to run when the Google Visualization API is loaded.
google.setOnLoadCallback(initialize);

function getMonthString(month, length){
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    length = length || 3;
    return months[month].substring(0, length);
}

function getFormattedDate(dateString, format){
    var date = new Date(dateString);
    switch(format){
        case "hiphen":
            return (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getFullYear();
        case "dd":
            return date.getDate();
        default:
            return getMonthString(date.getMonth()) + ' ' + date.getDate() + ', ' + date.getFullYear();
    }
}

function getLabelForGeneralChart(flower, dateString){
    var date = getFormattedDate(dateString, "dd");
    return flower.charAt(0) + "-" + date;
}

function capitaliseFirstLetter(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function toggleTabs(selectedFlowers, selectedDates){
    var container = $('#tab-container'), filteredWithFlowers, filteredWithDates, flowersToEnable, datesToEnable, flowersToDisable, datesToDisable;
    // Flowers
    if(_.isEmpty(selectedFlowers)){
        filteredWithFlowers = this.inputGroupedByFlower;
        flowersToDisable = {};
    }else{
        filteredWithFlowers = _.pick(this.inputGroupedByFlower, selectedFlowers);
        flowersToDisable = _.keys(_.omit(this.inputGroupedByFlower, selectedFlowers));
    }
    flowersToEnable = _.keys(filteredWithFlowers);

    // Enabling flowers
    _.each(flowersToEnable, function(flower, index){
        container.find('a[href="#' + flower + '"]:first').parent().removeClass('disabled');
    });
    // Disabling flowers
    _.each(flowersToDisable, function(flower, index){
        container.find('a[href="#' + flower + '"]:first').parent().addClass('disabled');
    });

    // Dates
    if(_.isEmpty(selectedDates)){
        filteredWithDates = this.inputGroupedByDate;
        datesToDisable = {};
    }else{
        filteredWithDates = _.pick(this.inputGroupedByDate, selectedDates);
        datesToDisable = _.keys(_.omit(this.inputGroupedByDate, selectedDates));
    }
    datesToEnable = _.keys(filteredWithDates);

    // Enabling dates
    _.each(datesToEnable, function(dateString, index){
        container.find('a[href="#' + getFormattedDate(dateString, 'hiphen') + '"]:first').parent().removeClass('disabled');
    });
    // Disabling dates
    _.each(datesToDisable, function(dateString, index){
        container.find('a[href="#' + getFormattedDate(dateString, 'hiphen') + '"]:first').parent().addClass('disabled');
    });

    // unbinding previously bound menu items
    container.find('li:not(.disabled)').unbind();
    // binding disabled menu items to not do anything on 'click'
    container.find('li.disabled').bind('click', function(event){
        event.stopPropagation();
        event.preventDefault();
    });

    // If currently active tab is now disabled? switch to 'General' tab.
    if(container.find('.dropdown-menu > li.active').hasClass('disabled')){
        container.find('a:first').tab('show');
    }
}

function onFilterButtonClickHandler(event){
    var buttonContainer = $('#button-container'),
        selectedFlowers = [], selectedDates = [];
    $(event.currentTarget).toggleClass('active');
    // Find the flowers in 'active' mode
    buttonContainer.find('.flowers button.active').each(function(index, element){
        selectedFlowers.push($(element).val());
    });
    // Find the dates in 'active' mode
    buttonContainer.find('.dates button.active').each(function(index, element){
        selectedDates.push($(element).val());
    });
    toggleTabs(selectedFlowers, selectedDates);
    drawGeneralChart(selectedFlowers, selectedDates);
    drawFlowerCharts(selectedFlowers, selectedDates);
    drawDateCharts(selectedFlowers, selectedDates);
}

// Draw the tabs for General, Flowers and Dates
function drawTabs() {
    var container = $('#tab-container');
    var html = '', tabTemplate;
    tabTemplate = _.template('<li><a href="#<%=link%>" data-toggle="tab"><%=name%></a></li>');

    html = '<ul class="nav nav-tabs">';
    html += '<li><a href="#general" data-toggle="tab">General</a></li>';
    // Flower drop-down menu
    html += '<li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Flower <b class="caret"></b></a>';
    html += '<ul class="dropdown-menu">';
    // Flower tabs
    _.each(this.uniqueFlowers, function(flower, index){
        html += tabTemplate({
            link: flower,
            name: capitaliseFirstLetter(flower)
        });
    });
    html += '</ul></li>';

    // Dates drop-down menu
    html += '<li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown">Date <b class="caret"></b></a>';
    html += '<ul class="dropdown-menu">';
    // Date tabs
    var displayDate, idDate;
    _.each(this.uniqueDates, function(dateString, index){
        displayDate = getFormattedDate(dateString);
        idDate = getFormattedDate(dateString, 'hiphen');
        html += tabTemplate({
            link: idDate,
            name: displayDate
        });
    });
    html += '</ul></li>';
    container.append(html);

    // Tab-panes
    var contentContainer = $('#tab-content'), contentTemplate;
    contentContainer.addClass('tab-content');
    contentTemplate = _.template('<div class="tab-pane" id="<%=id%>"><h3><%=title%></h3><div class="chart-container"></div></div>');
    html = contentTemplate({id:'general', title:'All Filtered data'});
    // Flower tab-pane
    _.each(this.uniqueFlowers, function(flower, index){
        html += contentTemplate({id: flower, title: capitaliseFirstLetter(flower)});
    });
    // Date tab-pane
    _.each(this.uniqueDates, function(dateString, index){
        idDate = getFormattedDate(dateString, 'hiphen');
        html += contentTemplate({id:idDate, title: getFormattedDate(dateString)});
    });
    contentContainer.append(html);
    // Select first tab - General
    container.find('a:first').tab('show');
}

// Draw the buttons for Flowers and Dates
function drawButtons(){
    var container = $('#button-container'), buttonTemplate;
    var flowers = [], dates = [], html =  '';
    $.each(this.inputData, function(index, row){
        flowers.push(row.flower);
        dates.push(row.date);
    });
    this.uniqueFlowers = _.uniq(flowers);
    this.uniqueDates = _.uniq(dates);
    buttonTemplate = _.template('<button type="button" class="btn" value="<%=value%>"><%=name%></button>');

    html += '<span class="help-block">Filter the data by selecting flowers/dates</span>';
    // Flower buttons
    html += '<label>Flowers</label><div class="btn-group flowers">';
    _.each(this.uniqueFlowers, function(flower, index){
        html += buttonTemplate({
            value: flower,
            name: capitaliseFirstLetter(flower)
        });
    });
    html += '</div><br/>';

    // Date buttons
    html += '<label>Dates</label><div class="btn-group dates">';
    var displayDate;
    _.each(this.uniqueDates, function(dateString, index){
        displayDate = getFormattedDate(dateString);
        html += buttonTemplate({
            value: dateString,
            name: displayDate
        });
    });
    html += '</div><hr>';
    container.append(html);

    // bind click of button to 'onFilterButtonClickHandler'
    container.find('button').bind('click', function(event) {
        onFilterButtonClickHandler(event);
    });
}

// Charts for flower tabs
function drawFlowerCharts(selectedFlowers, selectedDates){
    var data, chartData, filteredWithFlowers, filteredWithDates, container, chart;

    // Set chart default options
    var options = {
        width:800,
        height:600,
        hAxis: {title: 'Date', titleTextStyle: {color: 'red'}},
        vAxis: {title: 'Count', titleTextStyle: {color: 'red'}},
        bar: {groupWidth: 30},
        chartArea: {left: 80, top: 50}};

    filteredWithFlowers = _.isEmpty(selectedFlowers) ? this.inputGroupedByFlower : _.pick(this.inputGroupedByFlower, selectedFlowers);
    _.each(filteredWithFlowers, function(flowerGroup, key){
        chartData = [];
        //get key's corresponding chart-container element
        container = $('#' + key).find('.chart-container').get(0);
        filteredWithDates = _.isEmpty(selectedDates) ? flowerGroup : _.pick(flowerGroup, selectedDates);
        _.each(filteredWithDates, function(row){
            chartData.push([getFormattedDate(row.date), parseInt(row['quantity-sold']), parseInt(row['quantity-unsold'])]);
        });
        data = new google.visualization.DataTable();
        data.addColumn('string', 'Date');
        data.addColumn('number', 'Quantity-sold');
        data.addColumn('number', 'Quantity-unsold');
        data.addRows(chartData);
        chart = new google.visualization.ColumnChart(container);
        chart.draw(data, options);
    });
}

// Charts for date tabs
function drawDateCharts(selectedFlowers, selectedDates){
    var data, chartData, filteredWithFlowers, filteredWithDates, container, chart;

    // Set chart default options
    var options = {
        width:800,
        height:600,
        hAxis: {title: 'Flower', titleTextStyle: {color: 'red'}},
        vAxis: {title: 'Count', titleTextStyle: {color: 'red'}},
        bar: {groupWidth: 30},
        chartArea: {left: 80, top: 50}};

    filteredWithDates = _.isEmpty(selectedDates) ? this.inputGroupedByDate: _.pick(this.inputGroupedByDate, selectedDates);
    _.each(filteredWithDates, function(flowerGroup, key){
        chartData = [];
        //get key's corresponding chart-container element
        container = $('#' + getFormattedDate(key, 'hiphen')).find('.chart-container').get(0);
        filteredWithFlowers = _.isEmpty(selectedFlowers) ? flowerGroup : _.pick(flowerGroup, selectedFlowers);
        _.each(filteredWithFlowers, function(row){
            chartData.push([row.flower, parseInt(row['quantity-sold']), parseInt(row['quantity-unsold'])]);
        });
        data = new google.visualization.DataTable();
        data.addColumn('string', 'Flower');
        data.addColumn('number', 'Quantity-sold');
        data.addColumn('number', 'Quantity-unsold');
        data.addRows(chartData);
        chart = new google.visualization.ColumnChart(container);
        chart.draw(data, options);
    });
}

// Column Chart for the filtered data
function drawGeneralChart(selectedFlowers, selectedDates) {
    var filteredWithFlowers, filteredWithDates, soldToolTip, unsoldToolTip, chartData = [];
    filteredWithFlowers = _.isEmpty(selectedFlowers) ? this.inputGroupedByFlower : _.pick(this.inputGroupedByFlower, selectedFlowers);

    // Get data for the Chart.
    _.each(filteredWithFlowers, function(flowerGroup){
        filteredWithDates = _.isEmpty(selectedDates) ? flowerGroup : _.pick(flowerGroup, selectedDates);
        _.each(filteredWithDates, function(row){
            chartData.push([getLabelForGeneralChart(row.flower, row.date), parseInt(row['quantity-sold']), parseInt(row['quantity-unsold'])]);
        });
    });

    // Create the data table.
    var data = new google.visualization.DataTable();
    data.addColumn('string', 'Flower-Date');
    data.addColumn('number', 'Quantity-sold');
    data.addColumn('number', 'Quantity-unsold');
    data.addRows(chartData);

	// Set chart options
	var options = {
       width:1000,
       height:800,
       hAxis: {title: 'Flower-Date', titleTextStyle: {color: 'red'}},
       vAxis: {title: 'Count', titleTextStyle: {color: 'red'}},
       bar: {groupWidth: 30},
       chartArea: {left: 80, top: 50}};

	// Instantiate and draw our chart, passing in some options.
    var container = $('#general').find('.chart-container').get(0);
	var chart = new google.visualization.ColumnChart(container);
	chart.draw(data, options);
}

function initialize(){
    this.inputData = [
        {"flower": "tulip", "date": "2/3/2012", "quantity-sold": "20", "quantity-unsold": "10"},
        {"flower": "tulip", "date": "2/4/2012", "quantity-sold": "18", "quantity-unsold": "12"},
        {"flower": "tulip", "date": "2/5/2012", "quantity-sold": "23", "quantity-unsold": "7"},
        {"flower": "tulip", "date": "2/6/2012", "quantity-sold": "15", "quantity-unsold": "20"},
        {"flower": "tulip", "date": "2/7/2012", "quantity-sold": "12", "quantity-unsold": "23"},
        {"flower": "rose", "date": "2/3/2012", "quantity-sold": "50", "quantity-unsold": "40"},
        {"flower": "rose", "date": "2/4/2012", "quantity-sold": "43", "quantity-unsold": "47"},
        {"flower": "rose", "date": "2/5/2012", "quantity-sold": "55", "quantity-unsold": "35"},
        {"flower": "rose", "date": "2/6/2012", "quantity-sold": "70", "quantity-unsold": "20"},
        {"flower": "rose", "date": "2/7/2012", "quantity-sold": "30", "quantity-unsold": "70"},
        {"flower": "dandelion", "date": "2/3/2012", "quantity-sold": "10", "quantity-unsold": "0"},
        {"flower": "dandelion", "date": "2/4/2012", "quantity-sold": "9", "quantity-unsold": "11"},
        {"flower": "dandelion", "date": "2/5/2012", "quantity-sold": "3", "quantity-unsold": "17"},
        {"flower": "dandelion", "date": "2/6/2012", "quantity-sold": "4", "quantity-unsold": "16"},
        {"flower": "dandelion", "date": "2/7/2012", "quantity-sold": "7", "quantity-unsold": "8"}
    ];

    // Array of arrays grouped by flower
    var inputGroupedByFlower = {};
    $.each(this.inputData, function(index, value) {
        if(inputGroupedByFlower[value.flower] === undefined){
            inputGroupedByFlower[value.flower] = {};
        }
        inputGroupedByFlower[value.flower][value.date] = value;
    });

    // Array of arrays grouped by date
    var inputGroupedByDate = {};
    $.each(this.inputData, function(index, value) {
        if(inputGroupedByDate[value.date] === undefined){
            inputGroupedByDate[value.date] = {};
        }
        inputGroupedByDate[value.date][value.flower] = value;
    });

    this.inputGroupedByFlower = inputGroupedByFlower;
    this.inputGroupedByDate = inputGroupedByDate;

    drawButtons();
    drawTabs();
    drawGeneralChart();
    drawFlowerCharts();
    drawDateCharts();
}