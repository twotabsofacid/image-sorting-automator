import { PNG } from 'pngjs';
import fs from 'node:fs';
const width = 1366;
const height = 768;
const jump = 768;

class PngMaker {
  constructor(imgName) {
    this.imgName = imgName;
    this.png = new PNG({
      width: 1366,
      height: 768
    });
    this.start();
  }
  async createPixelArr(img) {
    return new Promise((resolve, reject) => {
      let pixels = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          let idx = (width * y + x) << 2;
          let pixel = {
            r: img.data[idx],
            g: img.data[idx + 1],
            b: img.data[idx + 2],
            a: img.data[idx + 3]
          };
          pixels.push(pixel);
        }
      }
      resolve(pixels);
    });
  }
  quickSort(arr, left = 0, right = arr.length - 1) {
    if (left < right) {
      const pivotIndex = this.partition(arr, left, right);
      this.quickSort(arr, left, pivotIndex - 1); // Sort left half
      this.quickSort(arr, pivotIndex + 1, right); // Sort right half
    }
    return arr;
  }
  partition(arr, left, right) {
    const pivot = arr[right]; // Using last element as pivot
    let i = left - 1; // Index of smaller element

    for (let j = left; j < right; j++) {
      // If current element is smaller than or equal to pivot
      if (arr[j].r <= pivot.r) {
        i++; // Increment index of smaller element
        [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
      }
    }
    // Place pivot in its correct position
    [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
    return i + 1; // Return pivot's index
  }
  shellSort(arr) {
    let n = arr.length;
    // Start with a large gap and reduce it over time
    for (let gap = Math.floor(n / 2); gap > jump; gap = Math.floor(gap / 2)) {
      // Perform insertion sort for elements at each gap
      for (let i = gap; i < n; i++) {
        let temp = arr[i];
        let j;
        // Shift elements until the correct position for arr[i] is found
        for (j = i; j >= gap && arr[j - gap].r > temp.r; j -= gap) {
          arr[j] = arr[j - gap];
        }
        // Place the original arr[i] in its correct position
        arr[j] = temp;
      }
    }
    return arr;
  }
  start() {
    const _self = this;
    fs.createReadStream(`out/${_self.imgName}.png`)
      .pipe(new PNG())
      .on('parsed', function () {
        _self
          .createPixelArr(this)
          .then((pixels) => {
            console.log('we did it', pixels);
            // Quicksort implementation
            // for (let x = 0; x < width * height - (jump + 1); x += jump) {
            //   pixels = _self.quickSort(pixels, x, x + jump);
            // }
            // Shellsort implementation
            pixels = _self.shellSort(pixels);
            for (var y = 0; y < _self.png.height; y++) {
              for (var x = 0; x < _self.png.width; x++) {
                var idx = (_self.png.width * y + x) << 2;
                _self.png.data[idx] = pixels[_self.png.width * y + x].r; // red
                _self.png.data[idx + 1] = pixels[_self.png.width * y + x].g; // green
                _self.png.data[idx + 2] = pixels[_self.png.width * y + x].b; // blue
                _self.png.data[idx + 3] = pixels[_self.png.width * y + x].a; // alpha (0 is transparent)
              }
            }
            _self.png
              .pack()
              .pipe(fs.createWriteStream(`manipulated/${_self.imgName}.png`));
          })
          .catch((err) => {
            console.log('oh no', err);
          });
      });
  }
}

new PngMaker('durst');

// export { PngMaker };
