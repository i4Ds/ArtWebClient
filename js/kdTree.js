/**
 * k-d Tree for typed arrays (e.g. for Float32Array), in-place
 * provides fast nearest neighbour search
 * useful e.g. for a custom shader and/or BufferGeometry, saves tons of memory
 * has no insert and remove, only buildup and neares neighbour search
 *
 * Based on https://github.com/ubilabs/kd-tree-javascript by Ubilabs
 *
 * @author Roman Bolzern <roman.bolzern@fhnw.ch>, 2013
 * @author I4DS http://www.fhnw.ch/i4ds, 2013
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 *
 * Requires typed array quicksort
 *
 * Example: 
 * points: [x, y, z, x, y, z, x, y, z, ...]
 * metric: function(a, b){	return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2) +  Math.pow(a[2] - b[2], 2); }  //Manhatten distance
 * eleSize: 3 //because of (x, y, z)
 *
 * Further information (including mathematical properties)
 * http://en.wikipedia.org/wiki/Binary_tree
 * http://en.wikipedia.org/wiki/K-d_tree
 */

(function(){

  function Node(obj, depth, parent, pos) {
    this.obj = obj;
    this.left = null;
    this.right = null;
    this.parent = parent;
    this.depth = depth;
	this.pos = pos;
  }
  
  function kdTree(points, metric, eleSize) {

    var self = this;
	
	var maxDepth = 0;
	var amountOfLeafDepthNodes = 0;
	
	var getPointSet = function(points, pos) {
		return points.subarray(pos * eleSize, pos * eleSize + eleSize);
	};
    
    function buildTree(points, depth, parent, pos) {
      var dim = depth % eleSize,
        median,
        node,
		plength = points.length / eleSize;

	  if (depth > maxDepth) maxDepth = depth;
		
      if (plength === 0) return null;
      if (plength === 1) {
		amountOfLeafDepthNodes++;
        return new Node(getPointSet(points, 0), depth, parent, pos);
      }

      quickSortIP(points, eleSize, dim);
	  
      median = Math.floor(plength / 2);
	  
      node = new Node(getPointSet(points, median) , depth, parent, median + pos);
	  node.left = buildTree(points.subarray( 0, median * eleSize), depth + 1, node, pos);
      node.right = buildTree(points.subarray( (median + 1) * eleSize, points.length), depth + 1, node, pos + median + 1);

      return node;
    }

	this.root = buildTree(points, 0, null, 0);
	
	this.getMaxDepth = function() { return maxDepth; };
	this.getAmountOfLeafDepthNodes = function() { return amountOfLeafDepthNodes; };
	
    this.nearest = function (point, maxNodes, maxDistance) {
      var i,
        result,
        bestNodes;

      bestNodes = new BinaryHeap(
        function (e) { return -e[1]; }
      );

      function nearestSearch(node) {
        var bestChild,
          dimension = node.depth % eleSize,
          ownDistance = metric(point, node.obj),
		  linearDistance = 0,
          otherChild,
          i,
          linearPoint = [];

        function saveNode(node, distance) {
          bestNodes.push([node, distance]);
          if (bestNodes.size() > maxNodes) {
            bestNodes.pop();
          }
        }

        for (i = 0; i < eleSize; i += 1) {
          if (i === node.depth % eleSize) {
            linearPoint[i] = point[i];
          } else {
            linearPoint[i] = node.obj[i];
          }
        }

        linearDistance = metric(linearPoint, node.obj);

		//if it's a leaf
        if (node.right === null && node.left === null) {
          if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
            saveNode(node, ownDistance);
          }
          return;
        }

        if (node.right === null) {
          bestChild = node.left;
        } else if (node.left === null) {
          bestChild = node.right;
        } else {
          if (point[dimension] < node.obj[dimension]) {
            bestChild = node.left;
          } else {
            bestChild = node.right;
          }
        }

		//recursive search
        nearestSearch(bestChild);

        if (bestNodes.size() < maxNodes || ownDistance < bestNodes.peek()[1]) {
          saveNode(node, ownDistance);
        }

		//if there's still room or the current distance is nearer than the best distance
        if (bestNodes.size() < maxNodes || Math.abs(linearDistance) < bestNodes.peek()[1]) {
          if (bestChild === node.left) {
            otherChild = node.right;
          } else {
            otherChild = node.left;
          }
          if (otherChild !== null) {
            nearestSearch(otherChild);
          }
        }
      }

      if (maxDistance) {
        for (i = 0; i < maxNodes; i += 1) {
          bestNodes.push([null, maxDistance]);
        }
      }

      nearestSearch(self.root);

      result = [];

      for (i = 0; i < maxNodes; i += 1) {
        if (bestNodes.content[i][0]) {
          result.push([bestNodes.content[i][0], bestNodes.content[i][1]]);
        }
      }
      return result;
    };
	
  }

  // Binary heap implementation from:
  // http://eloquentjavascript.net/appendix2.html

  function BinaryHeap(scoreFunction){
    this.content = [];
    this.scoreFunction = scoreFunction;
  }

  BinaryHeap.prototype = {
    push: function(element) {
      // Add the new element to the end of the array.
      this.content.push(element);
      // Allow it to bubble up.
      this.bubbleUp(this.content.length - 1);
    },

    pop: function() {
      // Store the first element so we can return it later.
      var result = this.content[0];
      // Get the element at the end of the array.
      var end = this.content.pop();
      // If there are any elements left, put the end element at the
      // start, and let it sink down.
      if (this.content.length > 0) {
        this.content[0] = end;
        this.sinkDown(0);
      }
      return result;
    },

    peek: function() {
      return this.content[0];
    },

    remove: function(node) {
      var len = this.content.length;
      // To remove a value, we must search through the array to find
      // it.
      for (var i = 0; i < len; i++) {
        if (this.content[i] == node) {
          // When it is found, the process seen in 'pop' is repeated
          // to fill up the hole.
          var end = this.content.pop();
          if (i != len - 1) {
            this.content[i] = end;
            if (this.scoreFunction(end) < this.scoreFunction(node))
              this.bubbleUp(i);
            else
              this.sinkDown(i);
          }
          return;
        }
      }
      throw new Error("Node not found.");
    },

    size: function() {
      return this.content.length;
    },

    bubbleUp: function(n) {
      // Fetch the element that has to be moved.
      var element = this.content[n];
      // When at 0, an element can not go up any further.
      while (n > 0) {
        // Compute the parent element's index, and fetch it.
        var parentN = Math.floor((n + 1) / 2) - 1,
            parent = this.content[parentN];
        // Swap the elements if the parent is greater.
        if (this.scoreFunction(element) < this.scoreFunction(parent)) {
          this.content[parentN] = element;
          this.content[n] = parent;
          // Update 'n' to continue at the new position.
          n = parentN;
        }
        // Found a parent that is less, no need to move it further.
        else {
          break;
        }
      }
    },

    sinkDown: function(n) {
      // Look up the target element and its score.
      var length = this.content.length,
          element = this.content[n],
          elemScore = this.scoreFunction(element);

      while(true) {
        // Compute the indices of the child elements.
        var child2N = (n + 1) * 2, child1N = child2N - 1;
        // This is used to store the new position of the element,
        // if any.
        var swap = null;
        // If the first child exists (is inside the array)...
        if (child1N < length) {
          // Look it up and compute its score.
          var child1 = this.content[child1N],
              child1Score = this.scoreFunction(child1);
          // If the score is less than our element's, we need to swap.
          if (child1Score < elemScore)
            swap = child1N;
        }
        // Do the same checks for the other child.
        if (child2N < length) {
          var child2 = this.content[child2N],
              child2Score = this.scoreFunction(child2);
          if (child2Score < (swap === null ? elemScore : child1Score)){
            swap = child2N;
          }
        }

        // If the element needs to be moved, swap it, and continue.
        if (swap !== null) {
          this.content[n] = this.content[swap];
          this.content[swap] = element;
          n = swap;
        }
        // Otherwise, we are done.
        else {
          break;
        }
      }
    }
  };

  this.kdTree = kdTree;

  if (typeof exports !== 'undefined') {
    exports.kdTree = kdTree;
    exports.BinaryHeap = BinaryHeap;
  }
})();