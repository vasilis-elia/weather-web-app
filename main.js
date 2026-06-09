document.getElementById("search").addEventListener("click", validateForm);
document.getElementById("clear").addEventListener("clear", clearResults);

let username = "vilia002";
let openWeatherKey = "d92136412e8626339454a684bbf1f8eb";
let units;
let lon;
let lat;
let formDataObj = {};
const currWeather = {}; // Object to hold data for current weather.
let forecastWeather = []; // Array that holds objects of forecast weather (one object per 3 hour timeslot).
let temperatureValues = [];
let humidityValues = [];
let pressureValues = [];

function validateForm() {
    const regionInput = document.getElementById("region");
    const citySelect = document.getElementById("city");

    const regionError = document.getElementById("region-error");
    const cityError = document.getElementById("city-error");

    let valid = true;

    // Region validation.
    if (!regionInput.value.trim()) { // Empty or only spaces.
        regionError.style.display = "block";
        valid = false;
    }
    else
        regionError.style.display = "none";

    // City validation.
    if (!citySelect.value) { // Since Select City has not value.
        cityError.style.display = "block";
        valid = false;
    }
    else
        cityError.style.display = "none";

    // If both valid make API requets.
    if (valid) {
        const formData = new FormData(document.querySelector("#form"));
        units = formData.get('degree_unit') === "celcius" ? "metric" : "imperial"; // Also saves prefered units for later.

        makeNominatimRequest(formData);
    }
}

function makeNominatimRequest(formData) {
    const xhr = new XMLHttpRequest();

    let qData = encodeURIComponent(formData.get('region') + ',' + formData.get('city')) + '&format=json';
    let url = 'https://nominatim.openstreetmap.org/search?q=' + qData;

    xhr.open('GET', url);
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
            let data = JSON.parse(xhr.responseText);

            if (Array.isArray(data) && data.length == 0) { // In case location was not found from nominatim.
                showAlert("No result for that location.");
            }
            else {
                lon = parseFloat(data[0].lon); // Use the first location from nominatim.
                lat = parseFloat(data[0].lat);
                getCurrentWeather();
                getNext24HoursWeather();
            }
        } else {
            console.log('Error: ', xhr);
        }
    }
    xhr.send();
}

function getCurrentWeather() {
    const xhr = new XMLHttpRequest();
    let url = "https://api.openweathermap.org/data/2.5/weather?" +
        "lat=" + lat + "&lon=" + lon + "&units=" + units + "&APPID=" + openWeatherKey;

    xhr.open("GET", url);

    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
            let data = JSON.parse(xhr.responseText);
            extractCurrentWeather(data);
            displayCurrentWeather();
        } else {
            console.log('Error: ', xhr);
        }
    }
    xhr.send();
}

// Gets all important data from OpenWeather response for current weather.
function extractCurrentWeather(data) {
    // In case a value undefined or null (or 0 when it should not like time), then sets value to "N.A."
    currWeather['description'] = data?.weather?.[0]?.description ?? "N.A.";
    currWeather['icon'] = data?.weather?.[0]?.icon ?? "N.A.";
    currWeather['temp'] = data?.main?.temp != null ? parseFloat(data.main.temp).toFixed(2) : "N.A.";
    currWeather['temp_min'] = data?.main?.temp_min != null ? parseFloat(data.main.temp_min).toFixed(2) : "N.A.";
    currWeather['temp_max'] = data?.main?.temp_max != null ? parseFloat(data.main.temp_max).toFixed(2) : "N.A.";
    currWeather['pressure'] = data?.main?.pressure != null ? parseFloat(data.main.pressure) : "N.A.";
    currWeather['humidity'] = data?.main?.humidity != null ? parseInt(data.main.humidity) : "N.A.";
    currWeather['speed'] = data?.wind?.speed != null ? parseFloat(data.wind.speed) : "N.A.";
    currWeather['all'] = data?.clouds?.all != null ? parseInt(data.clouds.all) : "N.A.";
    currWeather['country'] = data?.sys?.country ?? "N.A.";
    currWeather['sunrise'] = data?.sys?.sunrise != null ? formatTimeNumeric(data.sys.sunrise) : "N.A.";
    currWeather['sunset'] = data?.sys?.sunset != null ? formatTimeNumeric(data.sys.sunset) : "N.A.";
    currWeather['city'] = data?.name ?? "N.A.";
}

// Date with numbers.
function formatTimeNumeric(timestamp) {
    const date = new Date(timestamp * 1000);
    // Options for changing the date format.
    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    return date.toLocaleString('ja-JP', options).replace(',', '').replaceAll('/', '-');
}

// Date with short months.
function formatTimeShort(timestamp) {
    const date = new Date(timestamp * 1000);

    // Options for changing the date format.
    const options = {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    return date.toLocaleString('en-GB', options).replace(',', '');
}

function displayCurrentWeather() {
    // Weather icon is specified in the response and then we can build the img element inside the appropriate table element.
    let iconUrl = "https://openweathermap.org/img/w/" + currWeather.icon + ".png";

    document.getElementById("weather-image").innerHTML = `<img src="${iconUrl}" alt="Weather icon">`;

    // Weather description.
    let weatherDescription = currWeather.description + " at " + currWeather.city;
    document.getElementById("weather-description").textContent = weatherDescription;

    // Current temperature.
    let currentTemperature = currWeather.temp === "N.A." ? "N.A." : (currWeather.temp + " " + (units === "metric" ? "°C" : "°F"));
    document.getElementById("weather-temperature").textContent = currentTemperature

    // High and low temperatures.
    let lowTemp = currWeather.temp_min === "N.A." ? "N.A." : (currWeather.temp_min + " " + (units === "metric" ? "°C" : "°F"));
    let highTemp = currWeather.temp_max === "N.A." ? "N.A." : (currWeather.temp_max + " " + (units === "metric" ? "°C" : "°F"));
    document.getElementById("temp-low").textContent = lowTemp;
    document.getElementById("temp-high").textContent = highTemp;

    // Pressure.
    let pressure = currWeather.pressure === "N.A." ? "N.A." : (currWeather.pressure + " " + (units === "metric" ? "hPa" : "Mb"));
    document.getElementById("pressure").textContent = pressure;

    // Humidity.
    let humidity = currWeather.humidity === "N.A." ? "N.A." : (currWeather.humidity + " %");
    document.getElementById("humidity").textContent = humidity;

    // Wind speed.
    let windSpeed = currWeather.speed === "N.A." ? "N.A." : (currWeather.speed + " " + (units === "metric" ? "meters/sec" : "miles/hour"));
    document.getElementById("wind-speed").textContent = windSpeed;

    // Cloud cover.
    let cloudCover = currWeather.all === "N.A." ? "N.A." : (currWeather.all + " %");
    document.getElementById("cloud-cover").textContent = cloudCover;

    // Sunrise.
    document.getElementById("sunrise").textContent = currWeather.sunrise;

    // Sunset.
    document.getElementById("sunset").textContent = currWeather.sunset;

    document.getElementById("results").style.display = "block";
    document.getElementById("right-now-tab").click(); // Shows the right now tab when the user makes a search.
 
    display_map(); // Shows the map in the "Right Now" tab.
}

function retrieveLogs() {
    const xhr = new XMLHttpRequest();

    let dataRetrieval = "dataRetrieval=true";

    let qData = dataRetrieval + '&username=' + username;
    let url = "database_connect.php?" + qData;

    xhr.open('GET', url);

    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;

        if (xhr.status >= 200 && xhr.status < 300) {
            let responseArray = JSON.parse(xhr.responseText);
            popLogWindow(responseArray);
        } else {
            console.log('Error: ', xhr);
        }
    }
    xhr.send();
}

function popLogWindow(responseArray) {
    document.getElementById("table-body").innerHTML = ""; // Removes previous records.

    // Makes all input elements and buttons disabled while logs are displayed.
    let allElements = document.querySelectorAll(".interactable");
    for (let element of allElements) {
        element.disabled = true;
    }

    // Background grayscreen.
    document.getElementById("grayscreen").classList.remove("hidden");
    document.getElementById("grayscreen").classList.add("shown")

    responseArray.forEach(record => {
        const date = formatTimeShort(record.timestamp);

        // For each records creates a new row element.
        const row = document.createElement("tr");

        // Appends to each row the specific record's data.
        for (let property in record) {
            let table_data = document.createElement("td");
            if (property === "timestamp")
                table_data.textContent = date;
            else
                table_data.textContent = record[property];

            row.appendChild(table_data);
        }

        // Since first record was the latest one, appending them will list them from latest to oldest.
        document.getElementById("table-body").appendChild(row);
        showLogsWindow();
    });
}

function closeLogsWindow() {
    const logs = document.getElementById("logs");
    if (logs.classList.contains("shown")) {
        logs.classList.remove("shown");
        logs.classList.add("hidden");
    }

    // Re-enables the disabled inputs.
    let allElements = document.querySelectorAll(".interactable");
    for (let element of allElements) {
        element.disabled = false;
    }

    document.getElementById("grayscreen").classList.remove("shown");
    document.getElementById("grayscreen").classList.add("hidden");
}

function showLogsWindow() {
    const logs = document.getElementById("logs");
    if (logs.classList.contains("hidden")) {
        logs.classList.remove("hidden");
        logs.classList.add("shown");
    }
}

// Alert in case nominatim returns empty array.
function showAlert(message) {
    // Makes all input elements and buttons disabled while logs are displayed.
    let allElements = document.querySelectorAll(".interactable");
    for (let element of allElements) {
        element.disabled = true;
    }

    document.getElementById('custom-alert-message').textContent = message;

    document.getElementById('custom-alert').style.display = 'block';
    document.getElementById("grayscreen").style.display = 'block';
}
function closeAlert() {
    // Re-enables the disabled inputs.
    let allElements = document.querySelectorAll(".interactable");
    for (let element of allElements) {
        element.disabled = false;
    }

    document.getElementById('custom-alert').style.display = 'none';
    document.getElementById("grayscreen").style.display = 'none';
}

// When clear button is pressed.
function clearResults() {
    // Hides results.
    document.getElementById("results").style.display = "none";

    // Checks celcius.
    document.getElementById("celcius").checked = true;

    // Hides error messages.
    document.getElementById("region-error").style.display = "none";
    document.getElementById("city-error").style.display = "none";
}

// Changes tab styles if right now button is pressed.
function rightNowTab() {
    let rightNow = document.getElementById("right-now-tab");
    let next24 = document.getElementById("next24-tab");

    if (!rightNow.classList.contains("focused-tab")) {
        rightNow.classList.add("focused-tab");
    }

    rightNow.classList.remove("out-of-focus-tab");

    if (!next24.classList.contains("out-of-focus-tab")) {
        next24.classList.add("out-of-focus-tab");
    }

    next24.classList.remove("focused-tab");

    document.getElementById("next24").style.display = "none";
    document.getElementById("right-now").style.display = "block";
}

// Changes tab styles if next 24 hours button is pressed.
function next24HoursTab() {
    let rightNow = document.getElementById("right-now-tab");
    let next24 = document.getElementById("next24-tab");

    if (!next24.classList.contains("focused-tab")) {
        next24.classList.add("focused-tab");
    }

    next24.classList.remove("out-of-focus-tab");

    if (!rightNow.classList.contains("out-of-focus-tab")) {
        rightNow.classList.add("out-of-focus-tab");
    }

    rightNow.classList.remove("focused-tab");

    document.getElementById("right-now").style.display = "none";
    document.getElementById("next24").style.display = "block";
}

function getNext24HoursWeather() {
    const xhr = new XMLHttpRequest();

    let url = "https://api.openweathermap.org/data/2.5/forecast?" +
        "lat=" + lat + "&lon=" + lon + "&units=" + units + "&APPID=" + openWeatherKey;

    xhr.open("GET", url);

    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
            let data = JSON.parse(xhr.responseText);
            extractWeatherForecast(data);
            displayWeatherForecast();
        } else {
            console.log('Error: ', xhr);
        }
    }
    xhr.send();
}

// Extracts forecast data in a list that holds an object for each 3 hour forecast.
function extractWeatherForecast(data) {    
    forecastWeather = []; // Resets values.

    for (let i = 0; i < data.list.length; i++) {
        const nextForecast = {};

        const dataItem = data.list[i];

        // In case a value undefined or null (or 0 when it should not like time), then sets value to "N.A."
        nextForecast['time'] = dataItem?.dt || "N.A.";
        nextForecast['temp'] = dataItem?.main?.temp != null ? parseFloat(dataItem.main.temp).toFixed(2) : "N.A.";
        nextForecast['pressure'] = dataItem?.main?.pressure != null ? parseFloat(dataItem.main.pressure) : "N.A.";
        nextForecast['humidity'] = dataItem?.main?.humidity != null ? parseInt(dataItem.main.humidity) : "N.A.";
        nextForecast['main'] = dataItem?.weather?.[0]?.main || "N.A.";
        nextForecast['description'] = dataItem?.weather?.[0]?.description || "N.A.";
        nextForecast['icon'] = dataItem?.weather?.[0]?.icon || "N.A.";
        nextForecast['windSpeed'] = dataItem?.wind?.speed != null ? parseFloat(dataItem.wind.speed) : "N.A.";
        nextForecast['clouds'] = dataItem?.clouds?.all ?? "N.A.";
        nextForecast['city'] = data?.city?.name || "N.A.";

        forecastWeather.push(nextForecast);
    }
}

function displayWeatherForecast() {
    const tableBody = document.getElementById("next24-table-body");
    tableBody.innerHTML = ""; // Resets previous data (if user pressed the search button previously).

    // Display 8 3-hour intervals for the next 24 hours.
    for (let i = 0; i < 8; i++) {
        const row = document.createElement("tr"); // One row for each 3-hour interval.

        // Forecast weather is an array of objects. Each object represents weather for a 3-hour interval.
        let tableData = document.createElement("td");
        tableData.style.setProperty("padding-bottom", "0");
        tableData.textContent = forecastWeather[i].time === "N.A." ? "N.A." : formatTimeNumeric(forecastWeather[i].time);
        row.appendChild(tableData);

        // Summary - icon.
        tableData = document.createElement("td");
        tableData.style.setProperty("padding", "0");
        const img = document.createElement("img");
        let iconUrl = "https://openweathermap.org/img/w/" + forecastWeather[i].icon + ".png";
        img.src = iconUrl;
        img.alt = "Weather icon";
        tableData.appendChild(img);
        row.appendChild(tableData);

        // Temp.
        tableData = document.createElement("td");
        tableData.style.setProperty("padding-bottom", "0");
        tableData.textContent = forecastWeather[i].temp === "N.A." ? "N.A." : (forecastWeather[i].temp + (units === "metric" ? " °C" : " °F"));
        row.appendChild(tableData);

        // Cloud cover.
        tableData = document.createElement("td");
        tableData.style.setProperty("padding-bottom", "0");
        tableData.textContent = forecastWeather[i].clouds === "N.A." ? "N.A." : (forecastWeather[i].clouds + " %");
        row.appendChild(tableData);

        // Details.
        // Finds the modal prototype and clones it. Modal needs to be cloned before the button,
        // since button references it.
        const viewModalPrototype = document.getElementById("view-modal-prototype");
        const viewModal = viewModalPrototype.cloneNode(true);
        viewModalPrototype.after(viewModal); // Adds cloned element to DOM (location does not matter).
        viewModal.id = "view-modal-" + i; // Clones need to have different id.

        // Changing modal content.
        // References each modal property using its id and the corresponding property class name.
        // Modal Title.
        let title = forecastWeather[i].city + " on " + (forecastWeather[i].time === "N.A." ? "N.A." :
            formatTimeShort(forecastWeather[i].time));
        document.querySelector("#" + viewModal.id + " .view-modal-title").textContent = title;

        // Modal icon.
        document.querySelector("#" + viewModal.id + " .view-modal-icon").src = iconUrl;
        document.querySelector("#" + viewModal.id + " .view-modal-icon").alt = "Weather Icon";

        // Modal description.
        let description = (forecastWeather[i].main === "N.A." || forecastWeather[i].description === "N.A.") ? "N.A." :
            forecastWeather[i].main + " (" + forecastWeather[i].description + ")";
        document.querySelector("#" + viewModal.id + " .view-modal-description").textContent = description;

        // Modal humidity.
        let humidity = forecastWeather[i].humidity === "N.A." ? "N.A." : forecastWeather[i].humidity + " %";
        document.querySelector("#" + viewModal.id + " .view-modal-humidity").textContent = humidity;

        // Modal pressure.
        let pressure = forecastWeather[i].pressure === "N.A." ? "N.A." :
            (forecastWeather[i].pressure + (units === "metric" ? " hPa" : " Mb"));
        document.querySelector("#" + viewModal.id + " .view-modal-pressure").textContent = pressure;

        // Wind speed.
        let windSpeed = forecastWeather[i].windSpeed === "N.A." ? "N.A." :
            (forecastWeather[i].windSpeed + (units === "metric" ? " meters/sec" : " miles/hour"));
        document.querySelector("#" + viewModal.id + " .view-modal-wind-speed").textContent = windSpeed;

        // Cloning the button.
        const viewButtonPrototype = document.getElementById("view-btn-prototype");
        const viewButton = viewButtonPrototype.cloneNode(true);
        viewButton.id = "view-btn-" + i;

        // Sets the target of the modal it will pop up to the cloned modal.
        viewButton.setAttribute("data-bs-target", "#" + viewModal.id);
        viewButton.style.display = "block";

        tableData = document.createElement("td");
        tableData.appendChild(viewButton);
        row.appendChild(tableData);

        tableBody.appendChild(row);
    }
    // So at first the table is hidden until the appropriate tab button is pressed.
    document.getElementById("next24").style.display = "none";
    display_gauges();
    display_charts();
}

function display_map() {
    document.getElementById("map").innerHTML = ""; // Resets map.

    let map = new ol.Map({
        target: 'map',
        layers: [
            new ol.layer.Tile({
                // first and only layer is the OpenStreetMap tiled layer
                source: new ol.source.OSM()
            })
        ],     
        view: new ol.View({
            center: ol.proj.fromLonLat([lon, lat]),
            zoom: 5
        })
    });

    // Temperature layer.
    let layer_temp = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=' + openWeatherKey
        }),
        opacity: 0.8
    });
    map.addLayer(layer_temp);


    // Precipitation layer.
    let layer_precipitation = new ol.layer.Tile({
        source: new ol.source.XYZ({
            url: 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=' + openWeatherKey
        }),
        opacity: 0.7
    });
    map.addLayer(layer_precipitation);
}

function display_gauges() {
    // Resets gauges before making the new ones.
    document.getElementById("gauge-max-temp").innerHTML = "";
    document.getElementById("gauge-max-humidity").innerHTML = "";
    document.getElementById("gauge-max-pressure").innerHTML = "";

    document.getElementById("gauges-title").textContent = "Weather extremes for " + formDataObj.region + ", " +
        formDataObj.city + " within next 5 days";

    // Resets values.
    temperatureValues = [];
    humidityValues = [];
    pressureValues = [];

    // Saves all temperature, humidity and pressure values in distinct arrays so Math.max() can be used.
    for (let weatherObj of forecastWeather) {
        temperatureValues.push(parseFloat(weatherObj.temp).toFixed(1));
        humidityValues.push(parseInt(weatherObj.humidity));
        pressureValues.push(parseInt(weatherObj.pressure));
    }

    let maxTemp = Math.max(...temperatureValues);
    let maxHumidity = Math.max(...humidityValues);
    let maxPressure = Math.max(...pressureValues);

    let gaugeTitle = "Max Temperature (" + (units === "metric" ? "°C)" : "°F)");
    let maxRange = units === "metric" ? 50 : 122; // Since Farehnait scales higher.
    plotGauge(maxTemp, "darkblue", maxRange, "gauge-max-temp", gaugeTitle);

    gaugeTitle = "Max Humidity (%)";
    plotGauge(maxHumidity, "darkred", 100, "gauge-max-humidity", gaugeTitle);

    gaugeTitle = "Max Pressure (" + (units === "metric" ? "hPa)" : "Mb)");
    plotGauge(maxPressure, "darkgreen", 1100, "gauge-max-pressure", gaugeTitle);
}

function plotGauge(gaugeValue, color, maxRange, gaugeContainerId, title) {
    const trace = {
        domain: { x: [0, 1], y: [0, 1] },
        value: gaugeValue,
        title: {
            text: title,
            font: { size: 12 }
        },
        type: 'indicator',
        mode: 'gauge+number',
        gauge: {
            axis: { range: [0, maxRange], tickwidth: 2, tickcolor: color, ticklen: 5, nticks: 10 },
            bar: { color: color }
        }
    };

    const layout = {
        margin: { l: 20, r: 20, t: 45, b: 45 },
        height: 190,
    };

    Plotly.newPlot(gaugeContainerId, [trace], layout, { responsive: true });
}

function display_charts() {
    // Resets charts before making the new ones.
    document.getElementById("chart-temp").innerHTML = "";
    document.getElementById("chart-humidity").innerHTML = "";
    document.getElementById("chart-pressure").innerHTML = "";

    document.getElementById("charts-title").textContent = "Weather Forecast for " + formDataObj.region + ", " +
        formDataObj.city;

    const dates = [];

    // Gathers times of each 3-hour intervals and converts them to date objects.
    for (let weatherObj of forecastWeather)
        dates.push(new Date(weatherObj.time * 1000));

    // Temperature chart.
    let title = "Temperature (" + (units === "metric" ? "°C)" : "°F)");
    plotChart(dates, temperatureValues, "chart-temp", title);

    title = "Humidity (%)";
    plotChart(dates, humidityValues, "chart-humidity", title);

    title = "Pressure (" + (units === "metric" ? "hPa)" : "Mb)");
    plotChart(dates, pressureValues, "chart-pressure", title);
}

function plotChart(dates, yValues, chartContainerId, title) {
    const trace = {
        x: dates,
        y: yValues,
        mode: 'lines+markers'
    };

    const layout = {
        title: {
            text: title,
            font: { size: 12 }
        },
        margin: { l: 40, r: 20, t: 40, b: 40 },
        xaxis: {
            type: 'date',
            tickfont: { size: 11 }
        }
    };

    Plotly.newPlot(chartContainerId, [trace], layout, { responsive: true });
}