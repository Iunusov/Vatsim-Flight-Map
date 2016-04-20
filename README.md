# Vatsim Flight Map
Vatsim aircrafts and ATC on Google Maps.

<h1>INSTALLATION</h1>

1) run <b>/generators/plane_angles/generate.php</b> from command-line (it will make necessary images)

2) add <b>/parse.php</b> script call to crontab (this script downloads data from vatsim servers and makes clients.json file)

3) add <b>/get_servers.php</b> script call to crontab (probably daily), in order to get vatsim servers list

<img src="http://vatmap.jsound.org/img/vatmap.png">
