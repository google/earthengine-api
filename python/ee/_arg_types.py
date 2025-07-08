"""Internal types used to represent arguments to the API."""
from __future__ import annotations

from collections.abc import Sequence
import datetime
from typing import Any as AnyType, Union

from ee import classifier
from ee import clusterer
from ee import computedobject
from ee import confusionmatrix
from ee import daterange
from ee import dictionary
from ee import ee_array
from ee import ee_date
from ee import ee_list
from ee import ee_number
from ee import ee_string
from ee import element
from ee import errormargin
from ee import featurecollection
from ee import filter as ee_filter
from ee import image
from ee import imagecollection
from ee import kernel
from ee import projection
from ee import reducer

Array = Union[
    AnyType,
    list[AnyType],
    ee_array.Array,
    ee_list.List,
    computedobject.ComputedObject,
]
Bool = Union[bool, AnyType, computedobject.ComputedObject]
Classifier = Union[classifier.Classifier, computedobject.ComputedObject]
Clusterer = Union[clusterer.Clusterer, computedobject.ComputedObject]
ConfusionMatrix = Union[
    confusionmatrix.ConfusionMatrix, computedobject.ComputedObject
]
Date = Union[
    datetime.datetime, float, str, ee_date.Date, computedobject.ComputedObject
]
DateRange = Union[daterange.DateRange, computedobject.ComputedObject]
Dictionary = Union[
    dict[AnyType, AnyType],
    Sequence[AnyType],
    dictionary.Dictionary,
    computedobject.ComputedObject,
]
Any = Union[AnyType, computedobject.ComputedObject]
Element = Union[AnyType, element.Element, computedobject.ComputedObject]
ErrorMargin = Union[
    float,
    ee_number.Number,
    errormargin.ErrorMargin,
    computedobject.ComputedObject,
]
FeatureCollection = Union[
    AnyType, featurecollection.FeatureCollection, computedobject.ComputedObject
]
Filter = Union[ee_filter.Filter, computedobject.ComputedObject]
Geometry = Union[AnyType, computedobject.ComputedObject]
Image = Union[AnyType, image.Image, computedobject.ComputedObject]
ImageCollection = Union[
    AnyType, imagecollection.ImageCollection, computedobject.ComputedObject
]
Integer = Union[int, ee_number.Number, computedobject.ComputedObject]
Kernel = Union[kernel.Kernel, computedobject.ComputedObject]
List = Union[
    list[AnyType],
    tuple[()],
    tuple[AnyType, AnyType],
    ee_list.List,
    computedobject.ComputedObject,
]
Number = Union[float, ee_number.Number, computedobject.ComputedObject]
Projection = Union[
    str,
    ee_string.String,
    projection.Projection,
    computedobject.ComputedObject,
]
Reducer = Union[reducer.Reducer, computedobject.ComputedObject]
String = Union[str, ee_string.String, computedobject.ComputedObject]
