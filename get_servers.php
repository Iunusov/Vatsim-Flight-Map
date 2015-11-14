#!/usr/local/bin/php-cli
<?php
	$statusURL = "http://status.vatsim.net/";
	
	preg_match_all("/url0=(.*)\r/", file_get_contents($statusURL), $servers);
	file_put_contents("./vatsim_servers.json", json_encode($servers[1]), LOCK_EX);
?>
