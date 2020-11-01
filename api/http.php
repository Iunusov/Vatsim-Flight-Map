<?php
namespace http;

require_once ('../config.php');

function write404($error = '{"error": "not found"}')
{
    http_response_code(404);
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T'));
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + CACHE_LIFETIME_SECONDS));
    header('Content-type: application/json');
    header('Content-length: ' . strlen($error));
    die($error);
}

function write($json)
{
    if (!strlen($json)) write404();
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s \G\M\T'));
    header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + CACHE_LIFETIME_SECONDS));
    header('Content-type: application/json');
    header('Content-length: ' . strlen($json));
    die($json);
}

?>
