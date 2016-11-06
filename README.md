# Vatsim Flight Map
[Vatsim](https://wikipedia.org/wiki/VATSIM) aircrafts and ATC on Google Maps.

![Vatsim Flight Map](http://jsound.org/img/vatmap.png "Vatsim Flight Map")

![Vatsim Flight Map (Mobile)](http://jsound.org/img/vatmap_mobile.jpg "Vatsim Flight Map (Mobile)")

## Dependencies
[PHP-GD](http://php.net/manual/ru/book.image.php)

[Memcache](http://php.net/manual/ru/book.memcache.php)

[Bower](https://bower.io/)

## Installation

The following guide is for Ubuntu 16.04.

Install the required packages:
```
sudo apt-get update
```

```
sudo apt-get install nginx php-fpm memcached php-memcache php-gd  nodejs npm
```

```
sudo ln -s /usr/bin/nodejs /usr/bin/node
```

install bower:
```
sudo npm install bower -g
```

Enable php support in nginx:
```
sudo nano /etc/nginx/sites-available/default
```

```
location ~ \.php$ {
                #If a file isn’t found, 404
                try_files $uri =404;
                #Include Nginx’s fastcgi configuration
                include /etc/nginx/fastcgi.conf;
                #Look for the FastCGI Process Manager at this location
                fastcgi_pass unix:/run/php/php7.0-fpm.sock;
        }
```

Restart the services:
```
sudo service php7.0-fpm restart
sudo service nginx restart
```

```
cd /var/www/html
sudo chmod 757 .
```

```
git clone https://github.com/Iunusov/Vatsim-Flight-Map
cd Vatsim-Flight-Map
```

Install javascript dependencies:
```
bower install
```

Parse some data (for testing):
```
cd vatsim_parser
./get_servers.php
./parse.php
```

Generate plane images:
```
cd ../generators/plane_angles
./generate.php
```

You probably might want to add these scripts to crontab:
```
*/2 * * * * cd /<path_to_your_site>/vatsim_parser; ./parse.php >> <logfile_name> 2>&1

* */6 * * * cd /<path_to_your_site>/vatsim_parser; ./get_servers.php >> <logfile_name> 2>&1
```
**parse.php** is for parsing Vatsim data

**get_servers.php** is for parsing Vatsim servers list (can be runned daily)

Request API key for Google Maps:
https://developers.google.com/maps/documentation/javascript/get-api-key (and edit index.html accordingly)

otherwise, you will get the MissingKeyMapError

Open url in your browser:
```
http://localhost/Vatsim-Flight-Map
```

## License

MIT License

## Demo

https://vatmap.jsound.org/

