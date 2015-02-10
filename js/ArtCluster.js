/**
* Class for creating an artwork cluster in space
**/
var ArtCluster = new Class({
	Implements: [Events, Options],
	
	//class options, set by the constructer or left default
	options: {
		amountDisplayed: 2000, /* How many artworks should be displayed with this cluster? */
		artBorderSprite: -1,
		amountOfImagesLoaded: 100,
		maxDistanceSquared: 100
	},
	
	index: -1,
	artBorderSprite: -1, //yellow border for image selection
	
	initialize: function(options){
		this.setOptions(options);
		
		//register cluster in the art cluster list
		/*this.index = artClusters.length;
		artClusters.push(this);*/
		THREE.ImageUtils.crossOrigin = 'anonymous';
		
		//create the 3D object container for the planes etc.
		this.object3D = new THREE.Object3D();
		
		
		this.options.artBorderSprite = new THREE.Sprite( ArtCluster.artBorderSpriteMaterial );
		this.options.artBorderSprite.position.x = -1000000;
		//this.options.artBorderSprite.visible = this.index == 0;
		this.object3D.add(this.options.artBorderSprite);
		
		/*var imagePreviewTexture = THREE.ImageUtils.loadTexture( documentRootPath + 'Spektrogramme/spectrogram16px.jpg', new THREE.UVMapping(), function() {
			arguments[0].flipY = false;
		});
		imagePreviewTexture.minFilter = THREE.LinearMipMapLinearFilter;
		imagePreviewTexture.magFilter = THREE.LinearFilter;*/
		
		
		var textureAtlasHighdef = THREE.ImageUtils.loadTexture('atlas/textureAtlas.jpg', new THREE.UVMapping(), function() {
			arguments[0].flipY = false;
		}.bind(this));
		textureAtlasHighdef.minFilter = THREE.LinearMipMapLinearFilter;
		textureAtlasHighdef.magFilter = THREE.LinearFilter;
		this._textureAtlasHighdef = textureAtlasHighdef;
		this._textureAtlasSpots = [];
		
		var textureAtlasIcons = THREE.ImageUtils.loadTexture(documentRootPath + '/campartex/services/prod/images/textureAtlas', new THREE.UVMapping(), function() { //http://campartex.cs.technik.fhnw.ch:8080/campartex/services/prod/images/textureAtlas
			arguments[0].flipY = false;
		}.bind(this));
		
		
			
		// particle system material
		this.pointShaderMaterial = new THREE.ShaderMaterial( {
			uniforms:       {
								iconAtlas: { type: "t", value: textureAtlasIcons },
								atlas: { type: "t", value: textureAtlasHighdef },
								zoom: { type: 'f', value: 9.0 }
							},
			attributes:     {
								atlasIndex: { type: 'f', value: null }
							},
			vertexShader:   document.getElementById( 'vertexshader' ).textContent,
			fragmentShader: document.getElementById( 'fragmentshader' ).textContent
		});
		
		//distance function needed for the kd-tree wich the nearest neighbour search
		this.distanceFunction = function(a, b){
			return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2) +  Math.pow(a[2] - b[2], 2);
		};
		
		//array of the images currently loaded
		this._images = [];
		
		
		//axis lines
		lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
		lineGeometry.vertices.push(new THREE.Vector3(3000, 0, 0));
		lineGeometry.computeLineDistances();

		var line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({ color: 0xFF0000, lineWidth: 3, dashSize: 5, gapSize: 5 }));
		this.object3D.add(line);

		lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
		lineGeometry.vertices.push(new THREE.Vector3(0, 3000, 0));
		lineGeometry.computeLineDistances();

		var line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({ color: 0x00FF00, lineWidth: 3, dashSize: 5, gapSize: 5 }));
		this.object3D.add(line);

		lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
		lineGeometry.vertices.push(new THREE.Vector3(0, 0, 3000));
		lineGeometry.computeLineDistances();

		var line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({ color: 0x0000FF, lineWidth: 3, dashSize: 5, gapSize: 5 }));
		this.object3D.add(line);
		
		scene.add(this.object3D);
	},
	
	createKdTree: function() {
		this.kdtree = new THREE.TypedArrayUtils.Kdtree( this.positions, this.distanceFunction, 3, true );
		console.log(this.positions);
	},

	queryForImages: function(url) {
		
		//once done, interprete and store positions
		//this.particles.frustumCulled = true; TODO
		
		if (this.particles) {
			this._particleGeom.dispose();
			scene.remove(this.particles);
		}
		
		var oReq = new XMLHttpRequest();
		oReq.open("GET", url, true);
		oReq.responseType = "arraybuffer";
		console.log(url);

		oReq.onload = function (oEvent) {
			var arrayBuffer = oReq.response; // Note: not oReq.responseText
			if (arrayBuffer) {
				var byteArray = new Int32Array(arrayBuffer); //int array because of float imprecision and since the first is an ID
				console.log(byteArray);
				var l = byteArray.length,
					x = 0;
				this.options.amountDisplayed = byteArray.length / 5;
				
				this._particleGeom = new THREE.BufferGeometry();
				this._particleGeom.dynamic = true;
				this._particleGeom.attributes = {

					position: {
						itemSize: 3,
						array: new Float32Array( this.options.amountDisplayed * 3 )
					},
					
					atlasIndex: {
						itemSize: 1,
						array: new Float32Array( this.options.amountDisplayed ),
						dynamic: true
					}

				};
				this.positions = this._particleGeom.attributes.position.array;
				this.atlasIndexes = this._particleGeom.attributes.atlasIndex.array;
				
				//load icon texture atlases
				//this._loadIconTextureAtlases(Math.ceil(this.options.amountDisplayed / 65536));
				
				//array with metadata for each element, e.g. image id
				this._imageData = new Int32Array(this.options.amountDisplayed);
				
				for (var i = 0; i < l; i+=5) {
					x = i / 5;
					// ID, posX, posY, posZ, textureAtlasPos
					this._imageData[x] = byteArray[i];
					this.positions[ x * 3 + 0 ] = byteArray[i+1] / 100;
					this.positions[ x * 3 + 1 ] = byteArray[i+2] / 100;
					this.positions[ x * 3 + 2 ] = byteArray[i+3] / 100;
					this.atlasIndexes[x] = -byteArray[i+4] - 1; // negative: use icon. positive: use highres
				}
				
				measureStart = new Date().getTime();
				//takes a lot of time to execute. delayed execution results in an even greater performance hit, not recommended
				this.createKdTree();
				console.log('TIME building kdtree', new Date().getTime() - measureStart);
				
				//display particles AFTER the kd-tree was generated and the sorting of the positions-array is done
				
				this.particles = new THREE.ParticleSystem( this._particleGeom, 
					this.pointShaderMaterial
				);
				this.particles.dynamic = true;
				
				scene.add(this.particles);
				
				this._loaded = true;
			}
		}.bind(this);
		oReq.send(null);
	},
	
	_displayNearestStep: 0,
	_displayNearestSelectedImage: undefined,
	_displayNearestTemps: {}, //saving temporary variables for displayNearest since the function is subdivided
	displayNearest: function(position) {
		if (window.stopNN != undefined) return;
		if (this._displayNearestStep == 0) {
			
			//calculate the view frustum
			this._displayNearestTemps._frustum = new THREE.Frustum();
			var _projScreenMatrix = new THREE.Matrix4();
			camera.matrixWorldInverse.getInverse( camera.matrixWorld );

			_projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
			this._displayNearestTemps._frustum.setFromMatrix( _projScreenMatrix );
			
			this._displayNearestTemps.frustumCalculationPoint = new THREE.Vector3(0,0,0);
			this._displayNearestTemps.target = [position.x, position.y, position.z];
			
		} else if (this._displayNearestStep == 1) {
			//take the nearest 200 around camera, within view frustum. distance^2 because we use the manhattan distance, no square is applied in the distance function
			var self = this;
			this._displayNearestTemps.imagePositionsInRange = this.kdtree.nearest(
				self._displayNearestTemps.target, 
				this.options.amountOfImagesLoaded, this.options.maxDistanceSquared * zoomLevels.options.zoom,
				function(node) {
					self._displayNearestTemps.frustumCalculationPoint.x = node.obj[0];
					self._displayNearestTemps.frustumCalculationPoint.y = node.obj[1];
					self._displayNearestTemps.frustumCalculationPoint.z = node.obj[2];
					return self._displayNearestTemps._frustum.containsPoint(self._displayNearestTemps.frustumCalculationPoint);
				}
			);
			
		} else if (this._displayNearestStep == 2) {
			
			//set a flag for the images to detect those which aren't in fov anymore
			for (var x = 0; x < this._images.length; x++) {
				this._images[x].unchecked = true;
			}
			
			//sort is needed for selecting the frontmost image only
			this._displayNearestTemps.imagePositionsInRange.sort(function(a, b) {
				return a[1] - b[1];
			});
			
			this._displayNearestSelectedImage = undefined;
			for ( i = 0, il = this._displayNearestTemps.imagePositionsInRange.length; i < il; i ++ ) {
				var object = this._displayNearestTemps.imagePositionsInRange[i];
				var objectPoint = new THREE.Vector3(object[0].obj[0], object[0].obj[1], object[0].obj[2]);
				
					var img = undefined;
					//check if we already have an object
					for (var x = 0; x < this._images.length; x++) {
						if (this._images[x].position.equals(objectPoint)) {
							img = this._images[x];
							img.unchecked = false;
							break;
						}
					}
					
					var objectIndex = object[0].pos;
					//var objectUrl = documentRootPath + 'Spektrogramme/spectrogram' + this._imageData[objectIndex] + '.jpg';
					var objectUrl = documentRootPath + '/campartex/services/prod/images/'+this._imageData[objectIndex]+'/256';
					
					//only select this image if no other is selected
					var isSelected = this._displayNearestSelectedImage != undefined ? false : this.raytracePoint(objectPoint);
					if (!img) {
					
						var atlasIndex = this._findEmptyTextureAtlasSpot();
						if (atlasIndex != undefined) {
							
							var pos = this._images.length;
							this._images[pos] = {
								attribIndex: objectIndex,
								atlasIndex: atlasIndex,
								unchecked: false,
								position: objectPoint,
								isSelected: isSelected,
								oldAtlasIndex: this.atlasIndexes[ objectIndex ]
							};
							
							img = this._images[pos];
							
							this._loadAppropriateTexture(objectUrl, object[1], atlasIndex);
							
							this.atlasIndexes[ objectIndex ] = atlasIndex + (isSelected ? 256 : 0) + object.multiPosIndex * 1024;
							
							this._particleGeom.attributes.atlasIndex.needsUpdate = true;
							
						} else {
							console.error('No atlasindex found');
						}
					} else if (isSelected && !img.isSelected) {
						this.atlasIndexes[ objectIndex ] = img.atlasIndex + 256 + object.multiPosIndex * 1024;
						debugOutput.setText('X: ' + Math.round(img.position.x, 2) + ', Y: ' + Math.round(img.position.y, 2) + ', Z: ' + Math.round(img.position.z, 2));
							
						this._particleGeom.attributes.atlasIndex.needsUpdate = true;
						img.isSelected = true;
					} else if (!isSelected && img.isSelected) {
						this.atlasIndexes[ objectIndex ] = img.atlasIndex % 256;
							
						this._particleGeom.attributes.atlasIndex.needsUpdate = true;
						img.isSelected = false;
					}
					
					if (isSelected) this._displayNearestSelectedImage = img;
			}
			
		} else if (this._displayNearestStep == 3) {
			
			//remove the still unchecked images
			for (var x = 0; x < this._images.length; x++) {
				if (this._images[x].unchecked == true) {
					
					this.atlasIndexes[ this._images[x].attribIndex ] = this._images[x].oldAtlasIndex;
					this._particleGeom.attributes.atlasIndex.needsUpdate = true;
					this._textureAtlasSpots[this._images[x].atlasIndex] = false;
					
					this._images.splice(x, 1);
				}
			}
			
		}
		
		this._displayNearestStep = (this._displayNearestStep + 1) % 4;
	},
	
	_findEmptyImagePlane: function() {
		for (var x = 0; x < this._imagePlanes.length; x++) {
			if (!this._imagePlanes[x].visible) return this._imagePlanes[x];
		}
	},
	
	_loadAppropriateTexture: function(url, distance, atlasIndex) {
		var self = this;
		return THREE.ImageUtils.loadTexture( url, new THREE.UVMapping(), function() {
			//arguments[0].minFilter = THREE.LinearMipMapLinearFilter;
			//arguments[0].magFilter = THREE.LinearFilter;
			//console.log('TIME image loaded ', new Date().getTime());
			//arguments[0].needsUpdate = true;
			//mesh.material.map.needsUpdate = true;
			//console.log(url, arguments[0], arguments[0].image);
			arguments[0].flipY = false;
			var x = atlasIndex % 16;
			var y = (atlasIndex - x) / 16;
			self._textureAtlasHighdef.addSubImage( x * 256, y * 256, arguments[0].image );
		}.bind(this));
	},
	
	_loadIconTextureAtlases: function(amount) {
		for (var nr = 1; nr <= amount; nr++) {
			console.log('loading');
			this.pointShaderMaterial.uniforms['tex' + nr].value = THREE.ImageUtils.loadTexture(documentRootPath + '/campartex/services/prod/textureAtlas/1.jpg', new THREE.UVMapping(), function() {
				console.log('load');
				arguments[0].flipY = false;
			});
		}
	},
	
	_findEmptyTextureAtlasSpot: function() {
		for (var x = 0; x < 256; x++) {
			if (this._textureAtlasSpots[x] !== true) { this._textureAtlasSpots[x] = true; return x; }
		}
	},
	
	rotateImagesTowardsCamera: function() {
		return;
		var yawObject = controls.getObject();
		var pitchObject = yawObject.children[0];
	
		//Planes
		Array.each(this._images, function(el) {
			el.rotation.y = yawObject.rotation.y;
			el.rotation.x = pitchObject.rotation.x;
		});
	},
	
	raytracePoint: function(position) {
		//create the world matrix of the position by adding the cluster's pos to the point pos
		//further docs: https://github.com/mrdoob/three.js/issues/1188 , http://stackoverflow.com/questions/20351466/gl-pointsize-to-screen-coordinates/20395890#20395890
		
		var projector = new THREE.Projector();
		
		var width = window.innerWidth, height = window.innerHeight;
		var widthHalf = width / 2, heightHalf = height / 2;

		var vector = new THREE.Vector3();
		var projector = new THREE.Projector();
		var matrixWorld = new THREE.Matrix4();
		
		matrixWorld.setPosition(focusedArtCluster.object3D.localToWorld(position));
		
		var modelViewMatrix = camera.matrixWorldInverse.clone().transpose().multiply( matrixWorld).transpose();
		
		var vec4pos = new THREE.Vector4( position.x, position.y, position.z, 1.0 );;
		
		var mvPosition = (vec4pos).applyMatrix4(modelViewMatrix);
		
		var gl_PointSize = this.pointShaderMaterial.uniforms.zoom.value * ( 180.0 / Math.sqrt( mvPosition.x * mvPosition.x + mvPosition.y * mvPosition.y + mvPosition.z * mvPosition.z ) );
		
		projector.projectVector( vector.setFromMatrixPosition( matrixWorld ), camera );

		vector.x = ( vector.x * widthHalf ) + widthHalf - 20; //-20 = measured value. Why? Don't know, but this offset is always there...
		vector.y = - ( vector.y * heightHalf ) + heightHalf - 20;
		
		//console.log(vector.x, vector.x + gl_PointSize, vector.y, vector.y + gl_PointSize);
		
		//check whether we point at it
		if (vector.x <= widthHalf && (vector.x + gl_PointSize) >= widthHalf && vector.y <= heightHalf && (vector.y + gl_PointSize) >= heightHalf) {
			return true;
		}
		return false;
	},
	
	/* Creates an info text from a canvas, extracts as image and displayes it on a sprite in the 3D space */
	_createTextSprite: function() {
		var canvas1 = document.createElement('canvas');
		var context1 = canvas1.getContext('2d');
		context1.font = "Bold 20px Arial";
		context1.fillStyle = "rgba(255,255,255,0.95)";
		context1.fillText("Farbe: blau", 0, 20);
		context1.fillText("Stil: Impressionismus", 0, 50);

		var texture1 = new THREE.Texture(canvas1);
		texture1.needsUpdate = true;
		
		var textMat = new THREE.SpriteMaterial( { map: texture1, useScreenCoordinates: false, color: 0xffffff } );
		textMat.transparent = true;
		var textSprite = new THREE.Sprite( textMat );
		textSprite.position.set( 
			-30,
			20,
			30
		);
		textSprite.scale.set( 30, 30, 1.0 ); // imageWidth, imageHeight
		this.object3D.add( textSprite );
	},
	
	/* Calculates coordinates of a random point in sphere. See http://mathworld.wolfram.com/SpherePointPicking.html (Cook's uniformly distributed version) , http://en.wikipedia.org/wiki/Spherical_coordinate_system */
	_randomPointsOnSphere: function(r) {
		var x0 = 1, x1 = 1, x2 = 1, x3 = 1;
		
		if (r == undefined) r = 1500;
		
		while (x0 * x0 + x1 * x1 + x2 * x2 + x3 * x3 >= 1) {
			x0 = Math.random() * 2 - 1;
			x1 = Math.random() * 2 - 1;
			x2 = Math.random() * 2 - 1;
			x3 = Math.random() * 2 - 1;
		}
		
		var x0123 = x0 * x0 + x1 * x1 + x2 * x2 + x3 * x3;
		
		var cartesianCoordinates = new THREE.Vector3( 
			2 * (x1 * x3 + x0 * x2) / x0123,
			2 * (x2 * x3 - x0 * x1) / x0123,
			(x0 * x0 + x3 * x3 - x1 * x1 + x2 * x2) / x0123
		);
		
		return cartesianCoordinates.multiplyScalar(r);
	},
	
	/* Calculates coordinates of a random point in space*/
	_randomPointInCoordinateSystem: function() {
		return new THREE.Vector3(
			Math.random() * this.options.amountDisplayed / 200 * 3,
			Math.random() * this.options.amountDisplayed / 200 * 3,
			Math.random() * this.options.amountDisplayed / 200 * 3
		)
	},
	
	_fakeClustering: function() {
		var arr = this.positions;
		var clustercenters = [2500, 500, 300,
							 2500, 2000, 2500,
							 500, 500, 2000];
		var differences = [clustercenters[3] - clustercenters[0], clustercenters[4] - clustercenters[1], clustercenters[5] - clustercenters[2],
						   clustercenters[6] - clustercenters[3], clustercenters[7] - clustercenters[4], clustercenters[8] - clustercenters[5],
						   clustercenters[0] - clustercenters[6], clustercenters[1] - clustercenters[7], clustercenters[2] - clustercenters[8]];
		for (var x = 0, l = arr.length / 3; x < l; x++) {
			if (Math.random() > 0.95) {
				var p = this._randomPointsOnSphere(1000);
				arr[x * 3] = Math.random() * p.x + 1400;
				arr[x * 3 + 1] = Math.random() * p.y + 300;
				arr[x * 3 + 2] = Math.random() * p.z + 1200;
			} else {
				var clusterIndex = (x % 3) * 3,
					index = x * 3,
					spoint = this._randomPointsOnSphere(400);
				arr[index] = Math.random() * spoint.x + clustercenters[clusterIndex];
				arr[index + 1] = Math.random() * spoint.y + clustercenters[clusterIndex + 1];
				arr[index + 2] = Math.random() * spoint.z + clustercenters[clusterIndex + 2];
				//maybe between 2 clusters
				if (Math.random() > 0.9) {
					var difference = Math.random();
					arr[index] += difference * differences[clusterIndex];
					arr[index + 1] += difference * differences[clusterIndex + 1];
					arr[index + 2] += difference * differences[clusterIndex + 2];
				}
			}
		}
	},
	
	relocateImages: function(positionFunction /* e.g. clustering function */) {
		/*for (var x = 0; x < this._images.length; x++) {
			this._images[x].position = positionFuction();
		}*/
		for (var x = 0, l = this.options.amountDisplayed * 3; x < l; x+=3) {
			var newP = positionFunction();
			this.positions[x] = newP.x;
			this.positions[x + 1] = newP.y;
			this.positions[x + 2] = newP.z;
		}
		this._particleGeom.attributes.position.needsUpdate = true;
		focusedArtCluster.createKdTree();
	},
	
	/* Goes to this cluster with the camera by flying there */
	/*goTo: function() {
		//for rotation: yaw = y = cam, pitch = x = pitchCam
		var cam = controls.getObject();
		var pitchCam = cam.children[0];
		
		var cameraStartPosition = cam.position.clone();
		var cameraTravelDistance = this.options.clusterCenter.clone().sub(cameraStartPosition);
		//cameraTravelDistance.z += 50;
		
		var rotationStartPositionY = cam.rotation.y;
		var rotationStartPositionX = pitchCam.rotation.x;
		var rotationTravelDistance = new THREE.Vector3(0,0,0).sub(new THREE.Vector3(rotationStartPositionX, rotationStartPositionY, 0));
		
		ArtCluster.cameraFx.set = function(value) {
			cam.position.x = cameraStartPosition.x + value * cameraTravelDistance.x;
			cam.position.y = cameraStartPosition.y + value * cameraTravelDistance.y;
			cam.position.z = cameraStartPosition.z + value * cameraTravelDistance.z;
			//rotate around too
			cam.rotation.y = rotationStartPositionY + value * rotationTravelDistance.y;
			pitchCam.rotation.x = rotationStartPositionX + value * rotationTravelDistance.x;
		}.bind(this);
		
		(function() {
			focusedArtCluster = this;
		}).delay(ArtCluster.cameraFx.duration / 2, this);
		
		ArtCluster.cameraFx.start(0, 1);
	},*/
	
	/* Draws a dotted line between the parent and the current cluster */
	/*_drawConnectionLine: function() {
		if (artClusters[this.index - 1] != undefined) {
			var lineGeometry = new THREE.Geometry();
			lineGeometry.vertices.push(artClusters[this.index - 1].options.clusterCenter);
			lineGeometry.vertices.push(this.options.clusterCenter);
			lineGeometry.computeLineDistances();

			var line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({ color: 0x00FFFF, lineWidth: 1, dashSize: 2, gapSize: 2 }));
			scene.add(line);
		}
	}*/
}).extend({
	//static vars and functions
	cameraFx: new Fx({
		duration: 2500,
		link: 'ignore'
	}),	
	artBorderSpriteMaterial: new THREE.SpriteMaterial( { map: THREE.ImageUtils.loadTexture( 'images/artSelectionBorder.png'), useScreenCoordinates: false, color: 0xffffff })
});