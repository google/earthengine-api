// Unary band operators
//
// The following operators apply unary functions to all the values
// of all the bands of an image.  The resulting values are always doubles.
// sin() - The sine of the original value in radians.
// cos() - The cosine of the original value in radians.
// tan() - The tangent of the original value in radians.
// asin() - The arc sine of the original value in radians.
// acos() - The arc cosine of the original value in radians.
// atan() - The arc tangent of the original value in radians.
// sinh() - The hyperbolic sine of the original value.
// cosh() - The hyperbolic cosine of the original value.
// tanh() - The hyperbolic tangent of the original value.
// sqrt() - The square root of the original value.
// log() - The natural logarithm of the original value.
// log10() - The base-10 logarithm of the original value.
// exp() - The Euler's number e raised to the power of the original value.
// abs() - The absolute value of the original value.
// floor() - The largest integer less than or equal to the original value.
// ceil() - The smallest integer greater than or equal to the original value.
// round() - The original value rounded to the nearest integer.

var image = ee.Image('srtm90_v4');
var sqrt = image.sqrt();

centerMap(-119.74, 46.59, 8);
addToMap(image, {min: 0, max: 4000}, 'Full stretch');
addToMap(sqrt, {min: 0, max: 64}, 'Square root stretch');
