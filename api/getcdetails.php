<?php
require ('db.php');
require ('http.php');

http\write(db\getDetails(empty($_GET['t']) ? "vatsim" : $_GET['t'], $_GET['cid'], $_GET['callsign']));

?>
