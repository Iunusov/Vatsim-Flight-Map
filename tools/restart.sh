sudo service nginx stop
sudo service memcached restart
cd ../vatsim_parser
./parse.php
sudo service nginx start
