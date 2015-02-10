// simple touch move "gesture" that always fires while touched
(function() {

    /**
     * the gesture for tapping can't take longer than this.
     * this time includes from the time to buffer all fingers (gesture start) to the releasing all fingers.
     *
     * @type {Number}
     */
    var MOVE_THRESHOLD_TO_CANCEL_GESTURE= 40;

    GM.GR_TouchMove= function(fingers, callback, endcallback) {
        GM.GR_TouchMove.superclass.constructor.call(this, callback);

		this.endcallback = endcallback;
		
        fingers= fingers|0;
        this.setCaptureTouchIdLen(fingers);
        this.setId("TouchMove "+fingers);
		
		//initialize travel totals
		this._resetTotals();

        return this;
    };

    GM.GR_TouchMove.prototype= {

        fingers : 1,
		active : false,
		moveEndCooldownTimer: 0,

        touchesMoved : function(e) {
			/*if ( this.getCurrentTouchIdCount()!==this.fingers) {
                this.failed();
                return;
            }*/
			
            this.__super(e);

			for( var i=0; i<e.changedTouches.length; i+=1 ) {

                var indexId= this.getTouchIdPositionInCaptureArray(e.changedTouches[i].identifier);
                if (-1!=indexId) {

                    var touchInfo= this.touchesInfo[ indexId ];

                    var offsetX= touchInfo.x - e.changedTouches[i].pageX;
                    var offsetY= touchInfo.y - e.changedTouches[i].pageY;
					
					//if one finger has barely moved, cancel
					if ( !this.active ) {
						if ( offsetX>MOVE_THRESHOLD_TO_CANCEL_GESTURE && offsetY>MOVE_THRESHOLD_TO_CANCEL_GESTURE ) {
							this.failed();
							return;
						} else {
							this.active = true;
						}
					}
					
					this._resetTimeout(true, e);

                    touchInfo.delta.x = offsetX - touchInfo.total.x;
					touchInfo.delta.y = offsetY - touchInfo.total.y;
                    touchInfo.total.x = offsetX;
					touchInfo.total.y = offsetY;
                }
            }
			
            if ( this.callback ) {
				this.callback(this.getCurrentTouchIdCount());
			}

        },
		
		touchesBegan : function(e) {
			this.__super(e);
			
			/*for (var x = 0; x < this.touchesInfo.length; x++) {
				this.touchesInfo[x].delta = {x: this.touchesInfo[x].x, y: this.touchesInfo[x].y};
			}*/
		},

        touchesEnded : function(e) {
		
			this._resetTimeout(false);
			
			this.active = false;

			this._resetTotals();
		
            for( var i=0; i<e.changedTouches.length; i+=1 ) {
                this.clearTouchId(e.changedTouches[i].identifier);
            }

            //if ( this.allCapturedTouchIdsReleased() ) {
                this.__super(e);
                if ( this.endcallback ) {
                    this.endcallback(this.fingers);
                }
            //}
        },
		
		_resetTotals: function() {
			for (var x = 0; x < this.touchesInfo.length; x++) {
				this.touchesInfo[x].total = {x: 0, y: 0};
				this.touchesInfo[x].delta = {x: 0, y: 0};
			}
		},
		
		_resetTimeout: function(setNew, lastEvent) {
			if (this.moveEndCooldownTimer) clearTimeout(this.moveEndCooldownTimer);
			
			if (setNew) {
				this.moveEndCooldownTimer = setTimeout(this.touchesEnded.bind(this, lastEvent), 200);
			}
		}
    };

    GM.extend( GM.GR_TouchMove, GM.GestureRecognizer );

})();