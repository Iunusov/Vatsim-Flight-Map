<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Vatsim Flight Map</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Vatsim aircrafts and ATC on google maps.">
<meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
<link rel="shortcut icon" href="favicon.ico"/>
<link rel="icon" href="favicon.ico"/>
<link href="/css/libs/bootstrap.min.css" rel="stylesheet">
<style type="text/css">
  html { height: 100% }
  body { height: 100%; margin: 0; padding: 0; padding-top: 40px; }
  #map_canvas { height: 100% }
  .info{
  font-size:small;
height:200px;
width: 200px;
overflow-x:hidden;
}
</style>
<link href="/css/libs/bootstrap-responsive.min.css" rel="stylesheet">
<style type="text/css">
  .navbar-fixed-top {
margin-bottom: 0px;
}
</style>
</head>
<body>
 <div class="navbar navbar-inverse navbar-fixed-top">
      <div class="navbar-inner">
        <div class="container">
          <button type="button" class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <div class="nav-collapse collapse">
            <ul class="nav">
              <li class="active"><a href="/">Home</a></li>
			  <li><a href="#" id="showTopAirports">Popular airports</a></li>
            </ul>
			 <div class="navbar-form pull-right">
              <input id="search" class="span2" type="text" onkeydown="if(event.keyCode == 13) $('#cssearch').click();">
              <input id="cssearch" type="button" class="btn" value="Search callsign">
            </div>
          </div>
        </div>
      </div>
    </div>
  <div id="map_canvas" style="width:100%; height:100%">
  </div>
  <script type="text/javascript" src="//maps.googleapis.com/maps/api/js?key=AIzaSyA9zHzTYMK-qrIeDaC-DBdWab3UsN1UBFE&amp;sensor=true"></script>
 <script src="/js/libs/jquery-1.11.2.min.js"></script>
  <script src="/js/libs/bootstrap.min.js"></script>
  <script type="text/javascript" src="/js/app.js?<?=md5_file('js/app.js');?>"></script>
  <!-- Start of StatCounter Code for Default Guide -->
<script type="text/javascript">
var sc_project=10266561; 
var sc_invisible=1; 
var sc_security="ccb0c03c"; 
var scJsHost = (("https:" == document.location.protocol) ?
"https://secure." : "http://www.");
document.write("<sc"+"ript type='text/javascript' src='" +
scJsHost+
"statcounter.com/counter/counter.js'></"+"script>");
</script>
<noscript><div class="statcounter"><a title="web analytics"
href="http://statcounter.com/" target="_blank"><img
class="statcounter"
src="http://c.statcounter.com/10266561/0/ccb0c03c/1/"
alt="web analytics"></a></div></noscript>
<!-- End of StatCounter Code for Default Guide -->
</body>
</html>