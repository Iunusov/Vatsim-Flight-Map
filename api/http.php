<?php
namespace http;

require_once ('../config.php');

function write($json)
{
    if (empty($json))
    {
        http_response_code(404);
        $json = '{"error": "not found"}';
    }
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T'));
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + CACHE_LIFETIME_SECONDS));
    header("Pragma: cache");
    header("Cache-Control: max-age=" . CACHE_LIFETIME_SECONDS);
    header('Content-type: application/json');
    header('Content-length: ' . strlen($json));
    die($json);
}

?>
