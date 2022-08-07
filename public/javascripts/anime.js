function getYear(){
	var year = new Date();
	document.getElementById("year").innerHTML = year.getFullYear();	
}

$('.file-upload').file_upload();