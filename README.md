[![Build Status](https://travis-ci.org/Iunusov/Vatsim-Flight-Map.svg?branch=master)](https://travis-ci.org/Iunusov/Vatsim-Flight-Map)

# Vatsim Flight Map
[Vatsim](https://wikipedia.org/wiki/VATSIM) aircrafts and ATC on Mapbox.

![Vatsim Flight Map](https://raw.githubusercontent.com/Iunusov/Vatsim-Flight-Map/master/img/mobileview.png "Vatsim Flight Map")

## Used tools
[Memcache](http://php.net/manual/ru/book.memcache.php)

[Webpack](https://webpack.github.io/docs/tutorials/getting-started/)

## Prerequisites: Frontend

    $ sudo apt-get update
	$ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	$ sudo apt-get install -y nodejs
	$ sudo npm install webpack-cli -g
    $ sudo npm install webpack -g

## Clonning a repo

    $ git clone https://github.com/Iunusov/Vatsim-Flight-Map
    $ cd Vatsim-Flight-Map

(optional) do not track prod.js file changes in git:

    $ git update-index --assume-unchanged prod.js

## Build

Request API key for maps:
https://docs.mapbox.com/help/glossary/access-token/

after that, add your api key to the [prod.js](https://github.com/Iunusov/Vatsim-Flight-Map/blob/master/prod.js) file.

Now you can perform the build:

    $ npm install
    $ webpack

production build (with optimizations and minifications):

    $ webpack -p

## Prerequisites: Backend

The following guide is for Ubuntu 16.04.

Install the required packages:

    $ sudo apt-get install memcached nginx php-fpm php-cli php-xml php-memcache

Enable php support in nginx:

     $ sudo nano /etc/nginx/sites-available/default

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

    $ sudo service php7.0-fpm restart
    $ sudo service nginx restart
    
    $ cd /var/www/html
    $ sudo chmod 757 .

Parse some data (for testing):

    $ cd vatsim_parser
    $ ./get_servers.php
    $ ./parse.php

You probably might want to add these scripts to crontab:
```
*/2 * * * * cd /<path_to_your_site>/vatsim_parser; ./parse.php >> <logfile_name> 2>&1

0 */6 * * * cd /<path_to_your_site>/vatsim_parser; ./get_servers.php >> <logfile_name> 2>&1
```
**parse.php** is for parsing Vatsim data

**get_servers.php** is for parsing Vatsim servers list (can be runned daily)

Open url in your browser:

[localhost/Vatsim-Flight-Map](http://localhost/Vatsim-Flight-Map)

## License

MIT License

## Demo

https://vatmap.jsound.org/

## Stats (StatCounter)

[StatCounter](http://statcounter.com/p10266561/summary/?guest=1)



