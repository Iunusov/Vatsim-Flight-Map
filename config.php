<?php
define("MEMCACHE_IP", "127.0.0.1");
define("MEMCACHE_PORT", 11211);
define("MEMCACHE_EXPIRY_SECONDS", 3600);

define("STATUS_URL_IVAO", "https://www.ivao.aero/whazzup/status.txt");
define("STATUS_URL_VATSIM", "http://status.vatsim.net/");
define("WHAZZUP_URL_IVAO", ""); // for private FSD servers
define("WHAZZUP_URL_VATSIM", ""); // for private FSD servers
define("CACHE_LIFETIME_SECONDS", 100);

// DO NOT EDIT THE VALUES BELOW
define("EOL__", "\n");
define("CLIENTS_DATA", "CLIENTS_DATA");
define("CLIENTS_META", "CLIENTS_META");
define("IVAO_HEADER", EOL__ . "callsign:cid:realname:clienttype:frequency:latitude:longitude:altitude:groundspeed:planned_aircraft:planned_tascruise:planned_depairport:planned_altitude:planned_destairport:server:protrevision:rating:transponder:facilitytype:visualrange:planned_revision:planned_flighttype:planned_deptime:planned_actdeptime:planned_hrsenroute:planned_minenroute:planned_hrsfuel:planned_minfuel:planned_altairport:planned_remarks:planned_route:unused:unused2:unused3:unused4:atis_message:time_last_atis_received:time_logon:software_name:software_version:administrative_version:atc_pilot_version:planned_altairport2:type_of_flight:persons:heading:on_ground:simulator:" . EOL__);
define("IVAO_PATTERN", "/" . EOL__ . "(.*?):(cid|[0-9]+):(.*?):(clienttype|ATC|PILOT):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):((.*?):(.*?):)?(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):" . "/");
define("VATSIM_HEADER", EOL__ . "callsign:cid:realname:clienttype:frequency:latitude:longitude:altitude:groundspeed:planned_aircraft:planned_tascruise:planned_depairport:planned_altitude:planned_destairport:server:protrevision:rating:transponder:facilitytype:visualrange:planned_revision:planned_flighttype:planned_deptime:planned_actdeptime:planned_hrsenroute:planned_minenroute:planned_hrsfuel:planned_minfuel:planned_altairport:planned_remarks:planned_route:planned_depairport_lat:planned_depairport_lon:planned_destairport_lat:planned_destairport_lon:atis_message:time_last_atis_received:time_logon:heading:QNH_iHg:QNH_Mb:" . EOL__);
define("VATSIM_PATTERN", "/" . EOL__ . "(.*?):(cid|[0-9]+):(.*?):(clienttype|ATC|PILOT):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):(.*?):" . "/");
?>
