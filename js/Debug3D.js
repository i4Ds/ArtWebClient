/**
* Class for creating a webgl debug output
**/
var Debug3D = new Class({
	Implements: [],
	//class options, set by the constructer or left default
	
	initialize: function(){
		//zoom text sprite
		this.textMaterial = new THREE.SpriteMaterial( { useScreenCoordinates: true, color: 0xffffff } );
		this.textMaterial.transparent = true;
		var textSprite = new THREE.Sprite( this.textMaterial );
		textSprite.position.set( 130, 100, 0 );
		textSprite.scale.set( 140, 100, 1.0 ); // imageWidth, imageHeight
		scene.add( textSprite );
		
	}, 
	
	setText: function(text) {
		var canvas1 = document.createElement('canvas');
		var context1 = canvas1.getContext('2d');
		context1.font = "Bold 20px Arial";
		context1.fillStyle = "rgba(255,255,255,0.95)";
		context1.fillText(text, 0, 20);
		
		this.spriteTexture = new THREE.Texture(canvas1);
		this.spriteTexture.needsUpdate = true;
		
		this.textMaterial.map = this.spriteTexture;
	}
});