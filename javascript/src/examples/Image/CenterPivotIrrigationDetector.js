// Center-pivot Irrigation Detector.
//
// Finds circles that are 500m in radius.
Map.setCenter(-106.06, 37.71, 12);

// A nice EVI palette.
var palette = [
  'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718',
  '74A901', '66A000', '529400', '3E8601', '207401', '056201',
  '004C00', '023B01', '012E01', '011D01', '011301'];

// Just display the image with the palette.
var image = ee.Image('LT5_L1T_8DAY_EVI/20110618');
Map.addLayer(image, {min: 0, max: 1, palette: palette}, 'Landsat EVI');

// Find the difference between convolution with circles and squares.
// This difference, in theory, will be strongest at the center of
// circles in the image. This region is filled with circular farms
// with radii on the order of 500m.
var farmSize = 500;  // Radius of a farm, in meters.
var circleKernel = ee.Kernel.circle(farmSize, 'meters');
var squareKernel = ee.Kernel.square(farmSize, 'meters');
var circles = image.convolve(circleKernel);
var squares = image.convolve(squareKernel);
var diff = circles.subtract(squares);

// Scale by 100 and find the best fitting pixel in each neighborhood.
var diff = diff.abs().multiply(100).toByte();
var max = diff.focal_max({radius: farmSize * 1.8, units: 'meters'});
// If a pixel isn't the local max, set it to 0.
var local = diff.where(diff.neq(max), 0);
var thresh = local.gt(2);

// Here, we highlight the maximum differences as "Kernel Peaks"
// and draw them in red.
var peaks = thresh.focal_max({kernel: circleKernel});
Map.addLayer(peaks.mask(peaks), {palette: 'FF3737'}, 'Kernel Peaks');

// Detect the edges of the features.  Discard the edges with lower intensity.
var canny = ee.Algorithms.CannyEdgeDetector(image, 0);
canny = canny.gt(0.3);

// Create a "ring" kernel from two circular kernels.
var inner = ee.Kernel.circle(farmSize - 20, 'meters', false, -1);
var outer = ee.Kernel.circle(farmSize + 20, 'meters', false, 1);
var ring = outer.add(inner, true);

// Highlight the places where the feature edges best match the circle kernel.
var centers = canny.convolve(ring).gt(0.5).focal_max({kernel: circleKernel});
Map.addLayer(centers.mask(centers), {palette: '4285FF'}, 'Ring centers');
