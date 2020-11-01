<?php
require ('db.php');
require ('http.php');

http\write(db\getAll(empty($_GET['t']) ? "vatsim" : $_GET['t']));

?>
