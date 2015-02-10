var cImageTimeout=false;
var cIndex=0;
var cXpos=0;
var cPreloaderTimeout=false;
var SECONDS_BETWEEN_FRAMES=0;

function startAnimation(){
	
	//FPS = Math.round(100/(maxSpeed+2-speed));
	FPS = Math.round(100/10); //speed 10
	SECONDS_BETWEEN_FRAMES = 1 / FPS;
	
	cPreloaderTimeout=setTimeout('continueAnimation()', SECONDS_BETWEEN_FRAMES/1000);
	
}

function continueAnimation(){
	
	cXpos += 128; //frame width
	//increase the index so we know which frame of our animation we are currently on
	cIndex += 1;
	 
	//if our cIndex is higher than our total number of frames, we're at the end and should restart
	if (cIndex >= 12) {
		cXpos =0;
		cIndex=0;
	}
	
	if(document.getElementById('loaderImage'))
		document.getElementById('loaderImage').style.backgroundPosition=(-cXpos)+'px 0';
	
	cPreloaderTimeout=setTimeout('continueAnimation()', SECONDS_BETWEEN_FRAMES*1000);
}

function stopAnimation() {//stops animation
	clearTimeout(cPreloaderTimeout);
	cPreloaderTimeout=false;
}

function imageLoader(fun)//Pre-loads the sprites image
{
	clearTimeout(cImageTimeout);
	cImageTimeout=0;
	genImage = new Image();
	genImage.onload=function (){cImageTimeout=setTimeout(fun, 0)};
	genImage.onerror=new Function('alert(\'Could not load the image\')');
	genImage.src = 'images/preloaderSprite.png';
}

//The following code starts the animation
new imageLoader('startAnimation()');