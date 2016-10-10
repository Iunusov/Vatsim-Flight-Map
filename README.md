# Vatsim Flight Map
[Vatsim](https://wikipedia.org/wiki/VATSIM) aircrafts and ATC on Google Maps.

<a href="//vatmap.jsound.org/">
<img src="http://jsound.org/img/vatmap.png" alt="Vatsim Flight Map" height="506" width="856">
</a>

#Dependencies
[PHP-GD](http://php.net/manual/ru/book.image.php)

[Memcache](http://php.net/manual/ru/book.memcache.php)

[Bower](https://bower.io/)

#installation

1) run <b>/generators/plane_angles/generate.php</b> from command-line (it will make necessary images)

2) add <b>/vatsim_parser/parse.php</b> script call to crontab, this script downloads data from vatsim (every 2 min)

3) add <b>/vatsim_parser/get_servers.php</b> script call to crontab (probably daily), in order to get vatsim servers list

4) Install JavaScript dependencies:
```
bower install
```
