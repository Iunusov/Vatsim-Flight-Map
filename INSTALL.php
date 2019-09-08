<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<title>Installation checker</title>
</head>
<body>
<pre>
<?php
include ("./config.php");

echo "<h1>1) PHP-Memcache: </h1>";
if(class_exists("Memcache")){
	echo '<font color="green" style="font-size: x-large">exists</font>';
}
else{
	echo '<font color="red" style="font-size: x-large">not exists</font> (install: <a href="http://php.net/manual/ru/memcache.installation.php">http://php.net/manual/ru/memcache.installation.php</a>)';
}
echo "\n";

echo "<h1>2) Memcached connection: </h1>";
if(class_exists("Memcache") && (new Memcache)->connect(MEMCACHE_IP, MEMCACHE_PORT)){
	echo '<font color="green" style="font-size: x-large">success</font>';
}
else{
	echo '<font color="red" style="font-size: x-large">fail</font> (Please install memcached. Also check <strong>MEMCACHE_IP</strong> and <strong<MEMCACHE_PORT</strong> in <strong>vatsim_parser/config.php</strong>)';
}
echo "\n";
?>
</pre></body>
</html>
