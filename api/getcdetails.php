<?php
require ('db.php');
require ('http.php');

http\write(db\getDetails($_GET['cid'], $_GET['callsign']));

?>
