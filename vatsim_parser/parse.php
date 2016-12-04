#!/usr/bin/php
<?php
include ("config.php");
$arUrl = array(
"http://info.vroute.net/vatsim-data.txt",
"http://data.vattastic.com/vatsim-data.txt",
"http://vatsim.aircharts.org/vatsim-data.txt",
"http://vatsim-data.hardern.net/vatsim-data.txt"
);

require ("Airports.php");

function loadServersArray(){
	return json_decode(file_get_contents("./vatsim_servers.json"), true);
}

function trytoparse($url){
	global $memcache_connection_path;
    $clients_container = Array();
    $data = file_get_contents($url);
    if (!$data) {
		echo ("file_get_contents($url) fails" . PHP_EOL);
        return false;
    }
    preg_match("/!CLIENTS:(.*)" . PHP_EOL . ";" . PHP_EOL . ";" . PHP_EOL . "!SERVERS:/s", $data, $clients_container);
	
	
    if (!isset($clients_container[1])) {
		echo ("cannot parse data" . PHP_EOL);
		return false;
    }
    $clients = "";
    
    preg_match_all("/(.*):" . PHP_EOL . "/", $clients_container[1], $clients);
    
    if (!isset($clients[1])) {
        echo ("cannot parse !CLIENTS container ($url)" . PHP_EOL);
        return false;
    }
    
    $clients = $clients[1];
    
    preg_match("/; !CLIENTS section -(.*):" . PHP_EOL . "; !PREFILE/", $data, $clients_tpl);
    
    if (!isset($clients_tpl[1])) {
        echo ("cannot parse clients_tpl ($url)" . PHP_EOL);
        return false;
    }
    
    $clients_final = array();
    $tpl_array = explode(":", trim($clients_tpl[1]));
	
    foreach ($clients as $key => $item) {
		$cl_array = explode(":", trim($item));
		if(count($tpl_array) != count($cl_array)){
			continue;
		}
        $clients_final[$key] = array_combine(explode(":", trim($clients_tpl[1])), explode(":", trim($item)));
		if(!$clients_final[$key]){
			return false;
		}
        foreach ($clients_final[$key] as $k => $v) {
            if ($k == "atis_message" && $clients_final[$key][$k])
                $clients_final[$key][$k] = htmlentities($clients_final[$key][$k]);
            if ($v === "" || in_array($k, array(
                //"time_logon",
                "rating",
                "protrevision",
                "server",
                "planned_revision",
                "atis_message",
                "planned_actdeptime"
            ))) {
                unset($clients_final[$key][$k]);
            }
        }
    }
    
    if (!count($clients_final)) {
        echo ("count(clients_final) = 0 ($url)" . PHP_EOL);
        return false;
    }
	
	//get planned_depairport_lat, planned_depairport_lon, planned_destairport_lat, planned_destairport_lon values from the database
	$airports = new Airports();
	foreach($clients_final as $k => $v){
		$dep = false;
		$dest = false;
		if(array_key_exists("planned_depairport", $v) && strlen($v["planned_depairport"]) > 0){
			$dep = $airports -> getAirportDetails($v["planned_depairport"]);
		}
		if(array_key_exists("planned_destairport", $v) && strlen($v["planned_destairport"]) > 0){
			$dest= $airports -> getAirportDetails($v["planned_destairport"]);
		}
		if($dep){
			$clients_final[$k]["planned_depairport_lat"] = $dep[6];
			$clients_final[$k]["planned_depairport_lon"] = $dep[7];	
		}
		if($dest){
			$clients_final[$k]["planned_destairport_lat"] = $dest[6];
			$clients_final[$k]["planned_destairport_lon"] = $dest[7];
		}
	}
    
    $result_json = json_encode($clients_final);
    
    if (!$result_json) {
        echo ("json_encode fails ($url)" . PHP_EOL);
        return false;
    }
	$m = new Memcache;
	$m->connect(MEMCACHE_IP, MEMCACHE_PORT);
	
	$prev_data = $m->get("vatmap_clients_data");
	if($prev_data){
		if(md5($result_json) == $prev_data["vatmap_clients_json_md5"]){
			$m->close();
			return true;
		}
	}
	
	$m->set("vatmap_clients_data", array(
    'vatmap_clients_json' => $result_json,
    'vatmap_clients_json_md5' => md5($result_json),
    'vatmap_clients_json_last_modified' => time()));
	$m->close();
    return true;
}

$serversArray = loadServersArray();

if(count($serversArray) <= 0){
	echo ("loadServersArray() fails!" . PHP_EOL);
}
else{
	$arUrl = $serversArray;
}
shuffle($arUrl);

foreach ($arUrl as $url) {
    if (trytoparse($url)) {
        break;
    }
}

exit(0);

?>
