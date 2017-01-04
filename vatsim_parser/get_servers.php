#!/usr/bin/php
<?php
	php_sapi_name() == "cli" or die("<br><strong>This script is not intended to be runned from web.</strong>" . PHP_EOL);
	$statusURL = "http://status.vatsim.net/";
	
	preg_match_all("/url0=(.*)\r/", file_get_contents($statusURL), $servers);
	file_put_contents("./vatsim_servers.json", json_encode($servers[1]) . PHP_EOL, LOCK_EX);
?>
