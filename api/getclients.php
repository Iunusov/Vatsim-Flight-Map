<?php
require ('db.php');
require ('http.php');

http\write(db\getAll());

?>
