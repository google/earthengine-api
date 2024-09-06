"""A slippy map GUI.

Implements a tiled slippy map using Tk canvas. Displays map tiles using
whatever projection the tiles are in and only knows about tile coordinates,
(as opposed to geospatial coordinates.)  This assumes that the tile-space is
organized as a power-of-two pyramid, with the origin in the upper left corner.
This currently has several spots that are hard-coded for 256x256 tiles, even
though MapOverlay tries to track this.

Supports mouse-based pan and zoom as well as tile upsampling while waiting
for new tiles to load.  The map to display is specified by a MapOverlay, and
added to the GUI on creation or manually using addOverlay()
  gui = MapClient(MakeOverlay(mapid))

Tiles are referenced using a key of (level, x, y) throughout.

Several of the functions are named to match the Google Maps Javascript API,
and therefore violate style guidelines.
"""
# TODO(user):
# 1) Add a zoom bar.
# 2) When the move() is happening inside the Drag function, it'd be
#    a good idea to use a semaphore to keep new tiles from being added
#    and subsequently moved.

from collections import abc
import functools
import io
import math
import queue
import sys
import threading
import tkinter as Tkinter
import urllib.request
from PIL import Image
from PIL import ImageTk

# The default URL to fetch tiles from.  We could pull this from the EE library,
# however this doesn't have any other dependencies on that yet, so let's not.
BASE_URL = 'https://earthengine.googleapis.com'

# This is a URL pattern for creating an overlay from the google maps base map.
# The z, x and y arguments at the end correspond to level, x, y here.
DEFAULT_MAP_URL_PATTERN = ('http://mt1.google.com/vt/lyrs=m@176000000&hl=en&'
                           'src=app&z=%d&x=%d&y=%d')


class MapClient(threading.Thread):
  """A simple discrete zoom level map viewer."""

  def __init__(self, opt_overlay=None, opt_width=1024, opt_height=768):
    """Initialize the MapClient UI.

    Args:
      opt_overlay: A mapoverlay to display.  If not specified, the default
         Google Maps basemap is used.
      opt_width: The default width of the frame to construct.
      opt_height: The default height of the frame to construct.
    """
    threading.Thread.__init__(self)
    self.ready = False  # All initialization is done.
    self.tiles = {}     # The cached stack of images at each grid cell.
    self.tktiles = {}   # The cached PhotoImage at each grid cell.
    self.level = 2      # Starting zoom level
    self.origin_x = None   # The map origin x offset at the current level.
    self.origin_y = None   # The map origin y offset at the current level.
    self.parent = None     # A handle to the top level Tk widget.
    self.frame = None      # A handle to the Tk frame.
    self.canvas = None     # A handle to the Tk canvas
    self.width = opt_width
    self.height = opt_height
    self.anchor_x = None   # Drag anchor.
    self.anchor_y = None   # Drag anchor.

    # Map origin offsets; start at the center of the map.
    self.origin_x = (-(2 ** self.level) * 128) + self.width / 2
    self.origin_y = (-(2 ** self.level) * 128) + self.height / 2

    if not opt_overlay:
      # Default to a google maps basemap
      opt_overlay = MapOverlay(DEFAULT_MAP_URL_PATTERN)

    # The array of overlays are displayed as last on top.
    self.overlays = [opt_overlay]
    self.start()

  def run(self):
    """Set up the user interface."""
    width = self.width
    height = self.height

    # Build the UI
    self.parent = Tkinter.Tk()
    self.frame = frame = Tkinter.Frame(self.parent, width=width, height=height)
    frame.pack(fill=Tkinter.BOTH, expand=Tkinter.YES)
    self.canvas = canvas = Tkinter.Canvas(frame,
                                          width=self.GetFrameSize()[0],
                                          height=self.GetFrameSize()[1])

    canvas.pack(side=Tkinter.TOP, fill=Tkinter.BOTH, expand=Tkinter.YES)
    canvas.create_rectangle(0, 0, self.GetMapSize()[0], self.GetMapSize()[1],
                            fill='#888888')

    canvas.bind('<Button-1>', self.ClickHandler)
    canvas.bind('<ButtonRelease-1>', self.ReleaseHandler)
    # Button-4 and Button-5 are scroll wheel up/down events.
    canvas.bind('<Button-4>', functools.partial(self.Zoom, direction=1))
    canvas.bind('<Button-5>', functools.partial(self.Zoom, direction=-1))
    canvas.bind('<Double-Button-1>', functools.partial(self.Zoom, direction=1))
    frame.bind('<Configure>', self.ResizeHandler)
    frame.bind_all('<Key>', self.KeypressHandler)

    def SetReady():
      self.ready = True

    self.parent.after_idle(SetReady)
    self.parent.mainloop()

  def addOverlay(self, overlay):             # pylint: disable=g-bad-name
    """Add an overlay to the map."""
    self.overlays.append(overlay)
    self.LoadTiles()

  def GetFrameSize(self):
    if self.frame:
      return (int(self.frame.cget('width')), int(self.frame.cget('height')))
    else:
      return (self.width, self.height)

  def GetMapSize(self):
    if self.frame:
      return (int(self.canvas.cget('width')), int(self.canvas.cget('height')))
    else:
      return (self.width, self.height)

  def GetViewport(self):
    """Return the visible portion of the map as [xlo, ylo, xhi, yhi]."""
    width, height = self.GetMapSize()
    # pylint: disable=invalid-unary-operand-type
    return [-self.origin_x, -self.origin_y,
            -self.origin_x + width, -self.origin_y + height]

  def LoadTiles(self):
    """Refresh the entire map."""
    # Start with the overlay on top.
    if not self.ready:
      return
    for i, overlay in reversed(list(enumerate(self.overlays))):
      tile_list = overlay.CalcTiles(self.level, self.GetViewport())
      for key in tile_list:
        overlay.getTile(key, functools.partial(
            self.AddTile, key=key, overlay=overlay, layer=i))

  def Flush(self):
    """Empty out all the image fetching queues."""
    for overlay in self.overlays:
      overlay.Flush()

  def CompositeTiles(self, key):
    """Composite together all the tiles in this cell into a single image."""
    composite = None
    for layer in sorted(self.tiles[key]):
      image = self.tiles[key][layer]
      if not composite:
        composite = image.copy()
      else:
        composite.paste(image, (0, 0), image)
    return composite

  def AddTile(self, image, key, overlay, layer):
    """Add a tile to the map.

    This keeps track of the tiles for each overlay in each grid cell.
    As new tiles come in, all the tiles in a grid cell are composited together
    into a new tile and any old tile for that spot is replaced.

    Args:
      image: The image tile to display.
      key: A tuple containing the key of the image (level, x, y)
      overlay: The overlay this tile belongs to.
      layer: The layer number this overlay corresponds to.  Only used
          for caching purposes.
    """
    # TODO(user): This function is called from multiple threads, and
    # could use some synchronization, but it seems to work.
    if self.level == key[0]:      # Don't add late tiles from another level.
      self.tiles[key] = self.tiles.get(key, {})
      self.tiles[key][layer] = image

      newtile = self.CompositeTiles(key)
      if key not in self.tktiles:
        newtile = ImageTk.PhotoImage(newtile)
        xpos = key[1] * overlay.TILE_WIDTH + self.origin_x
        ypos = key[2] * overlay.TILE_HEIGHT + self.origin_y
        # pytype: disable=attribute-error
        self.canvas.create_image(
            xpos, ypos, anchor=Tkinter.NW, image=newtile, tags=['tile', key])
        # pytype: enable=attribute-error
        self.tktiles[key] = newtile        # Hang on to the new tile.
      else:
        self.tktiles[key].paste(newtile)

  def Zoom(self, event, direction):
    """Zoom the map.

    Args:
      event: The event that caused this zoom request.
      direction: The direction to zoom.  +1 for higher zoom, -1 for lower.
    """
    if self.level + direction >= 0:
      # Discard everything cached in the MapClient, and flush the fetch queues.
      self.Flush()
      self.canvas.delete(Tkinter.ALL)  # pytype: disable=attribute-error
      self.tiles = {}
      self.tktiles = {}

      if direction > 0:
        self.origin_x = self.origin_x * 2 - event.x
        self.origin_y = self.origin_y * 2 - event.y
      else:
        self.origin_x = (self.origin_x + event.x) / 2
        self.origin_y = (self.origin_y + event.y) / 2

      self.level += direction
      self.LoadTiles()

  def ClickHandler(self, event):
    """Records the anchor location and sets drag handler."""
    self.anchor_x = event.x
    self.anchor_y = event.y
    # pytype: disable=attribute-error
    self.canvas.bind('<Motion>', self.DragHandler)
    # pytype: enable=attribute-error

  def DragHandler(self, event):
    """Updates the map position and anchor position."""
    dx = event.x - self.anchor_x
    dy = event.y - self.anchor_y
    if dx or dy:
      self.canvas.move(Tkinter.ALL, dx, dy)  # pytype: disable=attribute-error
      self.origin_x += dx
      self.origin_y += dy
      self.anchor_x = event.x
      self.anchor_y = event.y

  def ReleaseHandler(self, event):
    """Unbind drag handler and redraw."""
    del event  # Unused.
    self.canvas.unbind('<Motion>')  # pytype: disable=attribute-error
    self.LoadTiles()

  def ResizeHandler(self, event):
    """Handle resize events."""
    # There's a 2 pixel border.
    # pytype: disable=attribute-error
    self.canvas.config(width=event.width - 2, height=event.height - 2)
    # pytype: enable=attribute-error
    self.LoadTiles()

  def CenterMap(self, lon, lat, opt_zoom=None):
    """Center the map at the given lon, lat and zoom level."""
    if self.canvas:
      self.Flush()
      self.canvas.delete(Tkinter.ALL)
      self.tiles = {}
      self.tktiles = {}
    width, height = self.GetMapSize()
    if opt_zoom is not None:
      self.level = opt_zoom

    # From maps/api/javascript/geometry/mercator_projection.ts
    mercator_range = 256.0
    scale = 2 ** self.level
    origin_x = (mercator_range / 2.0) * scale
    origin_y = (mercator_range / 2.0) * scale
    pixels_per_lon_degree = (mercator_range / 360.0) * scale
    pixels_per_lon_radian = (mercator_range / (2 * math.pi)) * scale

    x = origin_x + (lon * pixels_per_lon_degree)
    siny = math.sin(lat * math.pi / 180.0)
    # Prevent sin() overflow.
    e = 1 - 1e-15
    if siny > e:
      siny = e
    elif siny < -e:
      siny = -e
    y = origin_y + (0.5 * math.log((1 + siny) / (1 - siny)) *
                    -pixels_per_lon_radian)

    self.origin_x = -x + width / 2
    self.origin_y = -y + height / 2
    self.LoadTiles()

  def KeypressHandler(self, event):
    """Handle keypress events."""
    if event.char == 'q' or event.char == 'Q':
      self.parent.destroy()  # pytype: disable=attribute-error


class MapOverlay:
  """A class representing a map overlay."""

  TILE_WIDTH = 256
  TILE_HEIGHT = 256
  MAX_CACHE = 1000          # The maximum number of tiles to cache.
  _images = {}               # The tile cache, keyed by (url, level, x, y).
  _lru_keys = []             # Keys to the cached tiles, for cache ejection.

  def __init__(self, url, tile_fetcher=None):
    """Initialize the MapOverlay."""
    self.url = url
    self.tile_fetcher = tile_fetcher
    # Make 10 workers.
    self.queue = queue.Queue()
    self.fetchers = [MapOverlay.TileFetcher(self) for unused_x in range(10)]
    self.constant = None

  def getTile(self, key, callback):    # pylint: disable=g-bad-name
    """Get the requested tile.

    If the requested tile is already cached, it's returned (sent to the
    callback) directly.  If it's not cached, a check is made to see if
    a lower-res version is cached, and if so that's interpolated up, before
    a request for the actual tile is made.

    Args:
      key: The key of the tile to fetch.
      callback: The callback to call when the tile is available.  The callback
          may be called more than once if a low-res version is available.
    """
    result = self.GetCachedTile(key)
    if result:
      callback(result)
    else:
      # Interpolate what we have and put the key on the fetch queue.
      self.queue.put((key, callback))
      self.Interpolate(key, callback)

  def Flush(self):
    """Empty the tile queue."""
    while not self.queue.empty():
      self.queue.get_nowait()

  def CalcTiles(self, level, bbox):
    """Calculate which tiles to load based on the visible viewport.

    Args:
      level: The level at which to calculate the required tiles.
      bbox: The viewport coordinates as a tuple (xlo, ylo, xhi, yhi])

    Returns:
      The list of tile keys to fill the given viewport.
    """
    tile_list = []
    for y in range(
        int(bbox[1] / MapOverlay.TILE_HEIGHT),
        int(bbox[3] / MapOverlay.TILE_HEIGHT + 1)):
      for x in range(
          int(bbox[0] / MapOverlay.TILE_WIDTH),
          int(bbox[2] / MapOverlay.TILE_WIDTH + 1)):
        tile_list.append((level, x, y))
    return tile_list

  def Interpolate(self, key, callback):
    """Upsample a lower res tile if one is available.

    Args:
      key: The tile key to upsample.
      callback: The callback to call when the tile is ready.
    """
    level, x, y = key
    delta = 1
    result = None
    while level - delta > 0 and result is None:
      prevkey = (level - delta, x / 2, y / 2)
      result = self.GetCachedTile(prevkey)
      if not result:
        (_, x, y) = prevkey
        delta += 1

    if result:
      px = (key[1] % 2 ** delta) * MapOverlay.TILE_WIDTH / 2 ** delta
      py = (key[2] % 2 ** delta) * MapOverlay.TILE_HEIGHT / 2 ** delta
      image = (result.crop([px, py,
                            px + MapOverlay.TILE_WIDTH / 2 ** delta,
                            py + MapOverlay.TILE_HEIGHT / 2 ** delta])
               .resize((MapOverlay.TILE_WIDTH, MapOverlay.TILE_HEIGHT)))
      callback(image)

  def PutCacheTile(self, key, image):
    """Insert a new tile in the cache and eject old ones if it's too big."""
    cache_key = (self.url,) + key
    MapOverlay._images[cache_key] = image
    MapOverlay._lru_keys.append(cache_key)
    while len(MapOverlay._lru_keys) > MapOverlay.MAX_CACHE:
      remove_key = MapOverlay._lru_keys.pop(0)
      try:
        MapOverlay._images.pop(remove_key)
      except KeyError:
        # Just in case someone removed this before we did.
        pass

  def GetCachedTile(self, key):
    """Returns the specified tile if it's in the cache."""
    cache_key = (self.url,) + key
    return MapOverlay._images.get(cache_key, None)

  class TileFetcher(threading.Thread):
    """A threaded URL fetcher."""

    def __init__(self, overlay):
      threading.Thread.__init__(self)
      self.overlay = overlay
      self.daemon = True
      self.start()

    def run(self):
      """Pull URLs off the ovelay's queue and call the callback when done."""
      while True:
        (key, callback) = self.overlay.queue.get()
        # Check one more time that we don't have this yet.
        if not self.overlay.GetCachedTile(key):
          (level, x, y) = key
          if x >= 0 and y >= 0 and x <= 2 ** level-1 and y <= 2 ** level-1:
            try:
              if self.overlay.tile_fetcher is not None:
                data = self.overlay.tile_fetcher.fetch_tile(x=x, y=y, z=level)
              else:
                url = self.overlay.url % key
                data = urllib.request.urlopen(url).read()
            except Exception as e:  # pylint: disable=broad-except
              print(e, file=sys.stderr)
            else:
              # PhotoImage can't handle alpha on LA images.
              image = Image.open(io.BytesIO(data)).convert('RGBA')
              callback(image)
              self.overlay.PutCacheTile(key, image)


def MakeOverlay(mapid, baseurl=BASE_URL):
  """Create an overlay from a mapid."""
  url = (baseurl + '/map/' + mapid['mapid'] + '/%d/%d/%d?token=' +
         mapid['token'])
  return MapOverlay(url, tile_fetcher=mapid['tile_fetcher'])


#
# A global MapClient instance for addToMap convenience.
#
map_instance = None


# pylint: disable-next=g-bad-name,keyword-arg-before-vararg]
def addToMap(eeobject, vis_params=None, *args):
  """Adds a layer to the default map instance.

  Args:
      eeobject: the object to add to the map.
      vis_params: a dictionary of visualization parameters.  See
          ee.data.getMapId().
      *args: unused arguments, left for compatibility with the JS API.

  This call exists to be an equivalent to the playground addToMap() call.
  It uses a global MapInstance to hang on to "the map".  If the MapInstance
  isn't initialized, this creates a new one.
  """
  del args  # Unused.
  # Flatten any lists to comma separated strings.
  if vis_params:
    vis_params = dict(vis_params)
    for key in vis_params:
      item = vis_params.get(key)
      if (isinstance(item, abc.Iterable) and not isinstance(item, str)):
        vis_params[key] = ','.join([str(x) for x in item])

  overlay = MakeOverlay(eeobject.getMapId(vis_params))

  global map_instance
  if not map_instance:
    map_instance = MapClient()
  map_instance.addOverlay(overlay)


def centerMap(lng, lat, zoom):  # pylint: disable=g-bad-name
  """Center the default map instance at the given lat, lon and zoom values."""
  global map_instance
  if not map_instance:
    map_instance = MapClient()

  map_instance.CenterMap(lng, lat, zoom)
