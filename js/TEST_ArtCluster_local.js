/**
* Class for creating an artwork cluster in space
**/
var ArtCluster = new Class({
	Implements: [Events, Options],
	
	//class options, set by the constructer or left default
	options: {
		amountDisplayed: 2000, /* How many artworks should be displayed with this cluster? */
		artBorderSprite: -1,
		amountOfImagesLoaded: 100
	},
	
	index: -1,
	artBorderSprite: -1, //yellow border for image selection
	
	initialize: function(options){
		this.setOptions(options);
		
		//register cluster in the art cluster list
		/*this.index = artClusters.length;
		artClusters.push(this);*/
		
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
		
		
		var textureAtlasHighdef = THREE.ImageUtils.loadTexture( documentRootPath + 'atlas/textureAtlas.jpg', new THREE.UVMapping(), function() {
			arguments[0].flipY = false;
			this.queryForImages('http://campartex.cs.technik.fhnw.ch:8080/campartex/services/prod/clustering/rgb?maxCount=10000');
		}.bind(this));
		textureAtlasHighdef.minFilter = THREE.LinearMipMapLinearFilter;
		textureAtlasHighdef.magFilter = THREE.LinearFilter;
		this._textureAtlasHighdef = textureAtlasHighdef;
		this._textureAtlasSpots = [];
		
		var textureAtlasIcons = THREE.ImageUtils.loadTexture( documentRootPath + 'atlas/spikeBalls.png', new THREE.UVMapping(), function() {
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
			fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
            //depthTest: true,
            transparent: false,
			alphaTest: 0.5
		});
		
		
		
		this._material = new THREE.ParticleSystemMaterial( { size: 85, map: textureAtlasIcons, transparent: false } );
		this._material.color.setHSL( 1.0, 0.2, 0.7 );
		//this._material.depthWrite = false;
		this._material.alphaTest = 0.5;
		
		//distance function needed for the kd-tree wich the nearest neighbour search
		this.distanceFunction = function(a, b){
			return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2) +  Math.pow(a[2] - b[2], 2);
		};
		
		//array of the images currently loaded
		this._images = [];
		
		
		//axis lines + cluster categories
		lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
		lineGeometry.vertices.push(new THREE.Vector3(3000, 0, 0));
		lineGeometry.computeLineDistances();

		var line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({ color: 0xFF0000, lineWidth: 3, dashSize: 5, gapSize: 5 }));
		
		var sprite = this.createTextSprite('Spectral Center');
		sprite.position.set(1500,-20,0);
		line.add(sprite);
		sprite = this.createTextSprite('Spectral Center');
		sprite.position.set(500,-20,0);
		line.add(sprite);
		
		this.object3D.add(line);

		
		lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
		lineGeometry.vertices.push(new THREE.Vector3(0, 3000, 0));
		lineGeometry.computeLineDistances();

		var line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({ color: 0x00FF00, lineWidth: 3, dashSize: 5, gapSize: 5 }));
		
		var sprite = this.createTextSprite('Spectral Complexity');
		sprite.position.set(-10,1500,0);
		line.add(sprite);
		sprite = this.createTextSprite('Spectral Complexity');
		sprite.position.set(-10,500,0);
		line.add(sprite);
		
		this.object3D.add(line);

		lineGeometry = new THREE.Geometry();
		lineGeometry.vertices.push(new THREE.Vector3(0, 0, 0));
		lineGeometry.vertices.push(new THREE.Vector3(0, 0, 3000));
		lineGeometry.computeLineDistances();

		var line = new THREE.Line(lineGeometry, new THREE.LineDashedMaterial({ color: 0x0000FF, lineWidth: 3, dashSize: 5, gapSize: 5 }));
		
		var sprite = this.createTextSprite('Attack Time');
		sprite.position.set(0,-10,1500);
		line.add(sprite);
		sprite = this.createTextSprite('Attack Time');
		sprite.position.set(0,-10,500);
		line.add(sprite);
		this.object3D.add(line);
		
		scene.add(this.object3D);
	},
	
	createKdTree: function() {
		this.kdtree = new THREE.TypedArrayUtils.Kdtree( this.positions, this.distanceFunction, 3, false );
	},

	queryForImages: function(url) {
		
		//once done, interprete and store positions
		//this.particles.frustumCulled = true; TODO
		
		if (this.particles) {
			this._particleGeom.dispose();
			scene.remove(this.particles);
		}
		this.options.amountDisplayed = soundList.length;
		var x = 0;
		
		this._particleGeom = new THREE.BufferGeometry();
		//this._particleGeom.addAttribute( 'position', Float32Array, this.options.amountDisplayed * 3, 3 );
		//this._particleGeom.addAttribute( 'atlasIndex', Float32Array, this.options.amountDisplayed, 1 );
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
		
		for (var i = 0; i < this.options.amountDisplayed; i++) {
			// ID, posX, posY, posZ, aR
			this._imageData[i] = 0;
			this.atlasIndexes[i] = -i % 4; 
		}
		
		//this._fakeClustering();
		//this._randomPointInCoordinateSystem();
		this._positionsFromSoundList();
		
		measureStart = new Date().getTime();
		//takes a lot of time to execute. delayed execution results in an even greater performance hit, not recommended
		this.createKdTree();
		console.log('TIME building kdtree', new Date().getTime() - measureStart);
		
		//display particles AFTER the kd-tree was generated and the sorting of the positions-array is done

				/*particles = new THREE.ParticleSystem( this._particleGeom, this._material );
				particles.sortParticles = true;

				scene.add( particles );*/
				
		this.particles = new THREE.ParticleSystem( this._particleGeom, 
			this.pointShaderMaterial
		);
		this.particles.dynamic = true;
		this.particles.sortParticles = true;
		
		scene.add(this.particles);
		
		this._loaded = true;
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
				this.options.amountOfImagesLoaded, Math.pow(this.options.amountOfImagesLoaded, 2) * zoomLevels.options.zoom,
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
					var objectUrl = 'http://campartex.cs.technik.fhnw.ch:8080/campartex/services/prod/images/'+this._imageData[objectIndex]+'/256';
					
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
								oldAtlasIndex: this.atlasIndexes[ objectIndex ],
								soundQueued: false
							};
							
							img = this._images[pos];
							
							//this._loadAppropriateTexture(objectUrl, object[1], atlasIndex);
							var soundUrl = 'sounds/usage permitted only with a contimbre.com license ' + soundList[(objectIndex % soundList.length)][0] + '.ogg';
							this._loadAppropriateSound(soundUrl, objectPoint);
							
							this.atlasIndexes[ objectIndex ] = atlasIndex + (isSelected ? 256 : 0);
							
							this._particleGeom.attributes.atlasIndex.needsUpdate = true;
							
						} else {
							console.error('No atlasindex found');
						}
					} else if (isSelected && !img.isSelected) {
						this.atlasIndexes[ objectIndex ] = -75000; //img.atlasIndex + 256;
						img.soundQueued = true;
						//debugOutput.setText('X: ' + Math.round(img.position.x, 2) + ', Y: ' + Math.round(img.position.y, 2) + ', Z: ' + Math.round(img.position.z, 2));
						console.log('X: ' + Math.round(img.position.x, 2) + ', Y: ' + Math.round(img.position.y, 2) + ', Z: ' + Math.round(img.position.z, 2));
							
						this._particleGeom.attributes.atlasIndex.needsUpdate = true;
						img.isSelected = true;
					} else if (!isSelected && img.isSelected) {
						this.atlasIndexes[ objectIndex ] = img.atlasIndex % 256;
						soundCollection.stop(img.position);
						
						this._particleGeom.attributes.atlasIndex.needsUpdate = true;
						img.isSelected = false;
					}
					
					if (img && img.soundQueued && img.isSelected) {
						img.soundQueued = !soundCollection.play(img.position);
					}
					
					if (isSelected) this._displayNearestSelectedImage = img;
			}
			
		} else if (this._displayNearestStep == 3) {
			
			//remove the still unchecked images
			for (var x = 0; x < this._images.length; x++) {
				if (this._images[x].unchecked == true) {
					
					soundCollection.remove( this._images[x].position );
					this.atlasIndexes[ this._images[x].attribIndex ] = this._images[x].oldAtlasIndex;
					this._particleGeom.attributes.atlasIndex.needsUpdate = true;
					this._textureAtlasSpots[this._images[x].atlasIndex] = false;
					
					this._images.splice(x, 1);
				}
			}
			
		}
		
		this._displayNearestStep = (this._displayNearestStep + 1) % 4;
	},
	
	getPointsByIndexes: function(indexList) {
		var points = [];
		var pos = 0;
		for (var x = 0; x < indexList.length; x++) {
			pos = indexList[x] * 3;
			points[x] = new THREE.Vector3(focusedArtCluster.positions[pos], focusedArtCluster.positions[pos + 1], focusedArtCluster.positions[pos + 2]);
		}
		return points;
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
	
	_loadAppropriateSound: function(url, position) {
		soundCollection.add(url, position);
	},
	
	_loadIconTextureAtlases: function(amount) {
		for (var nr = 1; nr <= amount; nr++) {
			console.log('loading');
			this.pointShaderMaterial.uniforms['tex' + nr].value = THREE.ImageUtils.loadTexture('http://campartex.cs.technik.fhnw.ch:8080/campartex/services/prod/textureAtlas/1.jpg', new THREE.UVMapping(), function() {
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
	
	_typedIndexOf: function(node, subarr) {
		/*for(var i=0; i<node.length; i+=3) {
			if (node[i] != subarr[0]) continue;
			if (node[i + 1] != subarr[1]) continue;
			if (node[i + 2] != subarr[2]) continue;
			return i / 3;
		}
		return -1;*/
		return node.pos;
		var maxAmountOfNodes = function(depth) {
			return Math.pow(2, depth + 1) - 1;
		};
		
		var currentNode = node;
		var total = 0;
		var positionOnDepth = 0;
		while (currentNode.parent != null) {
			//if you're on the right, add the left side
			if (currentNode.parent.right == currentNode) {
				//add the sibling node and +1 for the parent
				total += maxAmountOfNodes(this.kdtree.getMaxDepth() - currentNode.depth) + 1;
				positionOnDepth += Math.pow(2, node.depth - currentNode.parent.depth);
			}
			currentNode = currentNode.parent;
		}
		
		var restDepth = this.kdtree.getMaxDepth() - node.depth;
		//add children to the total
		if (restDepth >= 0) total += maxAmountOfNodes(restDepth - 1);
		
		//count away the children that aren't existing in leaf dimension
		var substractableChildrenAmountFromUnfinishedLeafDepth = 0;
		if (node.depth != this.kdtree.getMaxDepth()) {
			var maxLeafDepthLeaves = Math.pow(2, this.kdtree.getMaxDepth());
			var maxNodes = Math.pow(2, node.depth);
			var potentialAmountOfLeafDepthChildrenOnTheLeft = (positionOnDepth + 0.5) * Math.pow(2, restDepth);
			//substractableChildrenAmountFromUnfinishedLeafDepth = maxLeafDepthLeaves - Math.min(potentialAmountOfLeafDepthChildrenOnTheLeft, this.kdtree.getAmountOfLeafDepthNodes());
			if (potentialAmountOfLeafDepthChildrenOnTheLeft - this.kdtree.getAmountOfLeafDepthNodes() > 0) {
				total -= potentialAmountOfLeafDepthChildrenOnTheLeft - this.kdtree.getAmountOfLeafDepthNodes();
			}
		}
		return total;
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
		for (var x = 0; x < this.positions.length; x+=3) {
			this.positions[x] = Math.round(Math.random() * 3000);
			this.positions[x+1] = Math.round(Math.random() * 3000);
			this.positions[x+2] = Math.round(Math.random() * 3000);
		}
	},
	
	_positionsFromSoundList: function() {
		var l = soundList.length;
		var minVals = [27.3, 0.0001, 275.7, 0.0005];
		var maxVals = [96.8, 0.928, 6543, 0.3133];
		var differences = [maxVals[0] - minVals[0], maxVals[1] - minVals[1], maxVals[2] - minVals[2], maxVals[3] - minVals[3]];
		
		for (var x = 0; x < this.positions.length; x+=3) {
			var dataRow = soundList[(x / 3) % l];
			
			
			this.positions[x] = (dataRow[1] - minVals[0]) / differences[0] * 3000;
			this.positions[x+1] = (dataRow[2] - minVals[1]) / differences[1] * 3000;
			this.positions[x+2] = (dataRow[3] - minVals[2]) / differences[2] * 3000;
		}
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
	
	createTextSprite: function(text){
		var canvas1 = document.createElement('canvas');
		var context1 = canvas1.getContext('2d');
		context1.font = "Bold 20px Arial";
		context1.fillStyle = "rgba(255,255,255,0.95)";
		context1.fillText(text, 0, 20);
		
		var spriteTexture = new THREE.Texture(canvas1);
		spriteTexture.needsUpdate = true;
		
	
		var textMaterial = new THREE.SpriteMaterial( { map: spriteTexture, color: 0xffffff } );
		textMaterial.transparent = true;
		var textSprite = new THREE.Sprite( textMaterial );
		textSprite.position.set( 130, 100, 0 );
		textSprite.scale.set( 140, 100, 1.0 ); // imageWidth, imageHeight
		return textSprite;
	}
	
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