/**
 * Earth Engine client tests.
 *
 * Pre-release test suite, intended as a sanity-check to ensure that basic
 * CommonJS support does not regress with new client API releases.
 */
describe('ee', function() {

  jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;

  beforeAll(function(done) {
    ee.initialize(null, null, done);
  });

  it('retrieves a map ID synchronously', function() {
    const image = new ee.Image('srtm90_v4');
    const map = image.getMap({'min': 0, 'max': 1000});
    expect(map.mapid).toMatch(/\w+/);
  });

  it('retrieves a map ID asynchronously', function(done) {
    const image = new ee.Image('srtm90_v4');
    image.getMap({'min': 0, 'max': 1000}, ({mapid}) => {
      expect(mapid).toMatch(/\w+/);
      done();
    });
  });

  it('retrieves image info', function(done) {
    ee.Image('srtm90_v4').getInfo((image) => {
      expect(image.type).toBe('Image');
      expect(image.bands.length).toBeGreaterThan(0);
      expect(image.version).toEqual(jasmine.any(Number));
      done();
    });
  });

  it('supports simple geometry operations', function() {
    const geometry = new ee.FeatureCollection([new ee.Feature(
        new ee.Geometry.Polygon([[
          [29.970703125, 31.522361470421437],
          [29.981689453125, 30.05007652169871],
          [32.574462890625, 30.116621582819374],
          [32.4755859375, 31.737511125687828]
        ]]),
        {'system:index': '0'})]);
    const points = ee.FeatureCollection.randomPoints(geometry, 25, 25, 1);
    expect(points).toBeTruthy();
  });

  it('supports simple band and mask operations', function() {
    const hansenImageID = 'UMD/hansen/global_forest_change_2015';
    const hansenGfcImage = new ee.Image(hansenImageID);
    let lossYear = hansenGfcImage.select(['lossyear']);
    lossYear = lossYear.mask(lossYear);
    expect(lossYear).toBeTruthy();
  });

  it('supports joins, generated functions', function(done) {
    const primary = ee.ImageCollection('LANDSAT/LC08/C01/T1_TOA')
                        .filterDate('2014-04-01', '2014-06-01')
                        .filterBounds(ee.Geometry.Point(-122.09, 37.42));

    const fluxnet =
        ee.FeatureCollection('ft:1f85fvccyKSlaZJiAta8ojlXGhgf-LPPNmICG9kQ');

    const distFilter = ee.Filter.withinDistance({
      distance: 100000,
      leftField: '.geo',
      rightField: '.geo',
      maxError: 10
    });

    const distSaveAll =
        ee.Join.saveAll({matchesKey: 'points', measureKey: 'distance'});

    const spatialJoined = distSaveAll.apply(primary, fluxnet, distFilter);

    spatialJoined.evaluate((info) => {
      expect(info.type).toBe('ImageCollection');
      expect(info.bands.length).toBeGreaterThan(0);
      expect(info.features.length).toBeGreaterThan(0);
      done();
    });
  });
});
