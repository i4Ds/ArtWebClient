var NavigationCircle = new Class({
	Implements: [Events, Options],
	
	options: {
		segments: [,,,,,,,,]
	},
			
	navigationMeshContainer: undefined,
	previouslyHovered: undefined,
	
	initialize: function(options) {
		this.setOptions(options);
		
		// load navigation model
		this.navigationMeshContainer = new THREE.Object3D();
		var loader = new THREE.JSONLoader();
		loader.load("pieceOfCake.js", function(geometry) {
			var material = new THREE.MeshLambertMaterial({ color: 0xFE8001, shading: THREE.SmoothShading, overdraw: true  });
			material.receiveShadow = true;
			var hoverMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDD00, shading: THREE.SmoothShading, overdraw: true  });
			
			var cakeMesh = [];
			cakeMesh[0] = new THREE.Mesh(geometry, material);
			cakeMesh[0].visible = false;
			
			var self = this;;
			
			var rotation = 0;
			for (var pos = 0; pos < 8; pos++) {
				if (pos != 0) cakeMesh[pos] = cakeMesh[0].clone();
				cakeMesh[pos].rotation.y = rotation;
				cakeMesh[pos].index = pos;
				
				cakeMesh[pos].hover = function() {
					if (self.previouslyHovered) self.previouslyHovered.resetHover();
					this.material = hoverMaterial;
					self.previouslyHovered = this;
				}.bind(cakeMesh[pos]);
				
				cakeMesh[pos].resetHover = function() {
					this.material = material;
				}.bind(cakeMesh[pos]);
				
				this.navigationMeshContainer.add(cakeMesh[pos]);
				rotation += Math.PI / 4;
			};
			
			this.resetHover = function() {
				if (this.previouslyHovered) {
					this.previouslyHovered.resetHover();
					this.previouslyHovered = undefined;
				}				
			};
			
			this.navigationMeshContainer.scale.multiplyScalar(5 * (window.innerWidth < 700 ? 2 : 1));
			var light = new THREE.PointLight( 0xffffff, 1, 100 );
			light.position.set( 0.2, 4, 0.2 );
			light.intensity = 2.1;
			light.visible = false;
			this.navigationMeshContainer.add( light );
			this.navigationMeshContainer.position = controls.getObject().position.clone();
			scene.add(this.navigationMeshContainer);
			
			this.fireEvent('load', this);
		}.bind(this));
	},
	
	show: function() {
		navigationInUse = true;
		
		if (Detector.istouchenabled) controls.enabled = false;
		
		this.navigationMeshContainer.traverse( function ( object ) { object.visible = true; } );
		var yawObject = controls.getObject();
		var pitchObject = yawObject.children[0];
		this.navigationMeshContainer.position = yawObject.position.clone();
		
		this.navigationMeshContainer.position = (new THREE.Vector3(0, 0, -20)).applyMatrix4( camera.matrixWorld );
		this.navigationMeshContainer.rotation.order = "YXZ";
		this.navigationMeshContainer.rotation.y = yawObject.rotation.y;
		this.navigationMeshContainer.rotation.x = pitchObject.rotation.x + 1.0;
	},
	hide: function(noSelect) {
		navigationInUse = false;
		this.navigationMeshContainer.traverse( function ( object ) { object.visible = false; } );
		mouse2D = new THREE.Vector3(0, 0, 0);
		
		if (Detector.istouchenabled) controls.enabled = true;
		
		if (!noSelect) {
			if (this.previouslyHovered) this.options.segments[this.previouslyHovered.index].callback();
		}
	},
	/* adds a new menu segment. If none is available returns false */
	add: function(imageUrl, spriteScale, callback) {
	
		var index = 0;
		while (this.options.segments[index] != undefined && index < 8) {
			index++;
		}
		
		if (index == 8) return false;
		
		var spriteMat = new THREE.SpriteMaterial({
			map: THREE.ImageUtils.loadTexture( imageUrl), 
			useScreenCoordinates: false, 
			color: 0xffffff
		});
		spriteMat.transparent = true;
		
		var menuSprite = new THREE.Sprite( spriteMat );
		menuSprite.scale.set( spriteScale.x, spriteScale.y, 1.0 ); // imageWidth, imageHeight
		menuSprite.position.set(-0.4, 0.6, -0.9);
		menuSprite.visible = false;
		
		this.navigationMeshContainer.children[index].add(menuSprite);
		this.options.segments[index] = {menuSprite: menuSprite, callback: callback};
		
		return true;
	}
});