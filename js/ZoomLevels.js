/**
* Class for create the zoom level options
**/
var ZoomLevels = new Class({
	Implements: [Events, Options],
	//class options, set by the constructer or left default
	options: {
		zoom: 1.0,
		pinchZoomInterval: 500
	},
	
	initialize: function(options){
		this.setOptions(options);
		
		// zoom image
		var zoomSpriteMaterial = new THREE.SpriteMaterial( { map: THREE.ImageUtils.loadTexture( 'images/zoomSymbol.png'), useScreenCoordinates: true, color: 0xffffff });
		var zoomSprite = new THREE.Sprite( zoomSpriteMaterial );
		zoomSprite.position.set( 30, window.innerHeight - 30, 0 );
		zoomSprite.scale.set( 36, 32, 1.0 ); // imageWidth, imageHeight
		scene.add( zoomSprite );
		this.zoomSprite = zoomSprite;
		
		//zoom text sprite
		this.textMaterial = new THREE.SpriteMaterial( { useScreenCoordinates: true, color: 0xffffff } );
		this.textMaterial.transparent = true;
		var textSprite = new THREE.Sprite( this.textMaterial );
		textSprite.position.set( 130, window.innerHeight + 10, 0 );
		textSprite.scale.set( 140, 100, 1.0 ); // imageWidth, imageHeight
		scene.add( textSprite );
		
		//this.setZoom(this.options.zoom);
		this._newZoom = 1.0;
		this._previousZoomTranslate = 0;
		
		//mousewheel
		var mousewheelevt=(/Firefox/i.test(navigator.userAgent))? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x
		
		//if IE (and Opera depending on user setting)
		if (document.attachEvent) document.attachEvent("on"+mousewheelevt, this.captureMousewheel.bind(this));
		//W3C browsers
		else if (document.addEventListener) document.addEventListener(mousewheelevt, this.captureMousewheel.bind(this), false);
		
		//pinch
		gm.addGestureRecognizer(new GM.GR_PinchZoom( this.capturePinch.bind(this), this.endPinch.bind(this) ));
	}, 
	
	setZoom: function(zoom) {
	
		if (zoom < 0.05 || zoom > 50) return;
	
		var canvas1 = document.createElement('canvas');
		var context1 = canvas1.getContext('2d');
		context1.font = "Bold 20px Arial";
		context1.fillStyle = "rgba(255,255,255,0.95)";
		context1.fillText("Zoom: " + Math.round(zoom*100) + "%", 0, 20);
		
		this.spriteTexture = new THREE.Texture(canvas1);
		this.spriteTexture.needsUpdate = true;
		
		this.textMaterial.map = this.spriteTexture;
		
		var zoomFactor = zoom / this.options.zoom;
		
		focusedArtCluster.pointShaderMaterial.uniforms.zoom.value *= zoomFactor;
		//focusedArtCluster.pointShaderMaterial.uniforms.zoom.needsUpdate = true;
		
		//update controls speed
		updateCameraMovementSpeed();
		
		this.options.zoom = zoom;
	},
	
	// MOUSE WHEEL
	captureMousewheel: function(e) {
		if (controls.enabled) {
			var evt = window.event || e; //equalize event object
			var delta = evt.detail? evt.detail*(-120) : evt.wheelDelta; //check for detail first so Opera uses that instead of wheelDelta
			// Mousewheel UP 
			if (delta > 0){
				//zoom in
				this.setZoom(this.options.zoom * 1.1);
			}
			
			// Mousewheel DOWN
			else if (delta < 0){
				//zoom out
				this.setZoom(this.options.zoom * 0.9);
			}
		}
	},
	
	_pinchDelayInterval: undefined,
	_pinchDirection: 0,
	capturePinch: function(data) {
		this._lastPinchTranslate = data.translate.x;
		var pinchDir = data.scale > 1.0 ? 1 : -1;
		if (pinchDir - this._pinchDirection != 0) {
			//direction changed! Execute the rest of the previous movement, then start new one
			this._intervalFunc();
			this._pinchDirection = pinchDir
			console.log('change!');
			//this.zoomSprite.scale.multiplyScalar(10);
			clearInterval(this._pinchDelayInterval);
			this._isZoomOut = 0;
			this._pinchDelayInterval = undefined;
		}
		this._isZoomOut += pinchDir;
		
		if (this._pinchDelayInterval == undefined) {
			this._pinchDelayInterval = setInterval(this._intervalFunc.bind(this), this.options.pinchZoomInterval);
		}
	},
	
	_intervalFunc: function() {
		//this.setZoom(this._newZoom);
		var pinchTranslation = this._lastPinchTranslate - this._previousZoomTranslate,
			zoomModifier = Math.abs((Math.abs(pinchTranslation) + 100) / 100);
		//invert zoomModifier to be below 1 for zooming out
		//if (pinchTranslation < 0) zoomModifier = 1 / zoomModifier;  UNRELIABLE
		if (this._isZoomOut < 0) zoomModifier = 1 / zoomModifier;
		console.log(this._isZoomOut);
		this._isZoomOut = 0;
		this.setZoom(this.options.zoom * zoomModifier)
		this._previousZoomTranslate = this._lastPinchTranslate;
	},
	
	endPinch: function() {
		clearInterval(this._pinchDelayInterval);
		this._isZoomOut = 0;
		this._pinchDelayInterval = undefined;
		this._previousZoomTranslate = 0;
	}
});