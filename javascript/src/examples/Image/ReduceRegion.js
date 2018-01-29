// Image.reduceRegion example
//
// Computes a simple reduction over a region of an image.  A reduction
// is any process that takes an arbitrary number of inputs (such as
// all the pixels of an image in a given region) and computes one or
// more fixed outputs.  The result is a dictionary that contains the
// computed values, which in this example is the maximum pixel value
// in the region.

// This example shows how to print the resulting dictionary to the
// console, which is useful when developing and debugging your
// scripts, but in a larger workflow you might instead use the
// Dicitionary.get() function to extract the values you need from the
// dictionary for use as inputs to other functions.

// The input image to reduce, in this case an SRTM elevation map.
var image = ee.Image('CGIAR/SRTM90_V4');

// The region to reduce within.
var poly = ee.Geometry.Rectangle([-109.05, 41, -102.05, 37]);

// Reduce the image within the given region, using a reducer that
// computes the max pixel value.  We also specify the spatial
// resolution at which to perform the computation, in this case 200
// meters.
var max = image.reduceRegion({
  reducer: ee.Reducer.max(),
  geometry: poly,
  scale: 200
});

// Print the result (a Dictionary) to the console.
print(max);
