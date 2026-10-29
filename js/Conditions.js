var zipCode;
var cityName;
var stateName = "";
var countryName = "";
var stationId = "";

var longitude;
var latitude;

var currentTemperature;
var currentIcon;
var currentCondition;
var windSpeed;
var windDirection = "";
var gusts;
var feelsLike;
var visibility;
var humidity;
var dewPoint;
var pressure;
var pressureTrend;
var forecastNarrative = [];
var forecastTemp = [];
var forecastIcon = [];
var forecastPrecip = [];
var outlookHigh = [];
var outlookLow = [];
var outlookCondition = [];
var outlookIcon = [];
var radarImage;
var zoomedRadarImage;
var alertsActive;
var alerts = [];

// Días de la semana para el pronóstico extendido (disponible globalmente)
var WEEKDAY = window.WEEKDAY = ["SUN", "MON", "TUES", "WED", "THU", "FRI", "SAT"];
