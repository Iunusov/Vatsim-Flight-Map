[![Build Status](https://travis-ci.org/Iunusov/Vatsim-Flight-Map.svg?branch=master)](https://travis-ci.org/Iunusov/Vatsim-Flight-Map)

# Vatsim Flight Map
[Vatsim](https://wikipedia.org/wiki/VATSIM) aircrafts and ATC on Google Maps.

![Vatsim Flight Map](https://raw.githubusercontent.com/Iunusov/Vatsim-Flight-Map/master/img/mobileview.png "Vatsim Flight Map")

## Used tools
[Memcache](http://php.net/manual/ru/book.memcache.php)

[Webpack](https://webpack.github.io/docs/tutorials/getting-started/)

## Prerequisites: Frontend
```
sudo apt-get update
```

```
sudo apt-get install nodejs npm
```

```
sudo ln -s /usr/bin/nodejs /usr/bin/node
```

```
sudo npm install webpack -g
```

## Clonning a repo

```
git clone https://github.com/Iunusov/Vatsim-Flight-Map
cd Vatsim-Flight-Map
```

(optional) do not track prod.js file changes in git:

```
git update-index --assume-unchanged prod.js
```

## Build

```
npm install
webpack
```

production build (with optimizations and minifications):

```
webpack -p
```

## Prerequisites: Backend

The following guide is for Ubuntu 16.04.

Install the required packages:
```
sudo apt-get install nginx php-fpm memcached php-memcache php7.0-xml php-mbstring
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

Parse some data (for testing):
```
cd vatsim_parser
./get_servers.php
./parse.php
```

You probably might want to add these scripts to crontab:
```
*/2 * * * * cd /<path_to_your_site>/vatsim_parser; ./parse.php >> <logfile_name> 2>&1

* */6 * * * cd /<path_to_your_site>/vatsim_parser; ./get_servers.php >> <logfile_name> 2>&1
```
**parse.php** is for parsing Vatsim data

**get_servers.php** is for parsing Vatsim servers list (can be runned daily)

Request API key for Google Maps:
https://developers.google.com/maps/documentation/javascript/get-api-key

after that, add your api key to the [prod.js](https://github.com/Iunusov/Vatsim-Flight-Map/blob/master/prod.js) file.

Open url in your browser:

[localhost/Vatsim-Flight-Map](http://localhost/Vatsim-Flight-Map)

## License

MIT License

## Demo

https://vatmap.jsound.org/

