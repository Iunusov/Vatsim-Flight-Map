<?php
$arUrl = array("http://www.pcflyer.net/DataFeed/vatsim-data.txt", "http://fsproshop.com/servinfo/vatsim-data.txt", "http://info.vroute.net/vatsim-data.txt", "http://data.vattastic.com/vatsim-data.txt", "http://vatsim.aircharts.org/vatsim-data.txt");

$data = NULL;

shuffle($arUrl);
foreach($arUrl as $url){
  $data = @file_get_contents($url);
  if($data) break;
}
if($data){

preg_match("/!CLIENTS:(.*)".PHP_EOL.";".PHP_EOL.";".PHP_EOL."!SERVERS:/s", $data, $clients);

preg_match_all("/(.*):".PHP_EOL."/", $clients[1], $clients); $clients = $clients[1];

preg_match("/!CLIENTS section -(.*):".PHP_EOL."; !PREFILE/", $data, $clients_tpl);

foreach($clients as $key => $item) {
  $clients[$key] = array_combine(explode(":",trim($clients_tpl[1])),explode(":",$item));
  foreach($clients[$key] as $k => $v){
    if($k=="atis_message") $clients[$key][$k] = htmlentities($clients[$key][$k],ENT_IGNORE);
    if($v===""||in_array($k,array("time_logon","rating","protrevision","QNH_Mb","QNH_iHg","planned_destairport_lon","planned_destairport_lat","planned_depairport_lon","planned_depairport_lat","planned_minfuel","planned_minenroute","planned_actdeptime","planned_revision","server"))){
	  unset($clients[$key][$k]);
	}
  }
}
if(count($clients))
file_put_contents("./clients.json", gzencode(json_encode($clients),9));
}
?>