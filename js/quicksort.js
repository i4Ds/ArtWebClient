/**
 * In-place quicksort for typed arrays (e.g. for Float32Array)
 * provides fast sorting
 * useful e.g. for a custom shader and/or BufferGeometry
 *
 * @author Roman Bolzern <roman.bolzern@fhnw.ch>, 2013
 * @author I4DS http://www.fhnw.ch/i4ds, 2013
 * @license MIT License <http://www.opensource.org/licenses/mit-license.php>
 *
 * Complexity: http://bigocheatsheet.com/ see Quicksort
 *
 * Example: 
 * points: [x, y, z, x, y, z, x, y, z, ...]
 * eleSize: 3 //because of (x, y, z)
 * orderElement: 0 //order according to x
 */

function quickSortIP(arr, eleSize, orderElement) {
    var stack = [];
    var sp = -1;
    var left = 0;
    var right = (arr.length) / eleSize - 1;
	var tmp = 0.0, x = 0, y = 0;
	var swapF = function(a, b) {
		a *= eleSize; b *= eleSize;
		for (y = 0; y < eleSize; y++) {
			tmp=arr[a + y];
			arr[a + y]=arr[b + y];
			arr[b + y]=tmp;
		}
	};
	
    var i, j, swap = new Float32Array(eleSize), temp = new Float32Array(eleSize);
    while(true) {
        if(right - left <= 25){
            for(j=left+1; j<=right; j++) {
				for (x = 0; x < eleSize; x++) {
					swap[x] = arr[j * eleSize + x];
				}
                i = j-1;
                while(i >= left && arr[i * eleSize + orderElement] > swap[orderElement]) {
					for (x = 0; x < eleSize; x++) {
						arr[(i+1) * eleSize + x] = arr[i * eleSize + x];
					}
					i--;
                }
				for (x = 0; x < eleSize; x++) {
					arr[(i+1) * eleSize + x] = swap[x];
				}
            }
            if(sp == -1)    break;
            right = stack[sp--]; //?
            left = stack[sp--];
        } else {
            var median = (left + right) >> 1;
            i = left + 1;
            j = right;
			
			swapF(median, i);
            //swap = arr[median]; arr[median] = arr[i]; arr[i] = swap;
            if(arr[left * eleSize + orderElement] > arr[right * eleSize + orderElement]) {
				swapF(left, right);
                //swap = arr[left]; arr[left] = arr[right]; arr[right] = swap;
            } if(arr[i * eleSize + orderElement] > arr[right * eleSize + orderElement]) {
				swapF(i, right);
                //swap = arr[i]; arr[i] = arr[right]; arr[right] = swap;
            } if(arr[left * eleSize + orderElement] > arr[i * eleSize + orderElement]) {
				swapF(left, i);
                //swap = arr[left]; arr[left] = arr[i]; arr[i] = swap;
            }
			for (x = 0; x < eleSize; x++) {
				temp[x] = arr[i * eleSize + x];
			}
            while(true){
                do i++; while(arr[i * eleSize + orderElement] < temp[orderElement]);
                do j--; while(arr[j * eleSize + orderElement] > temp[orderElement]);
                if(j < i)    break;
				swapF(i, j);
                //swap = arr[i]; arr[i] = arr[j]; arr[j] = swap;
            }
			for (x = 0; x < eleSize; x++) {
				arr[(left + 1) * eleSize + x] = arr[j * eleSize + x];
				arr[j * eleSize + x] = temp[x];
			}
            if(right - i + 1 >= j - left){
                stack[++sp] = i;
                stack[++sp] = right;
                right = j - 1;
            }else{
                stack[++sp] = left;
                stack[++sp] = j - 1;
                left = i;
            }
        }
    }
    return arr;
}