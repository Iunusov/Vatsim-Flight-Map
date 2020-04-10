<?php

header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header('Pragma: no-cache');
header('Expires: 0');

function formatBytes($size, $precision = 2)
{
    if ($size == 0)
    {
        return 0;
    }
    $base = log($size, 1024);
    $suffixes = array(
        '',
        'K',
        'M',
        'G',
        'T'
    );
    return round(pow(1024, $base - floor($base)) , $precision) . ' ' . $suffixes[floor($base) ];
}

$memcache = new Memcache();
$memcache->connect('localhost', 11211);
?>

<html>
<head>
<meta http-equiv="refresh" content="1">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no" />
<meta name="mobile-web-app-capable" content="yes">

<style>
  table, th, td {
  padding: 10px;
  border: 1px solid black; 
  border-collapse: collapse;
}
</style>

</head>
<body>
<table>

<?php
$stats = $memcache->getStats();
foreach ($stats as $key => $val)
{
    if (!in_array(strtoupper($key) , array(
        "VERSION",
        "UPTIME",
        "GET_HITS",
        "GET_MISSES",
        "CMD_GET",
        "CMD_SET",
        "BYTES",
        "CURR_ITEMS",
        "MAX_CONNECTIONS",
        "BYTES_READ",
        "BYTES_WRITTEN"
    )))
    {
        continue;
    }
    if (in_array(strtoupper($key) , array(
        "BYTES",
        "BYTES_READ",
        "BYTES_WRITTEN"
    )))
    {
        $val = formatBytes($val);
    }
    $key = strtoupper("<strong>$key</strong>");
    echo "<tr><td>$key</td><td>$val</td></tr>";
}
?>

</table>
</body>
</html>
