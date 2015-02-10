/**
* Class for creating an artwork cluster in space
**/
var SoundCollection = new Class({
	Implements: [Events, Options],
	
	//class options, set by the constructer or left default
	options: {
		cam: undefined
	},
	
	_soundCollection: {
		soundUrl: [],
		panner: [],
		buffer: [],
		source: [] //optional, filled when the sound is currently playing
	},
	
	initialize: function(options){
		//this.setOptions(options);
		
		var AudioContext = window.AudioContext || window.webkitAudioContext;
		var OfflineAudioContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
		this._context = new AudioContext();
		this._loaderContext = new OfflineAudioContext(2, 1024, 44100); //22050 to 96000, CD = 44100
		
		this._listenerUpdater = new WebAudiox.ListenerObject3DUpdater(this._context, options.cam);
		
		
		// Create lineOut
		this._lineOut = new WebAudiox.LineOut(this._context);
		this._lineOut.volume = 1;
	},
	
	add: function(sound, position) {
		var soundListIndex = this._findEmptySpotInSoundList();
		//reserve spot so no overwrites will happen
		if (soundListIndex != -1) this._soundCollection.soundUrl[soundListIndex] = 'reserved';
		
		WebAudiox.loadBuffer(this._loaderContext, sound, function(buffer){
			var destination	= this._lineOut.destination;

			// init AudioPannerNode
			var panner	= this._context.createPanner();
			panner.connect(destination);
			panner.setPosition(position.x, position.y, position.z);
			panner.position = position;
			destination	= panner;
			
			console.log('loaded sound ', sound, position);
			if (soundListIndex == -1) {
				soundListIndex = this._soundCollection.soundUrl.push( sound ) - 1;
				this._soundCollection.panner.push( panner );
				this._soundCollection.buffer.push( buffer );
			} else {
				this._soundCollection.soundUrl[soundListIndex] = sound;
				this._soundCollection.panner[soundListIndex] = panner;
				this._soundCollection.buffer[soundListIndex] = buffer;
			}
		}.bind(this));
	},
	
	remove: function(sound) {
		var index = this._getSoundIndex(sound);
		if (index != -1) {
			this.stop(sound);
			delete this._soundCollection.soundUrl[index];
			delete this._soundCollection.panner[index];
			delete this._soundCollection.buffer[index];
			delete this._soundCollection.source[index];
		}
	},
	
	play: function(sound /* Can be URL, panner or source */, offset, endedCallback) {
		var playInitialized = 0;
		if (sound) {
			playInitialized++;
			var soundIndex = this._getSoundIndex(sound);
			if (soundIndex != -1) {
				playInitialized++;
				var buffer = this._soundCollection.buffer[soundIndex];
				if (buffer != undefined) {
					//loaded the sound source, start playing
					
					// init AudioBufferSourceNode
					var source = this._context.createBufferSource();
					source.buffer = buffer;
					source.loop	= true;
					source.connect(this._lineOut.destination);
					if (endedCallback) source.onended = endedCallback;
					
					//stop the playback after 5 loops
					setTimeout(function() {
						if (this.playbackState == 1 || this.playbackState == 2) {
							this.stop();
						}
					}.bind(source), source.buffer.duration * 1000 * 5);
					
					source.start(0, offset|0);
					
					this._soundCollection.source[soundIndex] = source;
					playInitialized++;
				} else {
					console.log('source', source);
				}
			}
		}
		if (playInitialized < 3) {
			console.log('play but not play', playInitialized, sound);
		} else {
			return true;
		}
		return false;
	},
	
	/* play a sound collection, make sure every sound is loaded before */
	playCollection: function(indexes) {
		//TODO: Positions to indexes, timeouts to onload.
		var self = this;
		
		var bufferResult = this._gatherPositionBuffers(
			indexes,
			[], 
			function(positionBuffers) {
				var x = 0;
				var playBuffer = function () {
					console.log('playBuffer', x);
					var source = self._context.createBufferSource();
					source.buffer = positionBuffers[x];
					x++;
					source.loop	= false;
					source.connect(self._lineOut.destination);
					//console.log('duration', source, source.buffer.duration * 1000);
					//source.onended = playBuffer;
					if (x < positionBuffers.length) setTimeout(playBuffer.bind(this), source.buffer.duration * 1000);
					
					source.start(0);
					
					//this._soundCollection.source[soundIndex] = source;
				};
				
				if (x < positionBuffers.length) playBuffer();
			},
			function(positionBuffers) {
				console.log('unable to load play collection', positionBuffers); 
			}
		);
		
		//gathering failed, invalid indexes
		if (bufferResult == false) return false;
	},
	
	stop: function(sound /* Can be URL, panner or source */) {
		if (sound) {
			var soundIndex = this._getSoundIndex(sound);
			if (soundIndex != -1) {
				var source = this._soundCollection.source[soundIndex];
				if (source != undefined && (source.playbackState == 1 || source.playbackState == 2)) {
					//loaded the sound source, stop it IF it is playing
					source.stop();
				}
			}
		}
	},
	
	_getSoundIndex: function(sound) {
		var soundIndex = -1;
		//figure out index
		if (sound) {
			if (typeof(sound) == 'string') {
				soundIndex = this._soundCollection.soundUrl.indexOf(sound);
			} else if (sound instanceof THREE.Vector3) {
				for (var x = 0; x < this._soundCollection.panner.length; x++) {
					if (this._soundCollection.panner[x] && this._soundCollection.panner[x].position.distanceTo(sound) < 0.001) {
						soundIndex = x;
						break;
					}
				}
			} else if (sound instanceof AudioBufferSourceNode) {
				soundIndex = this._soundCollection.source.indexOf(sound);
			}
		}
		if (soundIndex == -1) {
			//console.log('-1!', sound);
		}
		return soundIndex
	},
	
	_findEmptySpotInSoundList: function() {
		for (var x = 0; x < this._soundCollection.soundUrl.length; x++) {
			if (this._soundCollection.soundUrl[x] == undefined) return x;
		}
		return -1;
	},
	
	_update: function(delta, now) {
		this._listenerUpdater.update(delta, now);
		
		/*for (var x = 0; x < this._soundCollection.panner.length; x++) {
			if (this._soundCollection.panner[x] != undefined) this._soundCollection.panner[x].update(delta, now);
		}*/
	},
	
	_gatherPositionBuffers: function(indexes, positionBuffers, successCallback, errorCallback, tryCount, positions) {
		if (!tryCount) tryCount = 1;
		if (!positions) positions = focusedArtCluster.getPointsByIndexes(indexes);
	
		for (var x = 0; x < indexes.length; x++) {
			console.log('try', tryCount, 'positionBuffer is', positionBuffers[x], 'position', indexes[x]);
			if (positionBuffers[x]) continue;
			if (!indexes[x] || !positions[x]) return false;
			
			var soundIndex = this._getSoundIndex(positions[x]);
			if (soundIndex != -1) {
				var buffer = this._soundCollection.buffer[soundIndex];
				if (buffer != undefined) {
					//loaded the sound source, add it to buffers
					positionBuffers[x] = buffer;
				}
			} else {
				//-1 = sound neither added nor loaded.
				//initiate buffer loading
				//this.add('sounds/sound' + (indexes[x] % 7) + '.ogg', positions[x]);
				this.add('sounds/usage permitted only with a contimbre.com license ' + soundList[(indexes[x] % soundList.length)][0] + '.ogg', positions[x]);
			}
		}
		
		//do we have all buffers loaded?
		var allLoaded = true;
		for (var y = 0; y < indexes.length; y++) {
			if (!positionBuffers[y]) {
				//if not, set a new timeout with another call/check to see if all are loaded
				setTimeout(function() {
					if (tryCount < 5) this._gatherPositionBuffers(indexes, positionBuffers, successCallback, errorCallback, tryCount, positions);
				}.bind(this), 200);
				allLoaded = false;
				break;
			}
		}
		
		tryCount++;
		
		if (allLoaded && successCallback) successCallback(positionBuffers);
		else if (tryCount >= 5 && !allLoaded && errorCallback) errorCallback(positionBuffers);
	}
});