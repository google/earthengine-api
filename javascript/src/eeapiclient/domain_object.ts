/**
 * Utility map for ClassMetadata to describe how to create instances of child
 * properties.
 */

export type ObjectMap<T> = {
  [key: string]: T
};

export interface ObjectMapMetadata {
  isPropertyArray: boolean;
  isValueArray: boolean;
  isSerializable: boolean;
  ctor: SerializableCtor<ISerializable>|null;
}

/** Primitive types used in ISerializable fields. */
type Primitive = string|number|boolean|null|undefined;

/**
 * Mapped type that annotates all nested fields on an object as optional,
 * while stripping unwanted ISerializable-related fields from the type.
 *
 * i.e., {a: {b: {c: boolean}}} gets transformed into {a?: {b?: {c?: boolean}}}
 */
export type DeepPartialISerializable<T> =
    T extends Primitive ? Partial<T>: T extends object ?
    Omit<
        {[K in keyof T]?: DeepPartialISerializable<T[K]>},
        'Serializable$get'|'Serializable$has'|'Serializable$set'|
        'getClassMetadata'|'getConstructor'|'getPartialClassMetadata'>:
    unknown;

/**
 * Description of the properties in a Serializable class.
 */
export interface ClassMetadata {
  arrays: ObjectMap<SerializableCtor<ISerializable>>;
  keys: string[];
  objects: ObjectMap<SerializableCtor<ISerializable>>;
  objectMaps: ObjectMap<ObjectMapMetadata>;
  descriptions: ObjectMap<string>;
  // Use {} since enums are all different types.
  enums: ObjectMap<{}>;
  emptyArrayIsUnset: boolean;
}

class NullClass {}

/**
 * A special "primitive" value that will be serialized to null.
 */
export const NULL_VALUE = new NullClass();

// tslint:disable-next-line:interface-name
export interface ISerializable {
  getClassMetadata(): ClassMetadata;
  getConstructor(): SerializableCtor<ISerializable>;

  /**
   * Gets a value by the metadata key.
   * Intended for internal use only.
   */
  // tslint:disable-next-line:no-any Serializables work with arbitrary data
  Serializable$get(key: string): any;

  /**
   * Sets a value by the metadata key.
   * Intended for internal use only.
   */
  // tslint:disable-next-line:no-any Serializables work with arbitrary data
  Serializable$set(key: string, value: any): void;

  /**
   * Checks whether the key has a non-null and non-undefined value.
   * Intended for internal use only.
   */
  Serializable$has(key: string): boolean;
}

/**
 * Function that allows users to just specify the parts of ClassMetadata they
 * want to specify, and getting empty values for the rest. If every user uses
 * this, then we can add new fields to ClassMetadata without updating all users.
 */
export function buildClassMetadataFromPartial(
    partialClassMetadata: Partial<ClassMetadata>): ClassMetadata {
  return {
    arrays: {},
    descriptions: {},
    keys: [],
    objectMaps: {},
    objects: {},
    enums: {},
    emptyArrayIsUnset: false,
    ...partialClassMetadata,
  };
}

/**
 * Abstract base for any Api Client object that can be serialized and sent via
 * API services. We use this abstract base class to organize serialization
 * logic in typescript code, rather than putting all serialization in the
 * generated classes. This allows flexibility in changing shared implementation
 * details, while letting the generated domain object classes focus only on
 * exposing their properties and types.
 */
export abstract class Serializable implements ISerializable {
  // NB: Serializable$ is a prefix to prevent internal mangling.
  // tslint:disable-next-line:enforce-name-casing See above.
  private readonly Serializable$values: ObjectMap<{}> = {};

  getClassMetadata(): ClassMetadata {
    return buildClassMetadataFromPartial(this.getPartialClassMetadata());
  }
  abstract getConstructor(): SerializableCtor<ISerializable>;

  // Subclasses do not just directly implement getClassMetadata to reduce the
  // size of generated classes when only some fields are populated.
  abstract getPartialClassMetadata(): Partial<ClassMetadata>;

  /**
   * Gets a value by the metadata key.
   * Intended for internal use only.
   */
  // tslint:disable-next-line:no-any Serializables work with arbitrary data
  Serializable$get(key: string): any {
    return this.Serializable$values.hasOwnProperty(key) ?
        this.Serializable$values[key] :
        null;
  }

  /**
   * Sets a value by the metadata key.
   * Intended for internal use only.
   */
  // tslint:disable-next-line:no-any Serializables work with arbitrary data
  Serializable$set(key: string, value: any): void {
    this.Serializable$values[key] = value;
  }

  /**
   * Checks whether the key has a non-null and non-undefined value.
   * Intended for internal use only.
   */
  Serializable$has(key: string): boolean {
    // This method doesn't use `key in this.Serializable$values` because the
    // constructor explicitly sets all known keys to `null`.
    return this.Serializable$values[key] != null;
  }
}

/** Constructs an ISerializable instance. */
export interface SerializableCtor<T extends ISerializable> {
  new(): T;
}

/**
 * Makes a deep copy of the ISerializable instance.
 */
export function clone<T extends ISerializable>(serializable: T): T {
  return deserialize(
      serializable.getConstructor() as SerializableCtor<T>,
      serialize(serializable));
}

/**
 * Checks whether a serializable object is empty. Empty is defined as an object
 * with none of the properties set to a non-default value. This allows code to
 * create an empty model without having to keep state tracking whether an object
 * has been modified.
 *
 * Since this calls serialize, it is a relatively expensive operation and should
 * be used sparingly.
 */
export function isEmpty(serializable: ISerializable): boolean {
  return !Object.keys(serialize(serializable)).length;
}

/**
 * Creates a new anonymous object and copies the data from the Serializable
 * instance into the object. Recursively calls deepCopy for each sub component.
 * This results in a deep clone meaning that no reference types are shared
 * between the passed in instance and the returned object.
 */
// tslint:disable-next-line:no-any
export function serialize(serializable: ISerializable): ObjectMap<any> {
  return deepCopy(
      serializable, serializeGetter, serializeSetter, serializeInstanciator);
}

function serializeGetter(key: string, obj: unknown) {
  return (obj as ISerializable).Serializable$get(key);
}

function serializeSetter(key: string, obj: {}, value: {}) {
  (obj as ObjectMap<{}>)[key] = value;
}

function serializeInstanciator(ctor: CopyConstructor) {
  return ({} as ObjectMap<{}>);
}

/**
 * Creates a new instance of the ISerializable and recursively copies
 * the data from the raw input to the new class instances.
 */
export function deserialize<T extends ISerializable>(
    type: SerializableCtor<T>, raw?: unknown): T {
  const result = new type();
  if (raw == null) {
    return result;
  }
  return deepCopy(
             raw, deserializeGetter, deserializeSetter, deserializeInstanciator,
             type) as T;
}

function deserializeGetter(key: string, obj: unknown) {
  return (obj as ObjectMap<{}>)[key];
}

function deserializeSetter(key: string, obj: {}, value: {}) {
  (obj as ISerializable).Serializable$set(key, value);
}

function deserializeInstanciator(ctor: CopyConstructor) {
  if (ctor == null) {
    throw new Error('Cannot deserialize, target constructor was null.');
  }
  return new ctor();
}

/**
 * A strict version of the deserialize function that restricts the type of the
 * serialized object to be an optional subset of the specified ISerializable
 * class.
 */
export function strictDeserialize<T extends ISerializable>(
    type: SerializableCtor<T>, raw: DeepPartialISerializable<T>) {
  return deserialize(type, raw);
}

type CopyValueGetter = (key: string, obj: unknown) => {};
type CopyValueSetter = (key: string, obj: {}, value: {}) => void;
type CopyConstructor = SerializableCtor<ISerializable>|null|undefined;
type CopyInstanciator<T> = (ctor: CopyConstructor) => T;

/**
 * Helper function used to generate deep copies of objects that can be
 * described by ClassMetadata. It is used by by serialize and deserialize.
 * This function is called recursively via deepCopyObjectMap and
 * deepCopyValue.
 *
 * @param source The object to copy data from.
 * @param valueGetter Function used to access properties on the source.
 * @param valueSetter Function used to set property values on the target.
 * @param copyInstanciator Function used to make new target instances.
 * @param targetConstructor Optional. The target's constructor function.
 */
function deepCopy<T>(
    source: unknown, valueGetter: CopyValueGetter, valueSetter: CopyValueSetter,
    copyInstanciator: CopyInstanciator<T>,
    targetConstructor?: CopyConstructor): T {
  const target = copyInstanciator(targetConstructor);
  const metadata = deepCopyMetadata(source, target);

  const keys = metadata.keys || [];
  const arrays = metadata.arrays || {};
  const objects = metadata.objects || {};
  const objectMaps = metadata.objectMaps || {};

  for (const key of keys) {
    const value = valueGetter(key, source);
    if (value == null) continue;

    let copy: {};
    if (arrays.hasOwnProperty(key)) {
      // Explicitly an array, treat as Serializables
      if (metadata.emptyArrayIsUnset && (value as Array<{}>).length === 0) {
        continue;
      }
      copy = deepCopyValue(
          value, valueGetter, valueSetter, copyInstanciator, true, true,
          arrays[key]);

    } else if (objects.hasOwnProperty(key)) {
      // Explicitly a serializable object
      copy = deepCopyValue(
          value, valueGetter, valueSetter, copyInstanciator, false, true,
          objects[key]);

    } else if (objectMaps.hasOwnProperty(key)) {
      // Serialize all the values in an object map.
      const mapMetadata = objectMaps[key];
      copy = mapMetadata.isPropertyArray ?
          (value as Array<ObjectMap<{}>>)
              .map(
                  v => deepCopyObjectMap(
                      v, mapMetadata, valueGetter, valueSetter,
                      copyInstanciator)) :
          deepCopyObjectMap(
              value, mapMetadata, valueGetter, valueSetter, copyInstanciator);

    } else if (Array.isArray(value)) {  // This needs to be second to last!
      // Implicitly an array, treat as primitives
      if (metadata.emptyArrayIsUnset && value.length === 0) {
        continue;
      }
      copy = deepCopyValue(
          value, valueGetter, valueSetter, copyInstanciator, true, false);

    } else if (value instanceof NullClass) {
      copy = null as unknown as {};

    } else {
      copy = value;
    }

    valueSetter(key, target, copy);
  }
  return target;
}

function deepCopyObjectMap<T>(
    value: ObjectMap<{}>, mapMetadata: ObjectMapMetadata,
    valueGetter: CopyValueGetter, valueSetter: CopyValueSetter,
    copyInstanciator: CopyInstanciator<T>) {
  const objMap: ObjectMap<{}> = {};
  for (const mapKey of Object.keys(value)) {
    const mapValue = value[mapKey];
    if (mapValue == null) continue;
    objMap[mapKey] = deepCopyValue(
        mapValue, valueGetter, valueSetter, copyInstanciator,
        mapMetadata.isValueArray, mapMetadata.isSerializable, mapMetadata.ctor);
  }
  return objMap;
}

function deepCopyValue<T>(
    value: {}, valueGetter: CopyValueGetter, valueSetter: CopyValueSetter,
    copyInstanciator: CopyInstanciator<T>, isArray: boolean, isRef: boolean,
    ctor?: CopyConstructor) {
  if (isRef && ctor == null) {
    throw new Error(
        'Cannot deserialize a reference object without a constructor.');
  }

  if (value == null) {
    return value;
  }

  let deserialized: {};
  if (isArray && isRef) {
    deserialized =
        (value as ISerializable[])
            .map(
                v => deepCopy(
                    v, valueGetter, valueSetter, copyInstanciator, ctor));

  } else if (isArray && !isRef) {
    deserialized = (value as Array<{}>).map((v) => v);

  } else if (!isArray && isRef) {
    deserialized =
        deepCopy(value, valueGetter, valueSetter, copyInstanciator, ctor);

  } else if (value instanceof NullClass) {
    deserialized = null as unknown as {};

  } else if (typeof value === 'object') {
    // TODO(user): Assert as a type, declared interface, or `unknown`.
    // tslint:disable-next-line:ban-types no-unnecessary-type-assertion
    deserialized = JSON.parse(JSON.stringify(value)) as AnyDuringMigration;

  } else {
    deserialized = value;
  }
  return deserialized;
}

function deepCopyMetadata(source: unknown, target: {}) {
  let metadata;
  if (target instanceof Serializable) {
    metadata = target.getClassMetadata();
  } else if (source instanceof Serializable) {
    metadata = source.getClassMetadata();
  } else {
    throw new Error('Cannot find ClassMetadata.');
  }
  return metadata;
}


/**
 * Returns whether or not the two serializable objects are deeply equal. The
 * traversal logic should be identical to that of serialize.
 */
export function deepEquals(
    serializable1: ISerializable, serializable2: ISerializable): boolean {
  const metadata1 = serializable1.getClassMetadata();
  const keys1 = metadata1.keys || [];
  const arrays1 = metadata1.arrays || {};
  const objects1 = metadata1.objects || {};
  const objectMaps1 = metadata1.objectMaps || {};

  const metadata2 = serializable2.getClassMetadata();
  const keys2 = metadata2.keys || [];
  const arrays2 = metadata2.arrays || {};
  const objects2 = metadata2.objects || {};
  const objectMaps2 = metadata2.objectMaps || {};

  if (!(sameKeys(keys1, keys2) && sameKeys(arrays1, arrays2) &&
        sameKeys(objects1, objects2) && sameKeys(objectMaps1, objectMaps2))) {
    return false;
  }

  for (const key of keys1) {
    // There's some issues here with unintended side effects. When using
    // defaults = "mutable", we have to return a mutable object, and repeated
    // calls must return the *same* mutable object. To do that, accessing a
    // complex property (array or object) will create and set that object, so
    // simply accessing it will have the side effect of making the parent have
    // that field set. Basically, the means:
    //
    // const foo = new Foo();
    // const bar = new Foo();
    // foo.a;
    // deepEquals(foo, bar) === false
    //
    // which isn't what anyone expects, but is the least bad option for what
    // they want. A "common" proposal to fix deepEquals is to just access
    // everything right here, but of course that's wrong because we *don't* want
    // any side effects - eg if you serialize that object, it'll send an empty
    // array over the wire or similar.
    //
    // So what really should be a TODO is to make this comparison aware of
    // the concept of default values at times, and know how to compare defaults
    // without the side effect of setting values. Which will be difficult.
    //
    // The story for arrays is a bit different. There we follow protobuf
    // semantics, where an unset array and empty array are indistinguishable.
    const has1 = hasAndIsNotEmptyArray(serializable1, key, metadata1);
    const has2 = hasAndIsNotEmptyArray(serializable2, key, metadata2);
    if (has1 !== has2) {
      return false;
    }
    if (!has1) {
      continue;
    }

    const value1 = serializable1.Serializable$get(key);
    const value2 = serializable2.Serializable$get(key);

    if (arrays1.hasOwnProperty(key)) {
      if (!deepEqualsValue(value1, value2, true, true)) {
        return false;
      }

    } else if (objects1.hasOwnProperty(key)) {
      if (!deepEqualsValue(value1, value2, false, true)) {
        return false;
      }

    } else if (objectMaps1.hasOwnProperty(key)) {
      const mapMetadata = objectMaps1[key];
      if (mapMetadata.isPropertyArray) {
        if (!sameKeys(value1, value2)) {
          return false;
        }
        const value1Arr = value1 as Array<ObjectMap<{}>>;
        if (value1Arr.some(
                (v1, i) => !deepEqualsObjectMap(v1, value2[i], mapMetadata))) {
          return false;
        }
      } else if (!deepEqualsObjectMap(value1, value2, mapMetadata)) {
        return false;
      }

    } else if (Array.isArray(value1)) {  // This needs to be second to last!
      if (!deepEqualsValue(value1, value2, true, false)) {
        return false;
      }

    } else if (!deepEqualsValue(value1, value2, false, false)) {
      return false;
    }
  }
  return true;
}

function hasAndIsNotEmptyArray(
    serializable: ISerializable, key: string,
    metadata: ClassMetadata): boolean {
  if (!serializable.Serializable$has(key)) return false;
  if (!metadata.emptyArrayIsUnset) return true;
  const value = serializable.Serializable$get(key);
  if (Array.isArray(value)) return value.length !== 0;
  return true;
}

function deepEqualsObjectMap(
    value1: ObjectMap<{}>, value2: ObjectMap<{}>,
    mapMetadata: ObjectMapMetadata) {
  if (!sameKeys(value1, value2)) {
    return false;
  }

  for (const mapKey of Object.keys(value1)) {
    const mapValue1 = value1[mapKey];
    const mapValue2 = value2[mapKey];

    if (!deepEqualsValue(
            mapValue1, mapValue2, mapMetadata.isValueArray,
            mapMetadata.isSerializable)) {
      return false;
    }
  }

  return true;
}

function deepEqualsValue(
    value1: {}, value2: {}, isArray: boolean, isSerializable: boolean) {
  if (value1 == null && value2 == null) {
    return true;
  }

  if (isArray && isSerializable) {
    if (!sameKeys(value1, value2)) {
      return false;
    }
    const serializableArr1 = (value1 as ISerializable[]);
    const serializableArr2 = (value2 as ISerializable[]);
    if (serializableArr1.some(
            (v1, i) => !deepEquals(v1, serializableArr2[i]))) {
      return false;
    }

  } else if (isArray && !isSerializable) {
    if (!sameKeys(value1, value2)) {
      return false;
    }
    const arr1 = value1 as Array<{}>;
    const arr2 = value2 as Array<{}>;
    if (arr1.some((v, i) => v !== arr2[i])) {
      return false;
    }

  } else if (isSerializable) {
    return deepEquals(value1 as ISerializable, value2 as ISerializable);

  } else if (typeof value1 === 'object') {
    if (JSON.stringify(value1) !== JSON.stringify(value2)) {
      return false;
    }
  } else if (value1 !== value2) {
    return false;
  }

  return true;
}

function sameKeys<T>(a: T, b: T) {
  if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error('Types are not comparable.');
  }
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) {
    return false;
  }

  if (!Array.isArray(a)) {
    aKeys.sort();
    bKeys.sort();
  }

  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Use with jasmine.addCustomEqualityTester to perform deep semantic
 * comparisons of serializable objects. This considers an unset list and an
 * empty list to be the same, and it might hide additional differences due to
 * implementation details in the future.
 */
export function serializableEqualityTester(
    left: unknown, right: unknown): boolean|undefined {
  if (left instanceof Serializable && right instanceof Serializable) {
    return deepEquals(left, right);
  }
  return undefined;  // Do not change behavior for other types.
}
