<?php

//http://openflights.org/data.html
define("AIRPORTS_DB_FILENAME", "airports.dat");

class Airports
{
    private $f;
    private $arr;
    function __construct()
    {
        $this->f = fopen(AIRPORTS_DB_FILENAME, "r");
        while ($row = fgetcsv($this->f)) {
            $this->arr[$row[5]]    = $row;
            $this->arr[$row[4]]    = &$this->arr[$row[5]];
        }
		fclose($this->f);
    }
            
    public function getAirportDetails($code)
    {
		if(!array_key_exists(strtoupper($code), $this->arr)){
			return false;
		}
        return $this->arr[$code];
    }
}

?>
