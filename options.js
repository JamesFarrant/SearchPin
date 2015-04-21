var favicon = "http://grabicon.com/";

var targets = document.getElementsByClassName("search_target");
console.log(targets.length)
for(var i = 0; i < targets.length; i++) {
	var target = targets[i];

	var urlField = target.getElementsByClassName("url")[0];
	var icon = target.getElementsByClassName("icon")[0];

	var url = urlField.innerText.replace(/https?:\/\//i,'').split('/')[0];

	icon.style.backgroundImage = 'url('+favicon+url+')';
}

var image = document.createElement('img');
image.crossOrigin = '';
image.src = "http://grabicon.com/http://www.arstechnica.com"
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
canvas.width = 16
canvas.height = 16

document.body.appendChild(image)
document.body.appendChild(canvas)

function func() {
context.drawImage(image, 0, 0)
var r = 0, g = 0, b = 0;
for(var x = 0; x < 16; x++) {
	for(var y = 0; y < 16; y++) {
		var c = context.getImageData(x, y, 1, 1)
		r += c.data[0]
		g += c.data[1]
		b += c.data[2]
	}
}

console.log(g)
}