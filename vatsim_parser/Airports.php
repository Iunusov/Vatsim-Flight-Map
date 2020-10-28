<?php
//http://openflights.org/data.html
define("AIRPORTS_DB_FILENAME", "airports-extended.dat");

class Airports
{
    private $arr = array();
    function __construct()
    {
        $csv = fopen(AIRPORTS_DB_FILENAME, "r");
        while ($row = fgetcsv($csv))
        {
            $iata = strtoupper($row[4]);
            $icao = strtoupper($row[5]);
            $this->arr[$iata] = $row;
            $this->arr[$icao] = &$this->arr[$iata];
        }
        fclose($csv);
    }

    public function getAirportDetails($code)
    {
        $key = strtoupper($code);
        if (!array_key_exists($key, $this->arr))
        {
            return false;
        }
        return $this->arr[$key];
    }
}

?>
