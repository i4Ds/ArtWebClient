var AudioTool = {};

/**
* Class for creating a spline between points
**/
AudioTool.Spline = new Class({
	Implements: [Events, Options],
	
	//class options, set by the constructer or left default
	options: {
		color: 0xff00f0,
		splinePointsPerPoint: 12
	},
	
	_points: [],
	_indexes: [],
	_geometry: new THREE.Geometry(),
	_line: undefined,
	
	initialize: function(options){
		this.setOptions(options);
		
		this._material = new THREE.LineBasicMaterial({
			color: this.options.color,
		});
		
	},
	
	addPosition: function(index) {
		this._indexes.push(index);
	},
	
	draw: function() {
		var points = focusedArtCluster.getPointsByIndexes(this._indexes);
		
		var spline = new THREE.SplineCurve3(points);
		
		var splinePoints = spline.getPoints(points.length * this.options.splinePointsPerPoint);
		
		this._geometry = new THREE.Geometry();
		for(var i = 0; i < splinePoints.length; i++){
			this._geometry.vertices.push(splinePoints[i]);  
		}
		this._geometry.verticesNeedUpdate = true;

		scene.remove(this._line);
		this._line = new THREE.Line(this._geometry, this._material);
		scene.add(this._line);
	},
	
	play: function() {
		soundCollection.playCollection(this._indexes);
	}
});