#!/usr/bin/php
<?php
	php_sapi_name() == "cli" or die("<br><strong>This script is not intended to be runned from web.</strong>" . PHP_EOL);
	$statusURL = "http://status.vatsim.net/";
	
	$content = str_replace("\r\n", "\n", file_get_contents($statusURL));
	
	$servers = false;
	
	preg_match_all("/url0=(.*)/", $content, $servers);
	
	if(count(json_decode(json_encode($servers[1]), true)) <= 0){
		error_log("can't get servers list from $statusURL");
		die();
	}
	
	file_put_contents("./vatsim_servers.json", json_encode($servers[1]) . PHP_EOL, LOCK_EX);
?>
