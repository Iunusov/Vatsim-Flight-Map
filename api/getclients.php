<?php
require ('utils.php');

$timestamp = 0;
$json = getClientsFromMemcache($timestamp);
writeHttpContent($timestamp, $json);

?>
