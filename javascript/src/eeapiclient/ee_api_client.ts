import {ApiClientHookFactory} from './api_request_hook';
import {ClassMetadata, Serializable, SerializableCtor} from './domain_object';
import {ApiClientObjectMap} from './generated_types';
import {buildQueryParams} from './request_params';
import {PromiseApiClient} from './promise_api_client';
import {PromiseRequestService} from './promise_request_service';

export type AuditLogConfigLogType =
    'LOG_TYPE_UNSPECIFIED'|'ADMIN_READ'|'DATA_WRITE'|'DATA_READ';

export interface IAuditLogConfigLogTypeEnum {
  readonly LOG_TYPE_UNSPECIFIED: AuditLogConfigLogType;
  readonly ADMIN_READ: AuditLogConfigLogType;
  readonly DATA_WRITE: AuditLogConfigLogType;
  readonly DATA_READ: AuditLogConfigLogType;

  values(): Array<AuditLogConfigLogType>;
}

export const AuditLogConfigLogTypeEnum: IAuditLogConfigLogTypeEnum = {
  ADMIN_READ: <AuditLogConfigLogType>'ADMIN_READ',
  DATA_READ: <AuditLogConfigLogType>'DATA_READ',
  DATA_WRITE: <AuditLogConfigLogType>'DATA_WRITE',
  LOG_TYPE_UNSPECIFIED: <AuditLogConfigLogType>'LOG_TYPE_UNSPECIFIED',
  values(): Array<AuditLogConfigLogType> {
    return [
      AuditLogConfigLogTypeEnum.LOG_TYPE_UNSPECIFIED,
      AuditLogConfigLogTypeEnum.ADMIN_READ,
      AuditLogConfigLogTypeEnum.DATA_WRITE, AuditLogConfigLogTypeEnum.DATA_READ
    ];
  }
};

export type AuthorizationLoggingOptionsPermissionType =
    'PERMISSION_TYPE_UNSPECIFIED'|'ADMIN_READ'|'ADMIN_WRITE'|'DATA_READ'|
    'DATA_WRITE';

export interface IAuthorizationLoggingOptionsPermissionTypeEnum {
  readonly PERMISSION_TYPE_UNSPECIFIED:
      AuthorizationLoggingOptionsPermissionType;
  readonly ADMIN_READ: AuthorizationLoggingOptionsPermissionType;
  readonly ADMIN_WRITE: AuthorizationLoggingOptionsPermissionType;
  readonly DATA_READ: AuthorizationLoggingOptionsPermissionType;
  readonly DATA_WRITE: AuthorizationLoggingOptionsPermissionType;

  values(): Array<AuthorizationLoggingOptionsPermissionType>;
}

export const AuthorizationLoggingOptionsPermissionTypeEnum:
    IAuthorizationLoggingOptionsPermissionTypeEnum = {
      ADMIN_READ: <AuthorizationLoggingOptionsPermissionType>'ADMIN_READ',
      ADMIN_WRITE: <AuthorizationLoggingOptionsPermissionType>'ADMIN_WRITE',
      DATA_READ: <AuthorizationLoggingOptionsPermissionType>'DATA_READ',
      DATA_WRITE: <AuthorizationLoggingOptionsPermissionType>'DATA_WRITE',
      PERMISSION_TYPE_UNSPECIFIED: <
          AuthorizationLoggingOptionsPermissionType>'PERMISSION_TYPE_UNSPECIFIED',
      values(): Array<AuthorizationLoggingOptionsPermissionType> {
        return [
          AuthorizationLoggingOptionsPermissionTypeEnum
              .PERMISSION_TYPE_UNSPECIFIED,
          AuthorizationLoggingOptionsPermissionTypeEnum.ADMIN_READ,
          AuthorizationLoggingOptionsPermissionTypeEnum.ADMIN_WRITE,
          AuthorizationLoggingOptionsPermissionTypeEnum.DATA_READ,
          AuthorizationLoggingOptionsPermissionTypeEnum.DATA_WRITE
        ];
      }
    };

export type CapabilitiesCapabilities = 'CAPABILITY_GROUP_UNSPECIFIED'|'PUBLIC'|
    'INTERNAL'|'EXTERNAL'|'LIMITED'|'PREAUTHORIZED'|'PREVIEW'|'CLOUD_ALPHA';

export interface ICapabilitiesCapabilitiesEnum {
  readonly CAPABILITY_GROUP_UNSPECIFIED: CapabilitiesCapabilities;
  readonly PUBLIC: CapabilitiesCapabilities;
  readonly INTERNAL: CapabilitiesCapabilities;
  readonly EXTERNAL: CapabilitiesCapabilities;
  readonly LIMITED: CapabilitiesCapabilities;
  readonly PREAUTHORIZED: CapabilitiesCapabilities;
  readonly PREVIEW: CapabilitiesCapabilities;
  readonly CLOUD_ALPHA: CapabilitiesCapabilities;

  values(): Array<CapabilitiesCapabilities>;
}

export const CapabilitiesCapabilitiesEnum: ICapabilitiesCapabilitiesEnum = {
  CAPABILITY_GROUP_UNSPECIFIED:
      <CapabilitiesCapabilities>'CAPABILITY_GROUP_UNSPECIFIED',
  CLOUD_ALPHA: <CapabilitiesCapabilities>'CLOUD_ALPHA',
  EXTERNAL: <CapabilitiesCapabilities>'EXTERNAL',
  INTERNAL: <CapabilitiesCapabilities>'INTERNAL',
  LIMITED: <CapabilitiesCapabilities>'LIMITED',
  PREAUTHORIZED: <CapabilitiesCapabilities>'PREAUTHORIZED',
  PREVIEW: <CapabilitiesCapabilities>'PREVIEW',
  PUBLIC: <CapabilitiesCapabilities>'PUBLIC',
  values(): Array<CapabilitiesCapabilities> {
    return [
      CapabilitiesCapabilitiesEnum.CAPABILITY_GROUP_UNSPECIFIED,
      CapabilitiesCapabilitiesEnum.PUBLIC,
      CapabilitiesCapabilitiesEnum.INTERNAL,
      CapabilitiesCapabilitiesEnum.EXTERNAL,
      CapabilitiesCapabilitiesEnum.LIMITED,
      CapabilitiesCapabilitiesEnum.PREAUTHORIZED,
      CapabilitiesCapabilitiesEnum.PREVIEW,
      CapabilitiesCapabilitiesEnum.CLOUD_ALPHA
    ];
  }
};

export type CloudAuditOptionsLogName =
    'UNSPECIFIED_LOG_NAME'|'ADMIN_ACTIVITY'|'DATA_ACCESS';

export interface ICloudAuditOptionsLogNameEnum {
  readonly UNSPECIFIED_LOG_NAME: CloudAuditOptionsLogName;
  readonly ADMIN_ACTIVITY: CloudAuditOptionsLogName;
  readonly DATA_ACCESS: CloudAuditOptionsLogName;

  values(): Array<CloudAuditOptionsLogName>;
}

export const CloudAuditOptionsLogNameEnum: ICloudAuditOptionsLogNameEnum = {
  ADMIN_ACTIVITY: <CloudAuditOptionsLogName>'ADMIN_ACTIVITY',
  DATA_ACCESS: <CloudAuditOptionsLogName>'DATA_ACCESS',
  UNSPECIFIED_LOG_NAME: <CloudAuditOptionsLogName>'UNSPECIFIED_LOG_NAME',
  values(): Array<CloudAuditOptionsLogName> {
    return [
      CloudAuditOptionsLogNameEnum.UNSPECIFIED_LOG_NAME,
      CloudAuditOptionsLogNameEnum.ADMIN_ACTIVITY,
      CloudAuditOptionsLogNameEnum.DATA_ACCESS
    ];
  }
};

export type ComputePixelsRequestFileFormat = 'IMAGE_FILE_FORMAT_UNSPECIFIED'|
    'JPEG'|'PNG'|'AUTO_JPEG_PNG'|'NPY'|'GEO_TIFF'|'TF_RECORD_IMAGE'|
    'MULTI_BAND_IMAGE_TILE'|'ZIPPED_GEO_TIFF'|'ZIPPED_GEO_TIFF_PER_BAND';

export interface IComputePixelsRequestFileFormatEnum {
  readonly IMAGE_FILE_FORMAT_UNSPECIFIED: ComputePixelsRequestFileFormat;
  readonly JPEG: ComputePixelsRequestFileFormat;
  readonly PNG: ComputePixelsRequestFileFormat;
  readonly AUTO_JPEG_PNG: ComputePixelsRequestFileFormat;
  readonly NPY: ComputePixelsRequestFileFormat;
  readonly GEO_TIFF: ComputePixelsRequestFileFormat;
  readonly TF_RECORD_IMAGE: ComputePixelsRequestFileFormat;
  readonly MULTI_BAND_IMAGE_TILE: ComputePixelsRequestFileFormat;
  readonly ZIPPED_GEO_TIFF: ComputePixelsRequestFileFormat;
  readonly ZIPPED_GEO_TIFF_PER_BAND: ComputePixelsRequestFileFormat;

  values(): Array<ComputePixelsRequestFileFormat>;
}

export const ComputePixelsRequestFileFormatEnum:
    IComputePixelsRequestFileFormatEnum = {
      AUTO_JPEG_PNG: <ComputePixelsRequestFileFormat>'AUTO_JPEG_PNG',
      GEO_TIFF: <ComputePixelsRequestFileFormat>'GEO_TIFF',
      IMAGE_FILE_FORMAT_UNSPECIFIED:
          <ComputePixelsRequestFileFormat>'IMAGE_FILE_FORMAT_UNSPECIFIED',
      JPEG: <ComputePixelsRequestFileFormat>'JPEG',
      MULTI_BAND_IMAGE_TILE:
          <ComputePixelsRequestFileFormat>'MULTI_BAND_IMAGE_TILE',
      NPY: <ComputePixelsRequestFileFormat>'NPY',
      PNG: <ComputePixelsRequestFileFormat>'PNG',
      TF_RECORD_IMAGE: <ComputePixelsRequestFileFormat>'TF_RECORD_IMAGE',
      ZIPPED_GEO_TIFF: <ComputePixelsRequestFileFormat>'ZIPPED_GEO_TIFF',
      ZIPPED_GEO_TIFF_PER_BAND:
          <ComputePixelsRequestFileFormat>'ZIPPED_GEO_TIFF_PER_BAND',
      values(): Array<ComputePixelsRequestFileFormat> {
        return [
          ComputePixelsRequestFileFormatEnum.IMAGE_FILE_FORMAT_UNSPECIFIED,
          ComputePixelsRequestFileFormatEnum.JPEG,
          ComputePixelsRequestFileFormatEnum.PNG,
          ComputePixelsRequestFileFormatEnum.AUTO_JPEG_PNG,
          ComputePixelsRequestFileFormatEnum.NPY,
          ComputePixelsRequestFileFormatEnum.GEO_TIFF,
          ComputePixelsRequestFileFormatEnum.TF_RECORD_IMAGE,
          ComputePixelsRequestFileFormatEnum.MULTI_BAND_IMAGE_TILE,
          ComputePixelsRequestFileFormatEnum.ZIPPED_GEO_TIFF,
          ComputePixelsRequestFileFormatEnum.ZIPPED_GEO_TIFF_PER_BAND
        ];
      }
    };

export type ConditionIam = 'NO_ATTR'|'AUTHORITY'|'ATTRIBUTION'|'SECURITY_REALM'|
    'APPROVER'|'JUSTIFICATION_TYPE'|'CREDENTIALS_TYPE'|'CREDS_ASSERTION';

export interface IConditionIamEnum {
  readonly NO_ATTR: ConditionIam;
  readonly AUTHORITY: ConditionIam;
  readonly ATTRIBUTION: ConditionIam;
  readonly SECURITY_REALM: ConditionIam;
  readonly APPROVER: ConditionIam;
  readonly JUSTIFICATION_TYPE: ConditionIam;
  readonly CREDENTIALS_TYPE: ConditionIam;
  readonly CREDS_ASSERTION: ConditionIam;

  values(): Array<ConditionIam>;
}

export const ConditionIamEnum: IConditionIamEnum = {
  APPROVER: <ConditionIam>'APPROVER',
  ATTRIBUTION: <ConditionIam>'ATTRIBUTION',
  AUTHORITY: <ConditionIam>'AUTHORITY',
  CREDENTIALS_TYPE: <ConditionIam>'CREDENTIALS_TYPE',
  CREDS_ASSERTION: <ConditionIam>'CREDS_ASSERTION',
  JUSTIFICATION_TYPE: <ConditionIam>'JUSTIFICATION_TYPE',
  NO_ATTR: <ConditionIam>'NO_ATTR',
  SECURITY_REALM: <ConditionIam>'SECURITY_REALM',
  values(): Array<ConditionIam> {
    return [
      ConditionIamEnum.NO_ATTR, ConditionIamEnum.AUTHORITY,
      ConditionIamEnum.ATTRIBUTION, ConditionIamEnum.SECURITY_REALM,
      ConditionIamEnum.APPROVER, ConditionIamEnum.JUSTIFICATION_TYPE,
      ConditionIamEnum.CREDENTIALS_TYPE, ConditionIamEnum.CREDS_ASSERTION
    ];
  }
};

export type ConditionOp =
    'NO_OP'|'EQUALS'|'NOT_EQUALS'|'IN'|'NOT_IN'|'DISCHARGED';

export interface IConditionOpEnum {
  readonly NO_OP: ConditionOp;
  readonly EQUALS: ConditionOp;
  readonly NOT_EQUALS: ConditionOp;
  readonly IN: ConditionOp;
  readonly NOT_IN: ConditionOp;
  readonly DISCHARGED: ConditionOp;

  values(): Array<ConditionOp>;
}

export const ConditionOpEnum: IConditionOpEnum = {
  DISCHARGED: <ConditionOp>'DISCHARGED',
  EQUALS: <ConditionOp>'EQUALS',
  IN: <ConditionOp>'IN',
  NOT_EQUALS: <ConditionOp>'NOT_EQUALS',
  NOT_IN: <ConditionOp>'NOT_IN',
  NO_OP: <ConditionOp>'NO_OP',
  values(): Array<ConditionOp> {
    return [
      ConditionOpEnum.NO_OP, ConditionOpEnum.EQUALS, ConditionOpEnum.NOT_EQUALS,
      ConditionOpEnum.IN, ConditionOpEnum.NOT_IN, ConditionOpEnum.DISCHARGED
    ];
  }
};

export type ConditionSys = 'NO_ATTR'|'REGION'|'SERVICE'|'NAME'|'IP';

export interface IConditionSysEnum {
  readonly NO_ATTR: ConditionSys;
  readonly REGION: ConditionSys;
  readonly SERVICE: ConditionSys;
  readonly NAME: ConditionSys;
  readonly IP: ConditionSys;

  values(): Array<ConditionSys>;
}

export const ConditionSysEnum: IConditionSysEnum = {
  IP: <ConditionSys>'IP',
  NAME: <ConditionSys>'NAME',
  NO_ATTR: <ConditionSys>'NO_ATTR',
  REGION: <ConditionSys>'REGION',
  SERVICE: <ConditionSys>'SERVICE',
  values(): Array<ConditionSys> {
    return [
      ConditionSysEnum.NO_ATTR, ConditionSysEnum.REGION,
      ConditionSysEnum.SERVICE, ConditionSysEnum.NAME, ConditionSysEnum.IP
    ];
  }
};

export type DataAccessOptionsLogMode = 'LOG_MODE_UNSPECIFIED'|'LOG_FAIL_CLOSED';

export interface IDataAccessOptionsLogModeEnum {
  readonly LOG_MODE_UNSPECIFIED: DataAccessOptionsLogMode;
  readonly LOG_FAIL_CLOSED: DataAccessOptionsLogMode;

  values(): Array<DataAccessOptionsLogMode>;
}

export const DataAccessOptionsLogModeEnum: IDataAccessOptionsLogModeEnum = {
  LOG_FAIL_CLOSED: <DataAccessOptionsLogMode>'LOG_FAIL_CLOSED',
  LOG_MODE_UNSPECIFIED: <DataAccessOptionsLogMode>'LOG_MODE_UNSPECIFIED',
  values(): Array<DataAccessOptionsLogMode> {
    return [
      DataAccessOptionsLogModeEnum.LOG_MODE_UNSPECIFIED,
      DataAccessOptionsLogModeEnum.LOG_FAIL_CLOSED
    ];
  }
};

export type EarthEngineAssetType =
    'TYPE_UNSPECIFIED'|'IMAGE'|'IMAGE_COLLECTION'|'TABLE'|'FOLDER';

export interface IEarthEngineAssetTypeEnum {
  readonly TYPE_UNSPECIFIED: EarthEngineAssetType;
  readonly IMAGE: EarthEngineAssetType;
  readonly IMAGE_COLLECTION: EarthEngineAssetType;
  readonly TABLE: EarthEngineAssetType;
  readonly FOLDER: EarthEngineAssetType;

  values(): Array<EarthEngineAssetType>;
}

export const EarthEngineAssetTypeEnum: IEarthEngineAssetTypeEnum = {
  FOLDER: <EarthEngineAssetType>'FOLDER',
  IMAGE: <EarthEngineAssetType>'IMAGE',
  IMAGE_COLLECTION: <EarthEngineAssetType>'IMAGE_COLLECTION',
  TABLE: <EarthEngineAssetType>'TABLE',
  TYPE_UNSPECIFIED: <EarthEngineAssetType>'TYPE_UNSPECIFIED',
  values(): Array<EarthEngineAssetType> {
    return [
      EarthEngineAssetTypeEnum.TYPE_UNSPECIFIED, EarthEngineAssetTypeEnum.IMAGE,
      EarthEngineAssetTypeEnum.IMAGE_COLLECTION, EarthEngineAssetTypeEnum.TABLE,
      EarthEngineAssetTypeEnum.FOLDER
    ];
  }
};

export type EarthEngineMapFileFormat = 'IMAGE_FILE_FORMAT_UNSPECIFIED'|'JPEG'|
    'PNG'|'AUTO_JPEG_PNG'|'NPY'|'GEO_TIFF'|'TF_RECORD_IMAGE'|
    'MULTI_BAND_IMAGE_TILE'|'ZIPPED_GEO_TIFF'|'ZIPPED_GEO_TIFF_PER_BAND';

export interface IEarthEngineMapFileFormatEnum {
  readonly IMAGE_FILE_FORMAT_UNSPECIFIED: EarthEngineMapFileFormat;
  readonly JPEG: EarthEngineMapFileFormat;
  readonly PNG: EarthEngineMapFileFormat;
  readonly AUTO_JPEG_PNG: EarthEngineMapFileFormat;
  readonly NPY: EarthEngineMapFileFormat;
  readonly GEO_TIFF: EarthEngineMapFileFormat;
  readonly TF_RECORD_IMAGE: EarthEngineMapFileFormat;
  readonly MULTI_BAND_IMAGE_TILE: EarthEngineMapFileFormat;
  readonly ZIPPED_GEO_TIFF: EarthEngineMapFileFormat;
  readonly ZIPPED_GEO_TIFF_PER_BAND: EarthEngineMapFileFormat;

  values(): Array<EarthEngineMapFileFormat>;
}

export const EarthEngineMapFileFormatEnum: IEarthEngineMapFileFormatEnum = {
  AUTO_JPEG_PNG: <EarthEngineMapFileFormat>'AUTO_JPEG_PNG',
  GEO_TIFF: <EarthEngineMapFileFormat>'GEO_TIFF',
  IMAGE_FILE_FORMAT_UNSPECIFIED:
      <EarthEngineMapFileFormat>'IMAGE_FILE_FORMAT_UNSPECIFIED',
  JPEG: <EarthEngineMapFileFormat>'JPEG',
  MULTI_BAND_IMAGE_TILE: <EarthEngineMapFileFormat>'MULTI_BAND_IMAGE_TILE',
  NPY: <EarthEngineMapFileFormat>'NPY',
  PNG: <EarthEngineMapFileFormat>'PNG',
  TF_RECORD_IMAGE: <EarthEngineMapFileFormat>'TF_RECORD_IMAGE',
  ZIPPED_GEO_TIFF: <EarthEngineMapFileFormat>'ZIPPED_GEO_TIFF',
  ZIPPED_GEO_TIFF_PER_BAND:
      <EarthEngineMapFileFormat>'ZIPPED_GEO_TIFF_PER_BAND',
  values(): Array<EarthEngineMapFileFormat> {
    return [
      EarthEngineMapFileFormatEnum.IMAGE_FILE_FORMAT_UNSPECIFIED,
      EarthEngineMapFileFormatEnum.JPEG, EarthEngineMapFileFormatEnum.PNG,
      EarthEngineMapFileFormatEnum.AUTO_JPEG_PNG,
      EarthEngineMapFileFormatEnum.NPY, EarthEngineMapFileFormatEnum.GEO_TIFF,
      EarthEngineMapFileFormatEnum.TF_RECORD_IMAGE,
      EarthEngineMapFileFormatEnum.MULTI_BAND_IMAGE_TILE,
      EarthEngineMapFileFormatEnum.ZIPPED_GEO_TIFF,
      EarthEngineMapFileFormatEnum.ZIPPED_GEO_TIFF_PER_BAND
    ];
  }
};

export type ExportVideoMapRequestVersion = 'VERSION_UNSPECIFIED'|'V1'|'V2';

export interface IExportVideoMapRequestVersionEnum {
  readonly VERSION_UNSPECIFIED: ExportVideoMapRequestVersion;
  readonly V1: ExportVideoMapRequestVersion;
  readonly V2: ExportVideoMapRequestVersion;

  values(): Array<ExportVideoMapRequestVersion>;
}

export const ExportVideoMapRequestVersionEnum:
    IExportVideoMapRequestVersionEnum = {
      V1: <ExportVideoMapRequestVersion>'V1',
      V2: <ExportVideoMapRequestVersion>'V2',
      VERSION_UNSPECIFIED: <ExportVideoMapRequestVersion>'VERSION_UNSPECIFIED',
      values(): Array<ExportVideoMapRequestVersion> {
        return [
          ExportVideoMapRequestVersionEnum.VERSION_UNSPECIFIED,
          ExportVideoMapRequestVersionEnum.V1,
          ExportVideoMapRequestVersionEnum.V2
        ];
      }
    };

export type FilmstripThumbnailFileFormat = 'IMAGE_FILE_FORMAT_UNSPECIFIED'|
    'JPEG'|'PNG'|'AUTO_JPEG_PNG'|'NPY'|'GEO_TIFF'|'TF_RECORD_IMAGE'|
    'MULTI_BAND_IMAGE_TILE'|'ZIPPED_GEO_TIFF'|'ZIPPED_GEO_TIFF_PER_BAND';

export interface IFilmstripThumbnailFileFormatEnum {
  readonly IMAGE_FILE_FORMAT_UNSPECIFIED: FilmstripThumbnailFileFormat;
  readonly JPEG: FilmstripThumbnailFileFormat;
  readonly PNG: FilmstripThumbnailFileFormat;
  readonly AUTO_JPEG_PNG: FilmstripThumbnailFileFormat;
  readonly NPY: FilmstripThumbnailFileFormat;
  readonly GEO_TIFF: FilmstripThumbnailFileFormat;
  readonly TF_RECORD_IMAGE: FilmstripThumbnailFileFormat;
  readonly MULTI_BAND_IMAGE_TILE: FilmstripThumbnailFileFormat;
  readonly ZIPPED_GEO_TIFF: FilmstripThumbnailFileFormat;
  readonly ZIPPED_GEO_TIFF_PER_BAND: FilmstripThumbnailFileFormat;

  values(): Array<FilmstripThumbnailFileFormat>;
}

export const FilmstripThumbnailFileFormatEnum:
    IFilmstripThumbnailFileFormatEnum = {
      AUTO_JPEG_PNG: <FilmstripThumbnailFileFormat>'AUTO_JPEG_PNG',
      GEO_TIFF: <FilmstripThumbnailFileFormat>'GEO_TIFF',
      IMAGE_FILE_FORMAT_UNSPECIFIED:
          <FilmstripThumbnailFileFormat>'IMAGE_FILE_FORMAT_UNSPECIFIED',
      JPEG: <FilmstripThumbnailFileFormat>'JPEG',
      MULTI_BAND_IMAGE_TILE:
          <FilmstripThumbnailFileFormat>'MULTI_BAND_IMAGE_TILE',
      NPY: <FilmstripThumbnailFileFormat>'NPY',
      PNG: <FilmstripThumbnailFileFormat>'PNG',
      TF_RECORD_IMAGE: <FilmstripThumbnailFileFormat>'TF_RECORD_IMAGE',
      ZIPPED_GEO_TIFF: <FilmstripThumbnailFileFormat>'ZIPPED_GEO_TIFF',
      ZIPPED_GEO_TIFF_PER_BAND:
          <FilmstripThumbnailFileFormat>'ZIPPED_GEO_TIFF_PER_BAND',
      values(): Array<FilmstripThumbnailFileFormat> {
        return [
          FilmstripThumbnailFileFormatEnum.IMAGE_FILE_FORMAT_UNSPECIFIED,
          FilmstripThumbnailFileFormatEnum.JPEG,
          FilmstripThumbnailFileFormatEnum.PNG,
          FilmstripThumbnailFileFormatEnum.AUTO_JPEG_PNG,
          FilmstripThumbnailFileFormatEnum.NPY,
          FilmstripThumbnailFileFormatEnum.GEO_TIFF,
          FilmstripThumbnailFileFormatEnum.TF_RECORD_IMAGE,
          FilmstripThumbnailFileFormatEnum.MULTI_BAND_IMAGE_TILE,
          FilmstripThumbnailFileFormatEnum.ZIPPED_GEO_TIFF,
          FilmstripThumbnailFileFormatEnum.ZIPPED_GEO_TIFF_PER_BAND
        ];
      }
    };

export type FilmstripThumbnailOrientation =
    'ORIENTATION_UNSPECIFIED'|'HORIZONTAL'|'VERTICAL';

export interface IFilmstripThumbnailOrientationEnum {
  readonly ORIENTATION_UNSPECIFIED: FilmstripThumbnailOrientation;
  readonly HORIZONTAL: FilmstripThumbnailOrientation;
  readonly VERTICAL: FilmstripThumbnailOrientation;

  values(): Array<FilmstripThumbnailOrientation>;
}

export const FilmstripThumbnailOrientationEnum:
    IFilmstripThumbnailOrientationEnum = {
      HORIZONTAL: <FilmstripThumbnailOrientation>'HORIZONTAL',
      ORIENTATION_UNSPECIFIED:
          <FilmstripThumbnailOrientation>'ORIENTATION_UNSPECIFIED',
      VERTICAL: <FilmstripThumbnailOrientation>'VERTICAL',
      values(): Array<FilmstripThumbnailOrientation> {
        return [
          FilmstripThumbnailOrientationEnum.ORIENTATION_UNSPECIFIED,
          FilmstripThumbnailOrientationEnum.HORIZONTAL,
          FilmstripThumbnailOrientationEnum.VERTICAL
        ];
      }
    };

export type GcsDestinationPermissions =
    'TILE_PERMISSIONS_UNSPECIFIED'|'PUBLIC'|'DEFAULT_OBJECT_ACL';

export interface IGcsDestinationPermissionsEnum {
  readonly TILE_PERMISSIONS_UNSPECIFIED: GcsDestinationPermissions;
  readonly PUBLIC: GcsDestinationPermissions;
  readonly DEFAULT_OBJECT_ACL: GcsDestinationPermissions;

  values(): Array<GcsDestinationPermissions>;
}

export const GcsDestinationPermissionsEnum: IGcsDestinationPermissionsEnum = {
  DEFAULT_OBJECT_ACL: <GcsDestinationPermissions>'DEFAULT_OBJECT_ACL',
  PUBLIC: <GcsDestinationPermissions>'PUBLIC',
  TILE_PERMISSIONS_UNSPECIFIED:
      <GcsDestinationPermissions>'TILE_PERMISSIONS_UNSPECIFIED',
  values(): Array<GcsDestinationPermissions> {
    return [
      GcsDestinationPermissionsEnum.TILE_PERMISSIONS_UNSPECIFIED,
      GcsDestinationPermissionsEnum.PUBLIC,
      GcsDestinationPermissionsEnum.DEFAULT_OBJECT_ACL
    ];
  }
};

export type GetPixelsRequestFileFormat = 'IMAGE_FILE_FORMAT_UNSPECIFIED'|'JPEG'|
    'PNG'|'AUTO_JPEG_PNG'|'NPY'|'GEO_TIFF'|'TF_RECORD_IMAGE'|
    'MULTI_BAND_IMAGE_TILE'|'ZIPPED_GEO_TIFF'|'ZIPPED_GEO_TIFF_PER_BAND';

export interface IGetPixelsRequestFileFormatEnum {
  readonly IMAGE_FILE_FORMAT_UNSPECIFIED: GetPixelsRequestFileFormat;
  readonly JPEG: GetPixelsRequestFileFormat;
  readonly PNG: GetPixelsRequestFileFormat;
  readonly AUTO_JPEG_PNG: GetPixelsRequestFileFormat;
  readonly NPY: GetPixelsRequestFileFormat;
  readonly GEO_TIFF: GetPixelsRequestFileFormat;
  readonly TF_RECORD_IMAGE: GetPixelsRequestFileFormat;
  readonly MULTI_BAND_IMAGE_TILE: GetPixelsRequestFileFormat;
  readonly ZIPPED_GEO_TIFF: GetPixelsRequestFileFormat;
  readonly ZIPPED_GEO_TIFF_PER_BAND: GetPixelsRequestFileFormat;

  values(): Array<GetPixelsRequestFileFormat>;
}

export const GetPixelsRequestFileFormatEnum: IGetPixelsRequestFileFormatEnum = {
  AUTO_JPEG_PNG: <GetPixelsRequestFileFormat>'AUTO_JPEG_PNG',
  GEO_TIFF: <GetPixelsRequestFileFormat>'GEO_TIFF',
  IMAGE_FILE_FORMAT_UNSPECIFIED:
      <GetPixelsRequestFileFormat>'IMAGE_FILE_FORMAT_UNSPECIFIED',
  JPEG: <GetPixelsRequestFileFormat>'JPEG',
  MULTI_BAND_IMAGE_TILE: <GetPixelsRequestFileFormat>'MULTI_BAND_IMAGE_TILE',
  NPY: <GetPixelsRequestFileFormat>'NPY',
  PNG: <GetPixelsRequestFileFormat>'PNG',
  TF_RECORD_IMAGE: <GetPixelsRequestFileFormat>'TF_RECORD_IMAGE',
  ZIPPED_GEO_TIFF: <GetPixelsRequestFileFormat>'ZIPPED_GEO_TIFF',
  ZIPPED_GEO_TIFF_PER_BAND:
      <GetPixelsRequestFileFormat>'ZIPPED_GEO_TIFF_PER_BAND',
  values(): Array<GetPixelsRequestFileFormat> {
    return [
      GetPixelsRequestFileFormatEnum.IMAGE_FILE_FORMAT_UNSPECIFIED,
      GetPixelsRequestFileFormatEnum.JPEG, GetPixelsRequestFileFormatEnum.PNG,
      GetPixelsRequestFileFormatEnum.AUTO_JPEG_PNG,
      GetPixelsRequestFileFormatEnum.NPY,
      GetPixelsRequestFileFormatEnum.GEO_TIFF,
      GetPixelsRequestFileFormatEnum.TF_RECORD_IMAGE,
      GetPixelsRequestFileFormatEnum.MULTI_BAND_IMAGE_TILE,
      GetPixelsRequestFileFormatEnum.ZIPPED_GEO_TIFF,
      GetPixelsRequestFileFormatEnum.ZIPPED_GEO_TIFF_PER_BAND
    ];
  }
};

export type ImageAssetExportOptionsPyramidingPolicy =
    'PYRAMIDING_POLICY_UNSPECIFIED'|'MEAN'|'SAMPLE'|'MIN'|'MAX'|'MODE';

export interface IImageAssetExportOptionsPyramidingPolicyEnum {
  readonly PYRAMIDING_POLICY_UNSPECIFIED:
      ImageAssetExportOptionsPyramidingPolicy;
  readonly MEAN: ImageAssetExportOptionsPyramidingPolicy;
  readonly SAMPLE: ImageAssetExportOptionsPyramidingPolicy;
  readonly MIN: ImageAssetExportOptionsPyramidingPolicy;
  readonly MAX: ImageAssetExportOptionsPyramidingPolicy;
  readonly MODE: ImageAssetExportOptionsPyramidingPolicy;

  values(): Array<ImageAssetExportOptionsPyramidingPolicy>;
}

export const ImageAssetExportOptionsPyramidingPolicyEnum:
    IImageAssetExportOptionsPyramidingPolicyEnum = {
      MAX: <ImageAssetExportOptionsPyramidingPolicy>'MAX',
      MEAN: <ImageAssetExportOptionsPyramidingPolicy>'MEAN',
      MIN: <ImageAssetExportOptionsPyramidingPolicy>'MIN',
      MODE: <ImageAssetExportOptionsPyramidingPolicy>'MODE',
      PYRAMIDING_POLICY_UNSPECIFIED: <
          ImageAssetExportOptionsPyramidingPolicy>'PYRAMIDING_POLICY_UNSPECIFIED',
      SAMPLE: <ImageAssetExportOptionsPyramidingPolicy>'SAMPLE',
      values(): Array<ImageAssetExportOptionsPyramidingPolicy> {
        return [
          ImageAssetExportOptionsPyramidingPolicyEnum
              .PYRAMIDING_POLICY_UNSPECIFIED,
          ImageAssetExportOptionsPyramidingPolicyEnum.MEAN,
          ImageAssetExportOptionsPyramidingPolicyEnum.SAMPLE,
          ImageAssetExportOptionsPyramidingPolicyEnum.MIN,
          ImageAssetExportOptionsPyramidingPolicyEnum.MAX,
          ImageAssetExportOptionsPyramidingPolicyEnum.MODE
        ];
      }
    };

export type ImageAssetExportOptionsPyramidingPolicyOverrides =
    'PYRAMIDING_POLICY_UNSPECIFIED'|'MEAN'|'SAMPLE'|'MIN'|'MAX'|'MODE';

export interface IImageAssetExportOptionsPyramidingPolicyOverridesEnum {
  readonly PYRAMIDING_POLICY_UNSPECIFIED:
      ImageAssetExportOptionsPyramidingPolicyOverrides;
  readonly MEAN: ImageAssetExportOptionsPyramidingPolicyOverrides;
  readonly SAMPLE: ImageAssetExportOptionsPyramidingPolicyOverrides;
  readonly MIN: ImageAssetExportOptionsPyramidingPolicyOverrides;
  readonly MAX: ImageAssetExportOptionsPyramidingPolicyOverrides;
  readonly MODE: ImageAssetExportOptionsPyramidingPolicyOverrides;

  values(): Array<ImageAssetExportOptionsPyramidingPolicyOverrides>;
}

export const ImageAssetExportOptionsPyramidingPolicyOverridesEnum:
    IImageAssetExportOptionsPyramidingPolicyOverridesEnum = {
      MAX: <ImageAssetExportOptionsPyramidingPolicyOverrides>'MAX',
      MEAN: <ImageAssetExportOptionsPyramidingPolicyOverrides>'MEAN',
      MIN: <ImageAssetExportOptionsPyramidingPolicyOverrides>'MIN',
      MODE: <ImageAssetExportOptionsPyramidingPolicyOverrides>'MODE',
      PYRAMIDING_POLICY_UNSPECIFIED: <
          ImageAssetExportOptionsPyramidingPolicyOverrides>'PYRAMIDING_POLICY_UNSPECIFIED',
      SAMPLE: <ImageAssetExportOptionsPyramidingPolicyOverrides>'SAMPLE',
      values(): Array<ImageAssetExportOptionsPyramidingPolicyOverrides> {
        return [
          ImageAssetExportOptionsPyramidingPolicyOverridesEnum
              .PYRAMIDING_POLICY_UNSPECIFIED,
          ImageAssetExportOptionsPyramidingPolicyOverridesEnum.MEAN,
          ImageAssetExportOptionsPyramidingPolicyOverridesEnum.SAMPLE,
          ImageAssetExportOptionsPyramidingPolicyOverridesEnum.MIN,
          ImageAssetExportOptionsPyramidingPolicyOverridesEnum.MAX,
          ImageAssetExportOptionsPyramidingPolicyOverridesEnum.MODE
        ];
      }
    };

export type ImageBandPyramidingPolicy =
    'PYRAMIDING_POLICY_UNSPECIFIED'|'MEAN'|'SAMPLE'|'MIN'|'MAX'|'MODE';

export interface IImageBandPyramidingPolicyEnum {
  readonly PYRAMIDING_POLICY_UNSPECIFIED: ImageBandPyramidingPolicy;
  readonly MEAN: ImageBandPyramidingPolicy;
  readonly SAMPLE: ImageBandPyramidingPolicy;
  readonly MIN: ImageBandPyramidingPolicy;
  readonly MAX: ImageBandPyramidingPolicy;
  readonly MODE: ImageBandPyramidingPolicy;

  values(): Array<ImageBandPyramidingPolicy>;
}

export const ImageBandPyramidingPolicyEnum: IImageBandPyramidingPolicyEnum = {
  MAX: <ImageBandPyramidingPolicy>'MAX',
  MEAN: <ImageBandPyramidingPolicy>'MEAN',
  MIN: <ImageBandPyramidingPolicy>'MIN',
  MODE: <ImageBandPyramidingPolicy>'MODE',
  PYRAMIDING_POLICY_UNSPECIFIED:
      <ImageBandPyramidingPolicy>'PYRAMIDING_POLICY_UNSPECIFIED',
  SAMPLE: <ImageBandPyramidingPolicy>'SAMPLE',
  values(): Array<ImageBandPyramidingPolicy> {
    return [
      ImageBandPyramidingPolicyEnum.PYRAMIDING_POLICY_UNSPECIFIED,
      ImageBandPyramidingPolicyEnum.MEAN, ImageBandPyramidingPolicyEnum.SAMPLE,
      ImageBandPyramidingPolicyEnum.MIN, ImageBandPyramidingPolicyEnum.MAX,
      ImageBandPyramidingPolicyEnum.MODE
    ];
  }
};

export type ImageFileExportOptionsFileFormat = 'IMAGE_FILE_FORMAT_UNSPECIFIED'|
    'JPEG'|'PNG'|'AUTO_JPEG_PNG'|'NPY'|'GEO_TIFF'|'TF_RECORD_IMAGE'|
    'MULTI_BAND_IMAGE_TILE'|'ZIPPED_GEO_TIFF'|'ZIPPED_GEO_TIFF_PER_BAND';

export interface IImageFileExportOptionsFileFormatEnum {
  readonly IMAGE_FILE_FORMAT_UNSPECIFIED: ImageFileExportOptionsFileFormat;
  readonly JPEG: ImageFileExportOptionsFileFormat;
  readonly PNG: ImageFileExportOptionsFileFormat;
  readonly AUTO_JPEG_PNG: ImageFileExportOptionsFileFormat;
  readonly NPY: ImageFileExportOptionsFileFormat;
  readonly GEO_TIFF: ImageFileExportOptionsFileFormat;
  readonly TF_RECORD_IMAGE: ImageFileExportOptionsFileFormat;
  readonly MULTI_BAND_IMAGE_TILE: ImageFileExportOptionsFileFormat;
  readonly ZIPPED_GEO_TIFF: ImageFileExportOptionsFileFormat;
  readonly ZIPPED_GEO_TIFF_PER_BAND: ImageFileExportOptionsFileFormat;

  values(): Array<ImageFileExportOptionsFileFormat>;
}

export const ImageFileExportOptionsFileFormatEnum:
    IImageFileExportOptionsFileFormatEnum = {
      AUTO_JPEG_PNG: <ImageFileExportOptionsFileFormat>'AUTO_JPEG_PNG',
      GEO_TIFF: <ImageFileExportOptionsFileFormat>'GEO_TIFF',
      IMAGE_FILE_FORMAT_UNSPECIFIED:
          <ImageFileExportOptionsFileFormat>'IMAGE_FILE_FORMAT_UNSPECIFIED',
      JPEG: <ImageFileExportOptionsFileFormat>'JPEG',
      MULTI_BAND_IMAGE_TILE:
          <ImageFileExportOptionsFileFormat>'MULTI_BAND_IMAGE_TILE',
      NPY: <ImageFileExportOptionsFileFormat>'NPY',
      PNG: <ImageFileExportOptionsFileFormat>'PNG',
      TF_RECORD_IMAGE: <ImageFileExportOptionsFileFormat>'TF_RECORD_IMAGE',
      ZIPPED_GEO_TIFF: <ImageFileExportOptionsFileFormat>'ZIPPED_GEO_TIFF',
      ZIPPED_GEO_TIFF_PER_BAND:
          <ImageFileExportOptionsFileFormat>'ZIPPED_GEO_TIFF_PER_BAND',
      values(): Array<ImageFileExportOptionsFileFormat> {
        return [
          ImageFileExportOptionsFileFormatEnum.IMAGE_FILE_FORMAT_UNSPECIFIED,
          ImageFileExportOptionsFileFormatEnum.JPEG,
          ImageFileExportOptionsFileFormatEnum.PNG,
          ImageFileExportOptionsFileFormatEnum.AUTO_JPEG_PNG,
          ImageFileExportOptionsFileFormatEnum.NPY,
          ImageFileExportOptionsFileFormatEnum.GEO_TIFF,
          ImageFileExportOptionsFileFormatEnum.TF_RECORD_IMAGE,
          ImageFileExportOptionsFileFormatEnum.MULTI_BAND_IMAGE_TILE,
          ImageFileExportOptionsFileFormatEnum.ZIPPED_GEO_TIFF,
          ImageFileExportOptionsFileFormatEnum.ZIPPED_GEO_TIFF_PER_BAND
        ];
      }
    };

export type ImageManifestPyramidingPolicy =
    'PYRAMIDING_POLICY_UNSPECIFIED'|'MEAN'|'SAMPLE'|'MIN'|'MAX'|'MODE';

export interface IImageManifestPyramidingPolicyEnum {
  readonly PYRAMIDING_POLICY_UNSPECIFIED: ImageManifestPyramidingPolicy;
  readonly MEAN: ImageManifestPyramidingPolicy;
  readonly SAMPLE: ImageManifestPyramidingPolicy;
  readonly MIN: ImageManifestPyramidingPolicy;
  readonly MAX: ImageManifestPyramidingPolicy;
  readonly MODE: ImageManifestPyramidingPolicy;

  values(): Array<ImageManifestPyramidingPolicy>;
}

export const ImageManifestPyramidingPolicyEnum:
    IImageManifestPyramidingPolicyEnum = {
      MAX: <ImageManifestPyramidingPolicy>'MAX',
      MEAN: <ImageManifestPyramidingPolicy>'MEAN',
      MIN: <ImageManifestPyramidingPolicy>'MIN',
      MODE: <ImageManifestPyramidingPolicy>'MODE',
      PYRAMIDING_POLICY_UNSPECIFIED:
          <ImageManifestPyramidingPolicy>'PYRAMIDING_POLICY_UNSPECIFIED',
      SAMPLE: <ImageManifestPyramidingPolicy>'SAMPLE',
      values(): Array<ImageManifestPyramidingPolicy> {
        return [
          ImageManifestPyramidingPolicyEnum.PYRAMIDING_POLICY_UNSPECIFIED,
          ImageManifestPyramidingPolicyEnum.MEAN,
          ImageManifestPyramidingPolicyEnum.SAMPLE,
          ImageManifestPyramidingPolicyEnum.MIN,
          ImageManifestPyramidingPolicyEnum.MAX,
          ImageManifestPyramidingPolicyEnum.MODE
        ];
      }
    };

export type OperationMetadataState = 'STATE_UNSPECIFIED'|'PENDING'|'RUNNING'|
    'CANCELLING'|'SUCCEEDED'|'CANCELLED'|'FAILED';

export interface IOperationMetadataStateEnum {
  readonly STATE_UNSPECIFIED: OperationMetadataState;
  readonly PENDING: OperationMetadataState;
  readonly RUNNING: OperationMetadataState;
  readonly CANCELLING: OperationMetadataState;
  readonly SUCCEEDED: OperationMetadataState;
  readonly CANCELLED: OperationMetadataState;
  readonly FAILED: OperationMetadataState;

  values(): Array<OperationMetadataState>;
}

export const OperationMetadataStateEnum: IOperationMetadataStateEnum = {
  CANCELLED: <OperationMetadataState>'CANCELLED',
  CANCELLING: <OperationMetadataState>'CANCELLING',
  FAILED: <OperationMetadataState>'FAILED',
  PENDING: <OperationMetadataState>'PENDING',
  RUNNING: <OperationMetadataState>'RUNNING',
  STATE_UNSPECIFIED: <OperationMetadataState>'STATE_UNSPECIFIED',
  SUCCEEDED: <OperationMetadataState>'SUCCEEDED',
  values(): Array<OperationMetadataState> {
    return [
      OperationMetadataStateEnum.STATE_UNSPECIFIED,
      OperationMetadataStateEnum.PENDING, OperationMetadataStateEnum.RUNNING,
      OperationMetadataStateEnum.CANCELLING,
      OperationMetadataStateEnum.SUCCEEDED,
      OperationMetadataStateEnum.CANCELLED, OperationMetadataStateEnum.FAILED
    ];
  }
};

export type PixelDataTypePrecision =
    'PRECISION_UNSPECIFIED'|'INT'|'FLOAT'|'DOUBLE';

export interface IPixelDataTypePrecisionEnum {
  readonly PRECISION_UNSPECIFIED: PixelDataTypePrecision;
  readonly INT: PixelDataTypePrecision;
  readonly FLOAT: PixelDataTypePrecision;
  readonly DOUBLE: PixelDataTypePrecision;

  values(): Array<PixelDataTypePrecision>;
}

export const PixelDataTypePrecisionEnum: IPixelDataTypePrecisionEnum = {
  DOUBLE: <PixelDataTypePrecision>'DOUBLE',
  FLOAT: <PixelDataTypePrecision>'FLOAT',
  INT: <PixelDataTypePrecision>'INT',
  PRECISION_UNSPECIFIED: <PixelDataTypePrecision>'PRECISION_UNSPECIFIED',
  values(): Array<PixelDataTypePrecision> {
    return [
      PixelDataTypePrecisionEnum.PRECISION_UNSPECIFIED,
      PixelDataTypePrecisionEnum.INT, PixelDataTypePrecisionEnum.FLOAT,
      PixelDataTypePrecisionEnum.DOUBLE
    ];
  }
};

export type RuleAction =
    'NO_ACTION'|'ALLOW'|'ALLOW_WITH_LOG'|'DENY'|'DENY_WITH_LOG'|'LOG';

export interface IRuleActionEnum {
  readonly NO_ACTION: RuleAction;
  readonly ALLOW: RuleAction;
  readonly ALLOW_WITH_LOG: RuleAction;
  readonly DENY: RuleAction;
  readonly DENY_WITH_LOG: RuleAction;
  readonly LOG: RuleAction;

  values(): Array<RuleAction>;
}

export const RuleActionEnum: IRuleActionEnum = {
  ALLOW: <RuleAction>'ALLOW',
  ALLOW_WITH_LOG: <RuleAction>'ALLOW_WITH_LOG',
  DENY: <RuleAction>'DENY',
  DENY_WITH_LOG: <RuleAction>'DENY_WITH_LOG',
  LOG: <RuleAction>'LOG',
  NO_ACTION: <RuleAction>'NO_ACTION',
  values(): Array<RuleAction> {
    return [
      RuleActionEnum.NO_ACTION, RuleActionEnum.ALLOW,
      RuleActionEnum.ALLOW_WITH_LOG, RuleActionEnum.DENY,
      RuleActionEnum.DENY_WITH_LOG, RuleActionEnum.LOG
    ];
  }
};

export type TableFileExportOptionsFileFormat = 'TABLE_FILE_FORMAT_UNSPECIFIED'|
    'CSV'|'GEO_JSON'|'KML'|'KMZ'|'SHP'|'TF_RECORD_TABLE';

export interface ITableFileExportOptionsFileFormatEnum {
  readonly TABLE_FILE_FORMAT_UNSPECIFIED: TableFileExportOptionsFileFormat;
  readonly CSV: TableFileExportOptionsFileFormat;
  readonly GEO_JSON: TableFileExportOptionsFileFormat;
  readonly KML: TableFileExportOptionsFileFormat;
  readonly KMZ: TableFileExportOptionsFileFormat;
  readonly SHP: TableFileExportOptionsFileFormat;
  readonly TF_RECORD_TABLE: TableFileExportOptionsFileFormat;

  values(): Array<TableFileExportOptionsFileFormat>;
}

export const TableFileExportOptionsFileFormatEnum:
    ITableFileExportOptionsFileFormatEnum = {
      CSV: <TableFileExportOptionsFileFormat>'CSV',
      GEO_JSON: <TableFileExportOptionsFileFormat>'GEO_JSON',
      KML: <TableFileExportOptionsFileFormat>'KML',
      KMZ: <TableFileExportOptionsFileFormat>'KMZ',
      SHP: <TableFileExportOptionsFileFormat>'SHP',
      TABLE_FILE_FORMAT_UNSPECIFIED:
          <TableFileExportOptionsFileFormat>'TABLE_FILE_FORMAT_UNSPECIFIED',
      TF_RECORD_TABLE: <TableFileExportOptionsFileFormat>'TF_RECORD_TABLE',
      values(): Array<TableFileExportOptionsFileFormat> {
        return [
          TableFileExportOptionsFileFormatEnum.TABLE_FILE_FORMAT_UNSPECIFIED,
          TableFileExportOptionsFileFormatEnum.CSV,
          TableFileExportOptionsFileFormatEnum.GEO_JSON,
          TableFileExportOptionsFileFormatEnum.KML,
          TableFileExportOptionsFileFormatEnum.KMZ,
          TableFileExportOptionsFileFormatEnum.SHP,
          TableFileExportOptionsFileFormatEnum.TF_RECORD_TABLE
        ];
      }
    };

export type TableFileFormat = 'TABLE_FILE_FORMAT_UNSPECIFIED'|'CSV'|'GEO_JSON'|
    'KML'|'KMZ'|'SHP'|'TF_RECORD_TABLE';

export interface ITableFileFormatEnum {
  readonly TABLE_FILE_FORMAT_UNSPECIFIED: TableFileFormat;
  readonly CSV: TableFileFormat;
  readonly GEO_JSON: TableFileFormat;
  readonly KML: TableFileFormat;
  readonly KMZ: TableFileFormat;
  readonly SHP: TableFileFormat;
  readonly TF_RECORD_TABLE: TableFileFormat;

  values(): Array<TableFileFormat>;
}

export const TableFileFormatEnum: ITableFileFormatEnum = {
  CSV: <TableFileFormat>'CSV',
  GEO_JSON: <TableFileFormat>'GEO_JSON',
  KML: <TableFileFormat>'KML',
  KMZ: <TableFileFormat>'KMZ',
  SHP: <TableFileFormat>'SHP',
  TABLE_FILE_FORMAT_UNSPECIFIED:
      <TableFileFormat>'TABLE_FILE_FORMAT_UNSPECIFIED',
  TF_RECORD_TABLE: <TableFileFormat>'TF_RECORD_TABLE',
  values(): Array<TableFileFormat> {
    return [
      TableFileFormatEnum.TABLE_FILE_FORMAT_UNSPECIFIED,
      TableFileFormatEnum.CSV, TableFileFormatEnum.GEO_JSON,
      TableFileFormatEnum.KML, TableFileFormatEnum.KMZ, TableFileFormatEnum.SHP,
      TableFileFormatEnum.TF_RECORD_TABLE
    ];
  }
};

export type ThumbnailFileFormat = 'IMAGE_FILE_FORMAT_UNSPECIFIED'|'JPEG'|'PNG'|
    'AUTO_JPEG_PNG'|'NPY'|'GEO_TIFF'|'TF_RECORD_IMAGE'|'MULTI_BAND_IMAGE_TILE'|
    'ZIPPED_GEO_TIFF'|'ZIPPED_GEO_TIFF_PER_BAND';

export interface IThumbnailFileFormatEnum {
  readonly IMAGE_FILE_FORMAT_UNSPECIFIED: ThumbnailFileFormat;
  readonly JPEG: ThumbnailFileFormat;
  readonly PNG: ThumbnailFileFormat;
  readonly AUTO_JPEG_PNG: ThumbnailFileFormat;
  readonly NPY: ThumbnailFileFormat;
  readonly GEO_TIFF: ThumbnailFileFormat;
  readonly TF_RECORD_IMAGE: ThumbnailFileFormat;
  readonly MULTI_BAND_IMAGE_TILE: ThumbnailFileFormat;
  readonly ZIPPED_GEO_TIFF: ThumbnailFileFormat;
  readonly ZIPPED_GEO_TIFF_PER_BAND: ThumbnailFileFormat;

  values(): Array<ThumbnailFileFormat>;
}

export const ThumbnailFileFormatEnum: IThumbnailFileFormatEnum = {
  AUTO_JPEG_PNG: <ThumbnailFileFormat>'AUTO_JPEG_PNG',
  GEO_TIFF: <ThumbnailFileFormat>'GEO_TIFF',
  IMAGE_FILE_FORMAT_UNSPECIFIED:
      <ThumbnailFileFormat>'IMAGE_FILE_FORMAT_UNSPECIFIED',
  JPEG: <ThumbnailFileFormat>'JPEG',
  MULTI_BAND_IMAGE_TILE: <ThumbnailFileFormat>'MULTI_BAND_IMAGE_TILE',
  NPY: <ThumbnailFileFormat>'NPY',
  PNG: <ThumbnailFileFormat>'PNG',
  TF_RECORD_IMAGE: <ThumbnailFileFormat>'TF_RECORD_IMAGE',
  ZIPPED_GEO_TIFF: <ThumbnailFileFormat>'ZIPPED_GEO_TIFF',
  ZIPPED_GEO_TIFF_PER_BAND: <ThumbnailFileFormat>'ZIPPED_GEO_TIFF_PER_BAND',
  values(): Array<ThumbnailFileFormat> {
    return [
      ThumbnailFileFormatEnum.IMAGE_FILE_FORMAT_UNSPECIFIED,
      ThumbnailFileFormatEnum.JPEG, ThumbnailFileFormatEnum.PNG,
      ThumbnailFileFormatEnum.AUTO_JPEG_PNG, ThumbnailFileFormatEnum.NPY,
      ThumbnailFileFormatEnum.GEO_TIFF, ThumbnailFileFormatEnum.TF_RECORD_IMAGE,
      ThumbnailFileFormatEnum.MULTI_BAND_IMAGE_TILE,
      ThumbnailFileFormatEnum.ZIPPED_GEO_TIFF,
      ThumbnailFileFormatEnum.ZIPPED_GEO_TIFF_PER_BAND
    ];
  }
};

export type TilesetBandPyramidingPolicy =
    'PYRAMIDING_POLICY_UNSPECIFIED'|'MEAN'|'SAMPLE'|'MIN'|'MAX'|'MODE';

export interface ITilesetBandPyramidingPolicyEnum {
  readonly PYRAMIDING_POLICY_UNSPECIFIED: TilesetBandPyramidingPolicy;
  readonly MEAN: TilesetBandPyramidingPolicy;
  readonly SAMPLE: TilesetBandPyramidingPolicy;
  readonly MIN: TilesetBandPyramidingPolicy;
  readonly MAX: TilesetBandPyramidingPolicy;
  readonly MODE: TilesetBandPyramidingPolicy;

  values(): Array<TilesetBandPyramidingPolicy>;
}

export const TilesetBandPyramidingPolicyEnum:
    ITilesetBandPyramidingPolicyEnum = {
      MAX: <TilesetBandPyramidingPolicy>'MAX',
      MEAN: <TilesetBandPyramidingPolicy>'MEAN',
      MIN: <TilesetBandPyramidingPolicy>'MIN',
      MODE: <TilesetBandPyramidingPolicy>'MODE',
      PYRAMIDING_POLICY_UNSPECIFIED:
          <TilesetBandPyramidingPolicy>'PYRAMIDING_POLICY_UNSPECIFIED',
      SAMPLE: <TilesetBandPyramidingPolicy>'SAMPLE',
      values(): Array<TilesetBandPyramidingPolicy> {
        return [
          TilesetBandPyramidingPolicyEnum.PYRAMIDING_POLICY_UNSPECIFIED,
          TilesetBandPyramidingPolicyEnum.MEAN,
          TilesetBandPyramidingPolicyEnum.SAMPLE,
          TilesetBandPyramidingPolicyEnum.MIN,
          TilesetBandPyramidingPolicyEnum.MAX,
          TilesetBandPyramidingPolicyEnum.MODE
        ];
      }
    };

export type TilesetDataType = 'DATA_TYPE_UNSPECIFIED'|'INT8'|'UINT8'|'INT16'|
    'UINT16'|'INT32'|'UINT32'|'FLOAT'|'DOUBLE';

export interface ITilesetDataTypeEnum {
  readonly DATA_TYPE_UNSPECIFIED: TilesetDataType;
  readonly INT8: TilesetDataType;
  readonly UINT8: TilesetDataType;
  readonly INT16: TilesetDataType;
  readonly UINT16: TilesetDataType;
  readonly INT32: TilesetDataType;
  readonly UINT32: TilesetDataType;
  readonly FLOAT: TilesetDataType;
  readonly DOUBLE: TilesetDataType;

  values(): Array<TilesetDataType>;
}

export const TilesetDataTypeEnum: ITilesetDataTypeEnum = {
  DATA_TYPE_UNSPECIFIED: <TilesetDataType>'DATA_TYPE_UNSPECIFIED',
  DOUBLE: <TilesetDataType>'DOUBLE',
  FLOAT: <TilesetDataType>'FLOAT',
  INT16: <TilesetDataType>'INT16',
  INT32: <TilesetDataType>'INT32',
  INT8: <TilesetDataType>'INT8',
  UINT16: <TilesetDataType>'UINT16',
  UINT32: <TilesetDataType>'UINT32',
  UINT8: <TilesetDataType>'UINT8',
  values(): Array<TilesetDataType> {
    return [
      TilesetDataTypeEnum.DATA_TYPE_UNSPECIFIED, TilesetDataTypeEnum.INT8,
      TilesetDataTypeEnum.UINT8, TilesetDataTypeEnum.INT16,
      TilesetDataTypeEnum.UINT16, TilesetDataTypeEnum.INT32,
      TilesetDataTypeEnum.UINT32, TilesetDataTypeEnum.FLOAT,
      TilesetDataTypeEnum.DOUBLE
    ];
  }
};

export type VideoFileExportOptionsFileFormat =
    'VIDEO_FILE_FORMAT_UNSPECIFIED'|'MP4'|'GIF'|'VP9';

export interface IVideoFileExportOptionsFileFormatEnum {
  readonly VIDEO_FILE_FORMAT_UNSPECIFIED: VideoFileExportOptionsFileFormat;
  readonly MP4: VideoFileExportOptionsFileFormat;
  readonly GIF: VideoFileExportOptionsFileFormat;
  readonly VP9: VideoFileExportOptionsFileFormat;

  values(): Array<VideoFileExportOptionsFileFormat>;
}

export const VideoFileExportOptionsFileFormatEnum:
    IVideoFileExportOptionsFileFormatEnum = {
      GIF: <VideoFileExportOptionsFileFormat>'GIF',
      MP4: <VideoFileExportOptionsFileFormat>'MP4',
      VIDEO_FILE_FORMAT_UNSPECIFIED:
          <VideoFileExportOptionsFileFormat>'VIDEO_FILE_FORMAT_UNSPECIFIED',
      VP9: <VideoFileExportOptionsFileFormat>'VP9',
      values(): Array<VideoFileExportOptionsFileFormat> {
        return [
          VideoFileExportOptionsFileFormatEnum.VIDEO_FILE_FORMAT_UNSPECIFIED,
          VideoFileExportOptionsFileFormatEnum.MP4,
          VideoFileExportOptionsFileFormatEnum.GIF,
          VideoFileExportOptionsFileFormatEnum.VP9
        ];
      }
    };

export type VideoThumbnailFileFormat =
    'VIDEO_FILE_FORMAT_UNSPECIFIED'|'MP4'|'GIF'|'VP9';

export interface IVideoThumbnailFileFormatEnum {
  readonly VIDEO_FILE_FORMAT_UNSPECIFIED: VideoThumbnailFileFormat;
  readonly MP4: VideoThumbnailFileFormat;
  readonly GIF: VideoThumbnailFileFormat;
  readonly VP9: VideoThumbnailFileFormat;

  values(): Array<VideoThumbnailFileFormat>;
}

export const VideoThumbnailFileFormatEnum: IVideoThumbnailFileFormatEnum = {
  GIF: <VideoThumbnailFileFormat>'GIF',
  MP4: <VideoThumbnailFileFormat>'MP4',
  VIDEO_FILE_FORMAT_UNSPECIFIED:
      <VideoThumbnailFileFormat>'VIDEO_FILE_FORMAT_UNSPECIFIED',
  VP9: <VideoThumbnailFileFormat>'VP9',
  values(): Array<VideoThumbnailFileFormat> {
    return [
      VideoThumbnailFileFormatEnum.VIDEO_FILE_FORMAT_UNSPECIFIED,
      VideoThumbnailFileFormatEnum.MP4, VideoThumbnailFileFormatEnum.GIF,
      VideoThumbnailFileFormatEnum.VP9
    ];
  }
};

export interface AffineTransformParameters {
  scaleX?: number|null;
  shearX?: number|null;
  translateX?: number|null;
  shearY?: number|null;
  scaleY?: number|null;
  translateY?: number|null;
}
export class AffineTransform extends Serializable {
  constructor(parameters: AffineTransformParameters = {}) {
    super();
    this.Serializable$set(
        'scaleX', (parameters.scaleX == null) ? (null) : (parameters.scaleX));
    this.Serializable$set(
        'shearX', (parameters.shearX == null) ? (null) : (parameters.shearX));
    this.Serializable$set(
        'translateX',
        (parameters.translateX == null) ? (null) : (parameters.translateX));
    this.Serializable$set(
        'shearY', (parameters.shearY == null) ? (null) : (parameters.shearY));
    this.Serializable$set(
        'scaleY', (parameters.scaleY == null) ? (null) : (parameters.scaleY));
    this.Serializable$set(
        'translateY',
        (parameters.translateY == null) ? (null) : (parameters.translateY));
  }

  get scaleX(): number|null {
    return (
        (this.Serializable$has('scaleX')) ? (this.Serializable$get('scaleX')) :
                                            (null));
  }

  /**
   * The horizontal scale factor.
   */
  set scaleX(value: number|null) {
    this.Serializable$set('scaleX', value);
  }

  get scaleY(): number|null {
    return (
        (this.Serializable$has('scaleY')) ? (this.Serializable$get('scaleY')) :
                                            (null));
  }

  /**
   * The vertical scale factor.
   */
  set scaleY(value: number|null) {
    this.Serializable$set('scaleY', value);
  }

  get shearX(): number|null {
    return (
        (this.Serializable$has('shearX')) ? (this.Serializable$get('shearX')) :
                                            (null));
  }

  /**
   * The horizontal shear factor for some, though not all, transformations.
   */
  set shearX(value: number|null) {
    this.Serializable$set('shearX', value);
  }

  get shearY(): number|null {
    return (
        (this.Serializable$has('shearY')) ? (this.Serializable$get('shearY')) :
                                            (null));
  }

  /**
   * The vertical shear factor for some, though not all, transformations.
   */
  set shearY(value: number|null) {
    this.Serializable$set('shearY', value);
  }

  get translateX(): number|null {
    return (
        (this.Serializable$has('translateX')) ?
            (this.Serializable$get('translateX')) :
            (null));
  }

  /**
   * The horizontal offset.
   */
  set translateX(value: number|null) {
    this.Serializable$set('translateX', value);
  }

  get translateY(): number|null {
    return (
        (this.Serializable$has('translateY')) ?
            (this.Serializable$get('translateY')) :
            (null));
  }

  /**
   * The vertical offset.
   */
  set translateY(value: number|null) {
    this.Serializable$set('translateY', value);
  }

  getConstructor(): SerializableCtor<AffineTransform> {
    return AffineTransform;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['scaleX', 'scaleY', 'shearX', 'shearY', 'translateX', 'translateY']
    };
  }
}

export interface AlgorithmParameters {
  name?: string|null;
  description?: string|null;
  returnType?: string|null;
  arguments?: Array<AlgorithmArgument>|null;
  deprecated?: boolean|null;
  deprecationReason?: string|null;
  hidden?: boolean|null;
  preview?: boolean|null;
  sourceCodeUri?: string|null;
}
export class Algorithm extends Serializable {
  constructor(parameters: AlgorithmParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'returnType',
        (parameters.returnType == null) ? (null) : (parameters.returnType));
    this.Serializable$set(
        'arguments',
        (parameters.arguments == null) ? (null) : (parameters.arguments));
    this.Serializable$set(
        'deprecated',
        (parameters.deprecated == null) ? (null) : (parameters.deprecated));
    this.Serializable$set(
        'deprecationReason',
        (parameters.deprecationReason == null) ?
            (null) :
            (parameters.deprecationReason));
    this.Serializable$set(
        'hidden', (parameters.hidden == null) ? (null) : (parameters.hidden));
    this.Serializable$set(
        'preview',
        (parameters.preview == null) ? (null) : (parameters.preview));
    this.Serializable$set(
        'sourceCodeUri',
        (parameters.sourceCodeUri == null) ? (null) :
                                             (parameters.sourceCodeUri));
  }

  get arguments(): Array<AlgorithmArgument>|null {
    return (
        (this.Serializable$has('arguments')) ?
            (this.Serializable$get('arguments')) :
            (null));
  }

  /**
   * Descriptions of the arguments the algorithm takes.
   */
  set arguments(value: Array<AlgorithmArgument>|null) {
    this.Serializable$set('arguments', value);
  }

  get deprecated(): boolean|null {
    return (
        (this.Serializable$has('deprecated')) ?
            (this.Serializable$get('deprecated')) :
            (null));
  }

  /**
   * Whether the algorithm is deprecated.
   */
  set deprecated(value: boolean|null) {
    this.Serializable$set('deprecated', value);
  }

  get deprecationReason(): string|null {
    return (
        (this.Serializable$has('deprecationReason')) ?
            (this.Serializable$get('deprecationReason')) :
            (null));
  }

  /**
   * If this algorithm is deprecated, the reason for the deprecation.
   */
  set deprecationReason(value: string|null) {
    this.Serializable$set('deprecationReason', value);
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * A human-readable description of the algorithm.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get hidden(): boolean|null {
    return (
        (this.Serializable$has('hidden')) ? (this.Serializable$get('hidden')) :
                                            (null));
  }

  /**
   * Whether this algorithm should be hidden in client applications
   * and not shown by default.
   */
  set hidden(value: boolean|null) {
    this.Serializable$set('hidden', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The name of the algorithm, in the form \"algorithms/...\".
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get preview(): boolean|null {
    return (
        (this.Serializable$has('preview')) ?
            (this.Serializable$get('preview')) :
            (null));
  }

  /**
   * Whether this algorithm is a preview feature and not yet widely
   * available for a general audience.
   */
  set preview(value: boolean|null) {
    this.Serializable$set('preview', value);
  }

  get returnType(): string|null {
    return (
        (this.Serializable$has('returnType')) ?
            (this.Serializable$get('returnType')) :
            (null));
  }

  /**
   * The name of the type the algorithm returns.
   */
  set returnType(value: string|null) {
    this.Serializable$set('returnType', value);
  }

  get sourceCodeUri(): string|null {
    return (
        (this.Serializable$has('sourceCodeUri')) ?
            (this.Serializable$get('sourceCodeUri')) :
            (null));
  }

  /**
   * URI of a resource containing the source code of the algorithm. Empty if the
   * user does not have permission or a specific URI could not be determined.
   */
  set sourceCodeUri(value: string|null) {
    this.Serializable$set('sourceCodeUri', value);
  }

  getConstructor(): SerializableCtor<Algorithm> {
    return Algorithm;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'arguments': AlgorithmArgument},
      keys: [
        'arguments', 'deprecated', 'deprecationReason', 'description', 'hidden',
        'name', 'preview', 'returnType', 'sourceCodeUri'
      ]
    };
  }
}

export interface AlgorithmArgumentParameters {
  argumentName?: string|null;
  type?: string|null;
  description?: string|null;
  optional?: boolean|null;
  defaultValue?: any|null;
}
export class AlgorithmArgument extends Serializable {
  constructor(parameters: AlgorithmArgumentParameters = {}) {
    super();
    this.Serializable$set(
        'argumentName',
        (parameters.argumentName == null) ? (null) : (parameters.argumentName));
    this.Serializable$set(
        'type', (parameters.type == null) ? (null) : (parameters.type));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'optional',
        (parameters.optional == null) ? (null) : (parameters.optional));
    this.Serializable$set(
        'defaultValue',
        (parameters.defaultValue == null) ? (null) : (parameters.defaultValue));
  }

  get argumentName(): string|null {
    return (
        (this.Serializable$has('argumentName')) ?
            (this.Serializable$get('argumentName')) :
            (null));
  }

  /**
   * The name of the argument.
   */
  set argumentName(value: string|null) {
    this.Serializable$set('argumentName', value);
  }

  get defaultValue(): any|null {
    return (
        (this.Serializable$has('defaultValue')) ?
            (this.Serializable$get('defaultValue')) :
            (null));
  }

  /**
   * The default value the argument takes if a value is not provided.
   */
  set defaultValue(value: any|null) {
    this.Serializable$set('defaultValue', value);
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * A human-readable description of the argument.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get optional(): boolean|null {
    return (
        (this.Serializable$has('optional')) ?
            (this.Serializable$get('optional')) :
            (null));
  }

  /**
   * Whether the argument is optional.
   */
  set optional(value: boolean|null) {
    this.Serializable$set('optional', value);
  }

  get type(): string|null {
    return (
        (this.Serializable$has('type')) ? (this.Serializable$get('type')) :
                                          (null));
  }

  /**
   * The name of the type of the argument.
   */
  set type(value: string|null) {
    this.Serializable$set('type', value);
  }

  getConstructor(): SerializableCtor<AlgorithmArgument> {
    return AlgorithmArgument;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['argumentName', 'defaultValue', 'description', 'optional', 'type']
    };
  }
}

export interface ArrayValueParameters {
  values?: Array<ValueNode>|null;
}
export class ArrayValue extends Serializable {
  constructor(parameters: ArrayValueParameters = {}) {
    super();
    this.Serializable$set(
        'values', (parameters.values == null) ? (null) : (parameters.values));
  }

  get values(): Array<ValueNode>|null {
    return (
        (this.Serializable$has('values')) ? (this.Serializable$get('values')) :
                                            (null));
  }

  /**
   * The elements of the array.
   */
  set values(value: Array<ValueNode>|null) {
    this.Serializable$set('values', value);
  }

  getConstructor(): SerializableCtor<ArrayValue> {
    return ArrayValue;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {arrays: {'values': ValueNode}, keys: ['values']};
  }
}

export interface AuditConfigParameters {
  service?: string|null;
  exemptedMembers?: Array<string>|null;
  auditLogConfigs?: Array<AuditLogConfig>|null;
}
export class AuditConfig extends Serializable {
  constructor(parameters: AuditConfigParameters = {}) {
    super();
    this.Serializable$set(
        'service',
        (parameters.service == null) ? (null) : (parameters.service));
    this.Serializable$set(
        'exemptedMembers',
        (parameters.exemptedMembers == null) ? (null) :
                                               (parameters.exemptedMembers));
    this.Serializable$set(
        'auditLogConfigs',
        (parameters.auditLogConfigs == null) ? (null) :
                                               (parameters.auditLogConfigs));
  }

  get auditLogConfigs(): Array<AuditLogConfig>|null {
    return (
        (this.Serializable$has('auditLogConfigs')) ?
            (this.Serializable$get('auditLogConfigs')) :
            (null));
  }

  /**
   * The configuration for logging of each type of permission.
   */
  set auditLogConfigs(value: Array<AuditLogConfig>|null) {
    this.Serializable$set('auditLogConfigs', value);
  }

  get exemptedMembers(): Array<string>|null {
    return (
        (this.Serializable$has('exemptedMembers')) ?
            (this.Serializable$get('exemptedMembers')) :
            (null));
  }

  set exemptedMembers(value: Array<string>|null) {
    this.Serializable$set('exemptedMembers', value);
  }

  get service(): string|null {
    return (
        (this.Serializable$has('service')) ?
            (this.Serializable$get('service')) :
            (null));
  }

  /**
   * Specifies a service that will be enabled for audit logging.
   * For example, `storage.googleapis.com`, `cloudsql.googleapis.com`.
   * `allServices` is a special value that covers all services.
   */
  set service(value: string|null) {
    this.Serializable$set('service', value);
  }

  getConstructor(): SerializableCtor<AuditConfig> {
    return AuditConfig;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'auditLogConfigs': AuditLogConfig},
      keys: ['auditLogConfigs', 'exemptedMembers', 'service']
    };
  }
}

export interface AuditLogConfigParameters {
  logType?: AuditLogConfigLogType|null;
  exemptedMembers?: Array<string>|null;
  ignoreChildExemptions?: boolean|null;
}
export class AuditLogConfig extends Serializable {
  constructor(parameters: AuditLogConfigParameters = {}) {
    super();
    this.Serializable$set(
        'logType',
        (parameters.logType == null) ? (null) : (parameters.logType));
    this.Serializable$set(
        'exemptedMembers',
        (parameters.exemptedMembers == null) ? (null) :
                                               (parameters.exemptedMembers));
    this.Serializable$set(
        'ignoreChildExemptions',
        (parameters.ignoreChildExemptions == null) ?
            (null) :
            (parameters.ignoreChildExemptions));
  }

  static get LogType(): IAuditLogConfigLogTypeEnum {
    return AuditLogConfigLogTypeEnum;
  }

  get exemptedMembers(): Array<string>|null {
    return (
        (this.Serializable$has('exemptedMembers')) ?
            (this.Serializable$get('exemptedMembers')) :
            (null));
  }

  /**
   * Specifies the identities that do not cause logging for this type of
   * permission.
   * Follows the same format of Binding.members.
   */
  set exemptedMembers(value: Array<string>|null) {
    this.Serializable$set('exemptedMembers', value);
  }

  get ignoreChildExemptions(): boolean|null {
    return (
        (this.Serializable$has('ignoreChildExemptions')) ?
            (this.Serializable$get('ignoreChildExemptions')) :
            (null));
  }

  set ignoreChildExemptions(value: boolean|null) {
    this.Serializable$set('ignoreChildExemptions', value);
  }

  get logType(): AuditLogConfigLogType|null {
    return (
        (this.Serializable$has('logType')) ?
            (this.Serializable$get('logType')) :
            (null));
  }

  /**
   * The log type that this config enables.
   */
  set logType(value: AuditLogConfigLogType|null) {
    this.Serializable$set('logType', value);
  }

  getConstructor(): SerializableCtor<AuditLogConfig> {
    return AuditLogConfig;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'logType': AuditLogConfigLogTypeEnum},
      keys: ['exemptedMembers', 'ignoreChildExemptions', 'logType']
    };
  }
}

export interface AuthorizationLoggingOptionsParameters {
  permissionType?: AuthorizationLoggingOptionsPermissionType|null;
}
export class AuthorizationLoggingOptions extends Serializable {
  constructor(parameters: AuthorizationLoggingOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'permissionType',
        (parameters.permissionType == null) ? (null) :
                                              (parameters.permissionType));
  }

  static get PermissionType(): IAuthorizationLoggingOptionsPermissionTypeEnum {
    return AuthorizationLoggingOptionsPermissionTypeEnum;
  }

  get permissionType(): AuthorizationLoggingOptionsPermissionType|null {
    return (
        (this.Serializable$has('permissionType')) ?
            (this.Serializable$get('permissionType')) :
            (null));
  }

  /**
   * The type of the permission that was checked.
   */
  set permissionType(value: AuthorizationLoggingOptionsPermissionType|null) {
    this.Serializable$set('permissionType', value);
  }

  getConstructor(): SerializableCtor<AuthorizationLoggingOptions> {
    return AuthorizationLoggingOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'permissionType': AuthorizationLoggingOptionsPermissionTypeEnum},
      keys: ['permissionType']
    };
  }
}

export interface BindingParameters {
  role?: string|null;
  members?: Array<string>|null;
  condition?: Expr|null;
}
export class Binding extends Serializable {
  constructor(parameters: BindingParameters = {}) {
    super();
    this.Serializable$set(
        'role', (parameters.role == null) ? (null) : (parameters.role));
    this.Serializable$set(
        'members',
        (parameters.members == null) ? (null) : (parameters.members));
    this.Serializable$set(
        'condition',
        (parameters.condition == null) ? (null) : (parameters.condition));
  }

  get condition(): Expr|null {
    return (
        (this.Serializable$has('condition')) ?
            (this.Serializable$get('condition')) :
            (null));
  }

  /**
   * The condition that is associated with this binding.
   *
   * If the condition evaluates to `true`, then this binding applies to the
   * current request.
   *
   * If the condition evaluates to `false`, then this binding does not apply to
   * the current request. However, a different role binding might grant the same
   * role to one or more of the members in this binding.
   *
   * To learn which resources support conditions in their IAM policies, see the
   * [IAM
   * documentation](https://cloud.google.com/iam/help/conditions/resource-policies).
   */
  set condition(value: Expr|null) {
    this.Serializable$set('condition', value);
  }

  get members(): Array<string>|null {
    return (
        (this.Serializable$has('members')) ?
            (this.Serializable$get('members')) :
            (null));
  }

  /**
   * Specifies the identities requesting access for a Cloud Platform resource.
   * `members` can have the following values:
   *
   * * `allUsers`: A special identifier that represents anyone who is
   *    on the internet; with or without a Google account.
   *
   * * `allAuthenticatedUsers`: A special identifier that represents anyone
   *    who is authenticated with a Google account or a service account.
   *
   * * `user:{emailid}`: An email address that represents a specific Google
   *    account. For example, `alice@example.com` .
   *
   *
   * * `serviceAccount:{emailid}`: An email address that represents a service
   *    account. For example, `my-other-app@appspot.gserviceaccount.com`.
   *
   * * `group:{emailid}`: An email address that represents a Google group.
   *    For example, `admins@example.com`.
   *
   * * `deleted:user:{emailid}?uid={uniqueid}`: An email address (plus unique
   *    identifier) representing a user that has been recently deleted. For
   *    example, `alice@example.com?uid=123456789012345678901`. If the user is
   *    recovered, this value reverts to `user:{emailid}` and the recovered user
   *    retains the role in the binding.
   *
   * * `deleted:serviceAccount:{emailid}?uid={uniqueid}`: An email address (plus
   *    unique identifier) representing a service account that has been recently
   *    deleted. For example,
   *    `my-other-app@appspot.gserviceaccount.com?uid=123456789012345678901`.
   *    If the service account is undeleted, this value reverts to
   *    `serviceAccount:{emailid}` and the undeleted service account retains the
   *    role in the binding.
   *
   * * `deleted:group:{emailid}?uid={uniqueid}`: An email address (plus unique
   *    identifier) representing a Google group that has been recently
   *    deleted. For example, `admins@example.com?uid=123456789012345678901`. If
   *    the group is recovered, this value reverts to `group:{emailid}` and the
   *    recovered group retains the role in the binding.
   *
   *
   * * `domain:{domain}`: The G Suite domain (primary) that represents all the
   *    users of that domain. For example, `google.com` or `example.com`.
   *
   *
   */
  set members(value: Array<string>|null) {
    this.Serializable$set('members', value);
  }

  get role(): string|null {
    return (
        (this.Serializable$has('role')) ? (this.Serializable$get('role')) :
                                          (null));
  }

  /**
   * Role that is assigned to `members`.
   * For example, `roles/viewer`, `roles/editor`, or `roles/owner`.
   */
  set role(value: string|null) {
    this.Serializable$set('role', value);
  }

  getConstructor(): SerializableCtor<Binding> {
    return Binding;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['condition', 'members', 'role'],
      objects: {'condition': Expr}
    };
  }
}

export interface CancelOperationRequestParameters {}
export class CancelOperationRequest extends Serializable {
  constructor(parameters: CancelOperationRequestParameters = {}) {
    super();
  }

  getConstructor(): SerializableCtor<CancelOperationRequest> {
    return CancelOperationRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: []};
  }
}

export interface CapabilitiesParameters {
  capabilities?: Array<CapabilitiesCapabilities>|null;
}
export class Capabilities extends Serializable {
  constructor(parameters: CapabilitiesParameters = {}) {
    super();
    this.Serializable$set(
        'capabilities',
        (parameters.capabilities == null) ? (null) : (parameters.capabilities));
  }

  static get Capabilities(): ICapabilitiesCapabilitiesEnum {
    return CapabilitiesCapabilitiesEnum;
  }

  get capabilities(): Array<CapabilitiesCapabilities>|null {
    return (
        (this.Serializable$has('capabilities')) ?
            (this.Serializable$get('capabilities')) :
            (null));
  }

  /**
   * A list of the capabilities the user has.
   */
  set capabilities(value: Array<CapabilitiesCapabilities>|null) {
    this.Serializable$set('capabilities', value);
  }

  getConstructor(): SerializableCtor<Capabilities> {
    return Capabilities;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'capabilities': CapabilitiesCapabilitiesEnum},
      keys: ['capabilities']
    };
  }
}

export interface CloudAuditOptionsParameters {
  logName?: CloudAuditOptionsLogName|null;
  authorizationLoggingOptions?: AuthorizationLoggingOptions|null;
}
export class CloudAuditOptions extends Serializable {
  constructor(parameters: CloudAuditOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'logName',
        (parameters.logName == null) ? (null) : (parameters.logName));
    this.Serializable$set(
        'authorizationLoggingOptions',
        (parameters.authorizationLoggingOptions == null) ?
            (null) :
            (parameters.authorizationLoggingOptions));
  }

  static get LogName(): ICloudAuditOptionsLogNameEnum {
    return CloudAuditOptionsLogNameEnum;
  }

  get authorizationLoggingOptions(): AuthorizationLoggingOptions|null {
    return (
        (this.Serializable$has('authorizationLoggingOptions')) ?
            (this.Serializable$get('authorizationLoggingOptions')) :
            (null));
  }

  /**
   * Information used by the Cloud Audit Logging pipeline.
   */
  set authorizationLoggingOptions(value: AuthorizationLoggingOptions|null) {
    this.Serializable$set('authorizationLoggingOptions', value);
  }

  get logName(): CloudAuditOptionsLogName|null {
    return (
        (this.Serializable$has('logName')) ?
            (this.Serializable$get('logName')) :
            (null));
  }

  /**
   * The log_name to populate in the Cloud Audit Record.
   */
  set logName(value: CloudAuditOptionsLogName|null) {
    this.Serializable$set('logName', value);
  }

  getConstructor(): SerializableCtor<CloudAuditOptions> {
    return CloudAuditOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'logName': CloudAuditOptionsLogNameEnum},
      keys: ['authorizationLoggingOptions', 'logName'],
      objects: {'authorizationLoggingOptions': AuthorizationLoggingOptions}
    };
  }
}

export interface ComputeFeaturesRequestParameters {
  expression?: Expression|null;
  pageSize?: number|null;
  pageToken?: string|null;
}
export class ComputeFeaturesRequest extends Serializable {
  constructor(parameters: ComputeFeaturesRequestParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'pageSize',
        (parameters.pageSize == null) ? (null) : (parameters.pageSize));
    this.Serializable$set(
        'pageToken',
        (parameters.pageToken == null) ? (null) : (parameters.pageToken));
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * The expression to compute.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get pageSize(): number|null {
    return (
        (this.Serializable$has('pageSize')) ?
            (this.Serializable$get('pageSize')) :
            (null));
  }

  /**
   * An optional maximum number of results per page. The server may return fewer
   * features than requested. If unspecified, server will pick an appropriate
   * default.
   */
  set pageSize(value: number|null) {
    this.Serializable$set('pageSize', value);
  }

  get pageToken(): string|null {
    return (
        (this.Serializable$has('pageToken')) ?
            (this.Serializable$get('pageToken')) :
            (null));
  }

  /**
   * An optional token identifying a page of results the server should return.
   * Typically, this is the value of
   * ComputeFeaturesResponse.next_page_token
   * returned from the previous call to the `ComputeFeatures` method.
   */
  set pageToken(value: string|null) {
    this.Serializable$set('pageToken', value);
  }

  getConstructor(): SerializableCtor<ComputeFeaturesRequest> {
    return ComputeFeaturesRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['expression', 'pageSize', 'pageToken'],
      objects: {'expression': Expression}
    };
  }
}

export interface ComputeFeaturesResponseParameters {
  type?: string|null;
  features?: Array<Feature>|null;
  nextPageToken?: string|null;
}
export class ComputeFeaturesResponse extends Serializable {
  constructor(parameters: ComputeFeaturesResponseParameters = {}) {
    super();
    this.Serializable$set(
        'type', (parameters.type == null) ? (null) : (parameters.type));
    this.Serializable$set(
        'features',
        (parameters.features == null) ? (null) : (parameters.features));
    this.Serializable$set(
        'nextPageToken',
        (parameters.nextPageToken == null) ? (null) :
                                             (parameters.nextPageToken));
  }

  get features(): Array<Feature>|null {
    return (
        (this.Serializable$has('features')) ?
            (this.Serializable$get('features')) :
            (null));
  }

  /**
   * The list of features matching the query, as a list of GeoJSON
   * feature objects (see RFC 7946) containing the string \"Feature\" in
   * a field named \"type\", the geometry in a field named \"geometry\",
   * and key/value properties in a field named \"properties\".
   */
  set features(value: Array<Feature>|null) {
    this.Serializable$set('features', value);
  }

  get nextPageToken(): string|null {
    return (
        (this.Serializable$has('nextPageToken')) ?
            (this.Serializable$get('nextPageToken')) :
            (null));
  }

  /**
   * A token to retrieve the next page of results. Pass this value in the
   * ComputeFeaturesRequest.page_token
   * field in the subsequent call to the `ComputeFeatures` method
   * to retrieve the next page of results.
   */
  set nextPageToken(value: string|null) {
    this.Serializable$set('nextPageToken', value);
  }

  get type(): string|null {
    return (
        (this.Serializable$has('type')) ? (this.Serializable$get('type')) :
                                          (null));
  }

  /**
   * Always contains the constant string \"FeatureCollection\", marking
   * this as a GeoJSON FeatureCollection object.
   */
  set type(value: string|null) {
    this.Serializable$set('type', value);
  }

  getConstructor(): SerializableCtor<ComputeFeaturesResponse> {
    return ComputeFeaturesResponse;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'features': Feature},
      keys: ['features', 'nextPageToken', 'type']
    };
  }
}

export interface ComputeImagesRequestParameters {
  expression?: Expression|null;
  pageSize?: number|null;
  pageToken?: string|null;
}
export class ComputeImagesRequest extends Serializable {
  constructor(parameters: ComputeImagesRequestParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'pageSize',
        (parameters.pageSize == null) ? (null) : (parameters.pageSize));
    this.Serializable$set(
        'pageToken',
        (parameters.pageToken == null) ? (null) : (parameters.pageToken));
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * The expression to compute.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get pageSize(): number|null {
    return (
        (this.Serializable$has('pageSize')) ?
            (this.Serializable$get('pageSize')) :
            (null));
  }

  /**
   * An optional maximum number of results per page. The server may return fewer
   * images than requested. If unspecified, server will pick an appropriate
   * default.
   */
  set pageSize(value: number|null) {
    this.Serializable$set('pageSize', value);
  }

  get pageToken(): string|null {
    return (
        (this.Serializable$has('pageToken')) ?
            (this.Serializable$get('pageToken')) :
            (null));
  }

  /**
   * An optional token identifying a page of results the server should return.
   * Typically, this is the value of
   * ComputeImagesResponse.next_page_token
   * returned from the previous call to the `ComputeImages` method.
   */
  set pageToken(value: string|null) {
    this.Serializable$set('pageToken', value);
  }

  getConstructor(): SerializableCtor<ComputeImagesRequest> {
    return ComputeImagesRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['expression', 'pageSize', 'pageToken'],
      objects: {'expression': Expression}
    };
  }
}

export interface ComputeImagesResponseParameters {
  images?: Array<Image>|null;
  nextPageToken?: string|null;
}
export class ComputeImagesResponse extends Serializable {
  constructor(parameters: ComputeImagesResponseParameters = {}) {
    super();
    this.Serializable$set(
        'images', (parameters.images == null) ? (null) : (parameters.images));
    this.Serializable$set(
        'nextPageToken',
        (parameters.nextPageToken == null) ? (null) :
                                             (parameters.nextPageToken));
  }

  get images(): Array<Image>|null {
    return (
        (this.Serializable$has('images')) ? (this.Serializable$get('images')) :
                                            (null));
  }

  /**
   * The list of images matching the query.
   */
  set images(value: Array<Image>|null) {
    this.Serializable$set('images', value);
  }

  get nextPageToken(): string|null {
    return (
        (this.Serializable$has('nextPageToken')) ?
            (this.Serializable$get('nextPageToken')) :
            (null));
  }

  /**
   * A token to retrieve the next page of results. Pass this value in the
   * ComputeImagesRequest.page_token
   * field in the subsequent call to the `ComputeImages` method
   * to retrieve the next page of results.
   */
  set nextPageToken(value: string|null) {
    this.Serializable$set('nextPageToken', value);
  }

  getConstructor(): SerializableCtor<ComputeImagesResponse> {
    return ComputeImagesResponse;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {arrays: {'images': Image}, keys: ['images', 'nextPageToken']};
  }
}

export interface ComputePixelsRequestParameters {
  expression?: Expression|null;
  fileFormat?: ComputePixelsRequestFileFormat|null;
  grid?: PixelGrid|null;
  bandIds?: Array<string>|null;
  visualizationOptions?: VisualizationOptions|null;
}
export class ComputePixelsRequest extends Serializable {
  constructor(parameters: ComputePixelsRequestParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'grid', (parameters.grid == null) ? (null) : (parameters.grid));
    this.Serializable$set(
        'bandIds',
        (parameters.bandIds == null) ? (null) : (parameters.bandIds));
    this.Serializable$set(
        'visualizationOptions',
        (parameters.visualizationOptions == null) ?
            (null) :
            (parameters.visualizationOptions));
  }

  static get FileFormat(): IComputePixelsRequestFileFormatEnum {
    return ComputePixelsRequestFileFormatEnum;
  }

  get bandIds(): Array<string>|null {
    return (
        (this.Serializable$has('bandIds')) ?
            (this.Serializable$get('bandIds')) :
            (null));
  }

  /**
   * If present, specifies a specific set of bands that will be
   * selected from the result of evaluating `expression`. If not
   * present, all bands resulting from `expression` will be selected.
   */
  set bandIds(value: Array<string>|null) {
    this.Serializable$set('bandIds', value);
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * The expression to compute.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get fileFormat(): ComputePixelsRequestFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The output file format in which to return the pixel values.
   */
  set fileFormat(value: ComputePixelsRequestFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get grid(): PixelGrid|null {
    return (
        (this.Serializable$has('grid')) ? (this.Serializable$get('grid')) :
                                          (null));
  }

  /**
   * Optional parameters describing how the image computed by
   * `expression` should be reprojected and clipped. If not present, the
   * full computed image is returned in its native projection.
   */
  set grid(value: PixelGrid|null) {
    this.Serializable$set('grid', value);
  }

  get visualizationOptions(): VisualizationOptions|null {
    return (
        (this.Serializable$has('visualizationOptions')) ?
            (this.Serializable$get('visualizationOptions')) :
            (null));
  }

  /**
   * If present, a set of visualization options to apply to produce an
   * 8-bit RGB visualization of the data.
   */
  set visualizationOptions(value: VisualizationOptions|null) {
    this.Serializable$set('visualizationOptions', value);
  }

  getConstructor(): SerializableCtor<ComputePixelsRequest> {
    return ComputePixelsRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'fileFormat': ComputePixelsRequestFileFormatEnum},
      keys: [
        'bandIds', 'expression', 'fileFormat', 'grid', 'visualizationOptions'
      ],
      objects: {
        'expression': Expression,
        'grid': PixelGrid,
        'visualizationOptions': VisualizationOptions
      }
    };
  }
}

export interface ComputeValueRequestParameters {
  expression?: Expression|null;
}
export class ComputeValueRequest extends Serializable {
  constructor(parameters: ComputeValueRequestParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * The expression to compute.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  getConstructor(): SerializableCtor<ComputeValueRequest> {
    return ComputeValueRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['expression'], objects: {'expression': Expression}};
  }
}

export interface ComputeValueResponseParameters {
  result?: any|null;
}
export class ComputeValueResponse extends Serializable {
  constructor(parameters: ComputeValueResponseParameters = {}) {
    super();
    this.Serializable$set(
        'result', (parameters.result == null) ? (null) : (parameters.result));
  }

  get result(): any|null {
    return (
        (this.Serializable$has('result')) ? (this.Serializable$get('result')) :
                                            (null));
  }

  /**
   * The results of computing the value of the expression.
   */
  set result(value: any|null) {
    this.Serializable$set('result', value);
  }

  getConstructor(): SerializableCtor<ComputeValueResponse> {
    return ComputeValueResponse;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['result']};
  }
}

export interface ConditionParameters {
  iam?: ConditionIam|null;
  sys?: ConditionSys|null;
  svc?: string|null;
  op?: ConditionOp|null;
  values?: Array<string>|null;
}
export class Condition extends Serializable {
  constructor(parameters: ConditionParameters = {}) {
    super();
    this.Serializable$set(
        'iam', (parameters.iam == null) ? (null) : (parameters.iam));
    this.Serializable$set(
        'sys', (parameters.sys == null) ? (null) : (parameters.sys));
    this.Serializable$set(
        'svc', (parameters.svc == null) ? (null) : (parameters.svc));
    this.Serializable$set(
        'op', (parameters.op == null) ? (null) : (parameters.op));
    this.Serializable$set(
        'values', (parameters.values == null) ? (null) : (parameters.values));
  }

  static get Iam(): IConditionIamEnum {
    return ConditionIamEnum;
  }

  static get Op(): IConditionOpEnum {
    return ConditionOpEnum;
  }

  static get Sys(): IConditionSysEnum {
    return ConditionSysEnum;
  }

  get iam(): ConditionIam|null {
    return (
        (this.Serializable$has('iam')) ? (this.Serializable$get('iam')) :
                                         (null));
  }

  /**
   * Trusted attributes supplied by the IAM system.
   */
  set iam(value: ConditionIam|null) {
    this.Serializable$set('iam', value);
  }

  get op(): ConditionOp|null {
    return (
        (this.Serializable$has('op')) ? (this.Serializable$get('op')) : (null));
  }

  /**
   * An operator to apply the subject with.
   */
  set op(value: ConditionOp|null) {
    this.Serializable$set('op', value);
  }

  get svc(): string|null {
    return (
        (this.Serializable$has('svc')) ? (this.Serializable$get('svc')) :
                                         (null));
  }

  /**
   * Trusted attributes discharged by the service.
   */
  set svc(value: string|null) {
    this.Serializable$set('svc', value);
  }

  get sys(): ConditionSys|null {
    return (
        (this.Serializable$has('sys')) ? (this.Serializable$get('sys')) :
                                         (null));
  }

  /**
   * Trusted attributes supplied by any service that owns resources and uses
   * the IAM system for access control.
   */
  set sys(value: ConditionSys|null) {
    this.Serializable$set('sys', value);
  }

  get values(): Array<string>|null {
    return (
        (this.Serializable$has('values')) ? (this.Serializable$get('values')) :
                                            (null));
  }

  /**
   * The objects of the condition.
   */
  set values(value: Array<string>|null) {
    this.Serializable$set('values', value);
  }

  getConstructor(): SerializableCtor<Condition> {
    return Condition;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {
        'iam': ConditionIamEnum,
        'op': ConditionOpEnum,
        'sys': ConditionSysEnum
      },
      keys: ['iam', 'op', 'svc', 'sys', 'values']
    };
  }
}

export interface CopyAssetRequestParameters {
  destinationName?: string|null;
  overwrite?: boolean|null;
  bandIds?: Array<string>|null;
}
export class CopyAssetRequest extends Serializable {
  constructor(parameters: CopyAssetRequestParameters = {}) {
    super();
    this.Serializable$set(
        'destinationName',
        (parameters.destinationName == null) ? (null) :
                                               (parameters.destinationName));
    this.Serializable$set(
        'overwrite',
        (parameters.overwrite == null) ? (null) : (parameters.overwrite));
    this.Serializable$set(
        'bandIds',
        (parameters.bandIds == null) ? (null) : (parameters.bandIds));
  }

  get bandIds(): Array<string>|null {
    return (
        (this.Serializable$has('bandIds')) ?
            (this.Serializable$get('bandIds')) :
            (null));
  }

  /**
   * A list of bands to include in the copy. If omitted, all bands
   * will be copied.
   */
  set bandIds(value: Array<string>|null) {
    this.Serializable$set('bandIds', value);
  }

  get destinationName(): string|null {
    return (
        (this.Serializable$has('destinationName')) ?
            (this.Serializable$get('destinationName')) :
            (null));
  }

  /**
   * The destination name to which to copy the asset.
   * `name` is of the format \"projects/* /assets/**\"
   * (e.g., \"projects/earthengine-legacy/assets/users/[USER]/[ASSET]\").
   * All user-owned assets are under the project \"earthengine-legacy\"
   * (e.g., \"projects/earthengine-legacy/assets/users/foo/bar\").
   * All other assets are under the project \"earthengine-public\"
   * (e.g., \"projects/earthengine-public/assets/LANDSAT\").
   */
  set destinationName(value: string|null) {
    this.Serializable$set('destinationName', value);
  }

  get overwrite(): boolean|null {
    return (
        (this.Serializable$has('overwrite')) ?
            (this.Serializable$get('overwrite')) :
            (null));
  }

  /**
   * An optional flag to allow overwriting an existing asset.
   */
  set overwrite(value: boolean|null) {
    this.Serializable$set('overwrite', value);
  }

  getConstructor(): SerializableCtor<CopyAssetRequest> {
    return CopyAssetRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['bandIds', 'destinationName', 'overwrite']};
  }
}

export interface CounterOptionsParameters {
  metric?: string|null;
  field?: string|null;
  customFields?: Array<CustomField>|null;
}
export class CounterOptions extends Serializable {
  constructor(parameters: CounterOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'metric', (parameters.metric == null) ? (null) : (parameters.metric));
    this.Serializable$set(
        'field', (parameters.field == null) ? (null) : (parameters.field));
    this.Serializable$set(
        'customFields',
        (parameters.customFields == null) ? (null) : (parameters.customFields));
  }

  get customFields(): Array<CustomField>|null {
    return (
        (this.Serializable$has('customFields')) ?
            (this.Serializable$get('customFields')) :
            (null));
  }

  /**
   * Custom fields.
   */
  set customFields(value: Array<CustomField>|null) {
    this.Serializable$set('customFields', value);
  }

  get field(): string|null {
    return (
        (this.Serializable$has('field')) ? (this.Serializable$get('field')) :
                                           (null));
  }

  /**
   * The field value to attribute.
   */
  set field(value: string|null) {
    this.Serializable$set('field', value);
  }

  get metric(): string|null {
    return (
        (this.Serializable$has('metric')) ? (this.Serializable$get('metric')) :
                                            (null));
  }

  /**
   * The metric to update.
   */
  set metric(value: string|null) {
    this.Serializable$set('metric', value);
  }

  getConstructor(): SerializableCtor<CounterOptions> {
    return CounterOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'customFields': CustomField},
      keys: ['customFields', 'field', 'metric']
    };
  }
}

export interface CustomFieldParameters {
  name?: string|null;
  value?: string|null;
}
export class CustomField extends Serializable {
  constructor(parameters: CustomFieldParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'value', (parameters.value == null) ? (null) : (parameters.value));
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * Name is the field name.
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get value(): string|null {
    return (
        (this.Serializable$has('value')) ? (this.Serializable$get('value')) :
                                           (null));
  }

  /**
   * Value is the field value. It is important that in contrast to the
   * CounterOptions.field, the value here is a constant that is not
   * derived from the IAMContext.
   */
  set value(value: string|null) {
    this.Serializable$set('value', value);
  }

  getConstructor(): SerializableCtor<CustomField> {
    return CustomField;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['name', 'value']};
  }
}

export interface DataAccessOptionsParameters {
  logMode?: DataAccessOptionsLogMode|null;
}
export class DataAccessOptions extends Serializable {
  constructor(parameters: DataAccessOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'logMode',
        (parameters.logMode == null) ? (null) : (parameters.logMode));
  }

  static get LogMode(): IDataAccessOptionsLogModeEnum {
    return DataAccessOptionsLogModeEnum;
  }

  get logMode(): DataAccessOptionsLogMode|null {
    return (
        (this.Serializable$has('logMode')) ?
            (this.Serializable$get('logMode')) :
            (null));
  }

  set logMode(value: DataAccessOptionsLogMode|null) {
    this.Serializable$set('logMode', value);
  }

  getConstructor(): SerializableCtor<DataAccessOptions> {
    return DataAccessOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'logMode': DataAccessOptionsLogModeEnum},
      keys: ['logMode']
    };
  }
}

export interface DictionaryValueParameters {
  values?: ApiClientObjectMap<ValueNode>|null;
}
export class DictionaryValue extends Serializable {
  constructor(parameters: DictionaryValueParameters = {}) {
    super();
    this.Serializable$set(
        'values', (parameters.values == null) ? (null) : (parameters.values));
  }

  get values(): ApiClientObjectMap<ValueNode>|null {
    return (
        (this.Serializable$has('values')) ? (this.Serializable$get('values')) :
                                            (null));
  }

  /**
   * The elements of the dictionary.
   */
  set values(value: ApiClientObjectMap<ValueNode>|null) {
    this.Serializable$set('values', value);
  }

  getConstructor(): SerializableCtor<DictionaryValue> {
    return DictionaryValue;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['values'],
      objectMaps: {
        'values': {
          ctor: ValueNode,
          isPropertyArray: false,
          isSerializable: true,
          isValueArray: false
        }
      }
    };
  }
}

export interface DoubleRangeParameters {
  min?: number|null;
  max?: number|null;
}
export class DoubleRange extends Serializable {
  constructor(parameters: DoubleRangeParameters = {}) {
    super();
    this.Serializable$set(
        'min', (parameters.min == null) ? (null) : (parameters.min));
    this.Serializable$set(
        'max', (parameters.max == null) ? (null) : (parameters.max));
  }

  get max(): number|null {
    return (
        (this.Serializable$has('max')) ? (this.Serializable$get('max')) :
                                         (null));
  }

  /**
   * The maximum data value, i.e. the upper bound of the range.
   */
  set max(value: number|null) {
    this.Serializable$set('max', value);
  }

  get min(): number|null {
    return (
        (this.Serializable$has('min')) ? (this.Serializable$get('min')) :
                                         (null));
  }

  /**
   * The minimum data value, i.e. the lower bound of the range.
   */
  set min(value: number|null) {
    this.Serializable$set('min', value);
  }

  getConstructor(): SerializableCtor<DoubleRange> {
    return DoubleRange;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['max', 'min']};
  }
}

export interface DriveDestinationParameters {
  folder?: string|null;
  filenamePrefix?: string|null;
}
export class DriveDestination extends Serializable {
  constructor(parameters: DriveDestinationParameters = {}) {
    super();
    this.Serializable$set(
        'folder', (parameters.folder == null) ? (null) : (parameters.folder));
    this.Serializable$set(
        'filenamePrefix',
        (parameters.filenamePrefix == null) ? (null) :
                                              (parameters.filenamePrefix));
  }

  get filenamePrefix(): string|null {
    return (
        (this.Serializable$has('filenamePrefix')) ?
            (this.Serializable$get('filenamePrefix')) :
            (null));
  }

  /**
   * The string used as the prefix for each output filename. The filenames of
   * the exported files will be constructed from this prefix, the coordinates
   * of each file in a mosaic (if any), and a file extension corresponding to
   * the file format.
   */
  set filenamePrefix(value: string|null) {
    this.Serializable$set('filenamePrefix', value);
  }

  get folder(): string|null {
    return (
        (this.Serializable$has('folder')) ? (this.Serializable$get('folder')) :
                                            (null));
  }

  /**
   * The Google Drive destination folder.
   */
  set folder(value: string|null) {
    this.Serializable$set('folder', value);
  }

  getConstructor(): SerializableCtor<DriveDestination> {
    return DriveDestination;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['filenamePrefix', 'folder']};
  }
}

export interface EarthEngineAssetParameters {
  type?: EarthEngineAssetType|null;
  name?: string|null;
  id?: string|null;
  updateTime?: string|null;
  title?: string|null;
  description?: string|null;
  properties?: ApiClientObjectMap<any>|null;
  startTime?: string|null;
  endTime?: string|null;
  geometry?: ApiClientObjectMap<any>|null;
  bands?: Array<ImageBand>|null;
  sizeBytes?: string|null;
  quota?: FolderQuota|null;
  tilestoreEntry?: TilestoreEntry|null;
  gcsLocation?: GcsLocation|null;
  expression?: Expression|null;
}
export class EarthEngineAsset extends Serializable {
  constructor(parameters: EarthEngineAssetParameters = {}) {
    super();
    this.Serializable$set(
        'type', (parameters.type == null) ? (null) : (parameters.type));
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'id', (parameters.id == null) ? (null) : (parameters.id));
    this.Serializable$set(
        'updateTime',
        (parameters.updateTime == null) ? (null) : (parameters.updateTime));
    this.Serializable$set(
        'title', (parameters.title == null) ? (null) : (parameters.title));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'properties',
        (parameters.properties == null) ? (null) : (parameters.properties));
    this.Serializable$set(
        'startTime',
        (parameters.startTime == null) ? (null) : (parameters.startTime));
    this.Serializable$set(
        'endTime',
        (parameters.endTime == null) ? (null) : (parameters.endTime));
    this.Serializable$set(
        'geometry',
        (parameters.geometry == null) ? (null) : (parameters.geometry));
    this.Serializable$set(
        'bands', (parameters.bands == null) ? (null) : (parameters.bands));
    this.Serializable$set(
        'sizeBytes',
        (parameters.sizeBytes == null) ? (null) : (parameters.sizeBytes));
    this.Serializable$set(
        'quota', (parameters.quota == null) ? (null) : (parameters.quota));
    this.Serializable$set(
        'tilestoreEntry',
        (parameters.tilestoreEntry == null) ? (null) :
                                              (parameters.tilestoreEntry));
    this.Serializable$set(
        'gcsLocation',
        (parameters.gcsLocation == null) ? (null) : (parameters.gcsLocation));
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
  }

  static get Type(): IEarthEngineAssetTypeEnum {
    return EarthEngineAssetTypeEnum;
  }

  get bands(): Array<ImageBand>|null {
    return (
        (this.Serializable$has('bands')) ? (this.Serializable$get('bands')) :
                                           (null));
  }

  /**
   * Information about the data bands of the image asset. Omitted for
   * non-image assets.
   */
  set bands(value: Array<ImageBand>|null) {
    this.Serializable$set('bands', value);
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * The description of the asset.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get endTime(): string|null {
    return (
        (this.Serializable$has('endTime')) ?
            (this.Serializable$get('endTime')) :
            (null));
  }

  /**
   * For assets that correspond to an interval of time, such as average values
   * over a month or year, this timestamp corresponds to the end of that
   * interval (exclusive).
   */
  set endTime(value: string|null) {
    this.Serializable$set('endTime', value);
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get gcsLocation(): GcsLocation|null {
    return (
        (this.Serializable$has('gcsLocation')) ?
            (this.Serializable$get('gcsLocation')) :
            (null));
  }

  /**
   * The location of this asset on Cloud Storage.
   */
  set gcsLocation(value: GcsLocation|null) {
    this.Serializable$set('gcsLocation', value);
  }

  get geometry(): ApiClientObjectMap<any>|null {
    return (
        (this.Serializable$has('geometry')) ?
            (this.Serializable$get('geometry')) :
            (null));
  }

  /**
   * The spatial footprint associated with the asset, if any, as a GeoJSON
   * geometry object (see RFC 7946).
   */
  set geometry(value: ApiClientObjectMap<any>|null) {
    this.Serializable$set('geometry', value);
  }

  get id(): string|null {
    return (
        (this.Serializable$has('id')) ? (this.Serializable$get('id')) : (null));
  }

  /**
   * The ID of the asset. Equivalent to `name` without the \"projects/*
   * /assets/\" prefix (e.g. \"users/<USER>/<ASSET>\"). Note that this is
   * intended for display purposes only. It should not be used as an input to
   * another operation. Use `name` instead.
   */
  set id(value: string|null) {
    this.Serializable$set('id', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The name of the asset. `name` is of the format \"projects/* /assets/**\"
   * (e.g. \"projects/earthengine-legacy/assets/users/<USER>/<ASSET>\").
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get properties(): ApiClientObjectMap<any>|null {
    return (
        (this.Serializable$has('properties')) ?
            (this.Serializable$get('properties')) :
            (null));
  }

  /**
   * Key/value properties associated with the asset.
   */
  set properties(value: ApiClientObjectMap<any>|null) {
    this.Serializable$set('properties', value);
  }

  get quota(): FolderQuota|null {
    return (
        (this.Serializable$has('quota')) ? (this.Serializable$get('quota')) :
                                           (null));
  }

  /**
   * The quota information associated with the folder asset, if any. Returned
   * for top-level user-owned folder assets (e.g. \"users/*\" or
   * \"projects/*\").
   */
  set quota(value: FolderQuota|null) {
    this.Serializable$set('quota', value);
  }

  get sizeBytes(): string|null {
    return (
        (this.Serializable$has('sizeBytes')) ?
            (this.Serializable$get('sizeBytes')) :
            (null));
  }

  /**
   * The size of a leaf asset (e.g. an image) in bytes.
   */
  set sizeBytes(value: string|null) {
    this.Serializable$set('sizeBytes', value);
  }

  get startTime(): string|null {
    return (
        (this.Serializable$has('startTime')) ?
            (this.Serializable$get('startTime')) :
            (null));
  }

  /**
   * The timestamp associated with the asset, if any, e.g. the time at which a
   * satellite image was taken. For assets that correspond to an interval of
   * time, such as average values over a month or year, this timestamp
   * corresponds to the start of that interval.
   */
  set startTime(value: string|null) {
    this.Serializable$set('startTime', value);
  }

  get tilestoreEntry(): TilestoreEntry|null {
    return (
        (this.Serializable$has('tilestoreEntry')) ?
            (this.Serializable$get('tilestoreEntry')) :
            (null));
  }

  set tilestoreEntry(value: TilestoreEntry|null) {
    this.Serializable$set('tilestoreEntry', value);
  }

  get title(): string|null {
    return (
        (this.Serializable$has('title')) ? (this.Serializable$get('title')) :
                                           (null));
  }

  /**
   * The title of the asset.
   */
  set title(value: string|null) {
    this.Serializable$set('title', value);
  }

  get type(): EarthEngineAssetType|null {
    return (
        (this.Serializable$has('type')) ? (this.Serializable$get('type')) :
                                          (null));
  }

  /**
   * The type of the asset.
   */
  set type(value: EarthEngineAssetType|null) {
    this.Serializable$set('type', value);
  }

  get updateTime(): string|null {
    return (
        (this.Serializable$has('updateTime')) ?
            (this.Serializable$get('updateTime')) :
            (null));
  }

  /**
   * The last-modified time of the asset.
   */
  set updateTime(value: string|null) {
    this.Serializable$set('updateTime', value);
  }

  getConstructor(): SerializableCtor<EarthEngineAsset> {
    return EarthEngineAsset;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'bands': ImageBand},
      enums: {'type': EarthEngineAssetTypeEnum},
      keys: [
        'bands', 'description', 'endTime', 'expression', 'gcsLocation',
        'geometry', 'id', 'name', 'properties', 'quota', 'sizeBytes',
        'startTime', 'tilestoreEntry', 'title', 'type', 'updateTime'
      ],
      objectMaps: {
        'geometry': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        },
        'properties': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        }
      },
      objects: {
        'expression': Expression,
        'gcsLocation': GcsLocation,
        'quota': FolderQuota,
        'tilestoreEntry': TilestoreEntry
      }
    };
  }
}

export interface EarthEngineDestinationParameters {
  name?: string|null;
}
export class EarthEngineDestination extends Serializable {
  constructor(parameters: EarthEngineDestinationParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The name of the asset to be created.
   * `name` is of the format \"projects/* /assets/**\"
   * (e.g. \"projects/earthengine-legacy/assets/users/<USER>/<ASSET>\").
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  getConstructor(): SerializableCtor<EarthEngineDestination> {
    return EarthEngineDestination;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['name']};
  }
}

export interface EarthEngineMapParameters {
  name?: string|null;
  expression?: Expression|null;
  fileFormat?: EarthEngineMapFileFormat|null;
  bandIds?: Array<string>|null;
  visualizationOptions?: VisualizationOptions|null;
}
export class EarthEngineMap extends Serializable {
  constructor(parameters: EarthEngineMapParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'bandIds',
        (parameters.bandIds == null) ? (null) : (parameters.bandIds));
    this.Serializable$set(
        'visualizationOptions',
        (parameters.visualizationOptions == null) ?
            (null) :
            (parameters.visualizationOptions));
  }

  static get FileFormat(): IEarthEngineMapFileFormatEnum {
    return EarthEngineMapFileFormatEnum;
  }

  get bandIds(): Array<string>|null {
    return (
        (this.Serializable$has('bandIds')) ?
            (this.Serializable$get('bandIds')) :
            (null));
  }

  /**
   * If present, specifies a specific set of bands that will be selected from
   * the result of evaluating the given expression. If not present, all bands
   * resulting from the expression will be selected.
   */
  set bandIds(value: Array<string>|null) {
    this.Serializable$set('bandIds', value);
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * The expression to compute.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get fileFormat(): EarthEngineMapFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The output file format in which to generate the map tiles.
   */
  set fileFormat(value: EarthEngineMapFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The resource name representing the map, of the form  \"projects/*
   * /maps/**\" (e.g. \"projects/earthengine-legacy/maps/<MAP-ID>\").
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get visualizationOptions(): VisualizationOptions|null {
    return (
        (this.Serializable$has('visualizationOptions')) ?
            (this.Serializable$get('visualizationOptions')) :
            (null));
  }

  /**
   * If present, a set of visualization options to apply to produce an
   * 8-bit RGB visualization of the data.
   */
  set visualizationOptions(value: VisualizationOptions|null) {
    this.Serializable$set('visualizationOptions', value);
  }

  getConstructor(): SerializableCtor<EarthEngineMap> {
    return EarthEngineMap;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'fileFormat': EarthEngineMapFileFormatEnum},
      keys: [
        'bandIds', 'expression', 'fileFormat', 'name', 'visualizationOptions'
      ],
      objects: {
        'expression': Expression,
        'visualizationOptions': VisualizationOptions
      }
    };
  }
}

export interface EmptyParameters {}
export class Empty extends Serializable {
  constructor(parameters: EmptyParameters = {}) {
    super();
  }

  getConstructor(): SerializableCtor<Empty> {
    return Empty;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: []};
  }
}

export interface ExportImageRequestParameters {
  expression?: Expression|null;
  description?: string|null;
  fileExportOptions?: ImageFileExportOptions|null;
  assetExportOptions?: ImageAssetExportOptions|null;
  maxPixels?: string|null;
  grid?: PixelGrid|null;
  requestId?: string|null;
  maxWorkerCount?: number|null;
}
export class ExportImageRequest extends Serializable {
  constructor(parameters: ExportImageRequestParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'fileExportOptions',
        (parameters.fileExportOptions == null) ?
            (null) :
            (parameters.fileExportOptions));
    this.Serializable$set(
        'assetExportOptions',
        (parameters.assetExportOptions == null) ?
            (null) :
            (parameters.assetExportOptions));
    this.Serializable$set(
        'maxPixels',
        (parameters.maxPixels == null) ? (null) : (parameters.maxPixels));
    this.Serializable$set(
        'grid', (parameters.grid == null) ? (null) : (parameters.grid));
    this.Serializable$set(
        'requestId',
        (parameters.requestId == null) ? (null) : (parameters.requestId));
    this.Serializable$set(
        'maxWorkerCount',
        (parameters.maxWorkerCount == null) ? (null) :
                                              (parameters.maxWorkerCount));
  }

  get assetExportOptions(): ImageAssetExportOptions|null {
    return (
        (this.Serializable$has('assetExportOptions')) ?
            (this.Serializable$get('assetExportOptions')) :
            (null));
  }

  /**
   * If specified, configures export as an Earth Engine asset.
   */
  set assetExportOptions(value: ImageAssetExportOptions|null) {
    this.Serializable$set('assetExportOptions', value);
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * An optional human-readable name of the task.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * An expression that evaluates to the image to compute and export.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get fileExportOptions(): ImageFileExportOptions|null {
    return (
        (this.Serializable$has('fileExportOptions')) ?
            (this.Serializable$get('fileExportOptions')) :
            (null));
  }

  /**
   * If specified, configures export as a file.
   */
  set fileExportOptions(value: ImageFileExportOptions|null) {
    this.Serializable$set('fileExportOptions', value);
  }

  get grid(): PixelGrid|null {
    return (
        (this.Serializable$has('grid')) ? (this.Serializable$get('grid')) :
                                          (null));
  }

  /**
   * Optional parameters describing how the image computed by
   * `expression` should be reprojected and clipped. If not present, the
   * full computed image is returned in its native projection.
   */
  set grid(value: PixelGrid|null) {
    this.Serializable$set('grid', value);
  }

  get maxPixels(): string|null {
    return (
        (this.Serializable$has('maxPixels')) ?
            (this.Serializable$get('maxPixels')) :
            (null));
  }

  /**
   * The maximum number of pixels to compute and export. This is a safety guard
   * to prevent you from accidentally starting a larger export than you had
   * intended. The default value is 1e8 pixels, but you can set the value
   * explicitly to raise or lower this limit.
   */
  set maxPixels(value: string|null) {
    this.Serializable$set('maxPixels', value);
  }

  get maxWorkerCount(): number|null {
    return (
        (this.Serializable$has('maxWorkerCount')) ?
            (this.Serializable$get('maxWorkerCount')) :
            (null));
  }

  /**
   * Optional parameter setting the maximum amount of workers to use.
   */
  set maxWorkerCount(value: number|null) {
    this.Serializable$set('maxWorkerCount', value);
  }

  get requestId(): string|null {
    return (
        (this.Serializable$has('requestId')) ?
            (this.Serializable$get('requestId')) :
            (null));
  }

  /**
   * A unique string used to detect duplicated requests. If more than one
   * request is made by the same user with the same non-empty `request_id`,
   * only one of those requests may successfully start a long-running operation.
   * `request_id` may contain the characters a..z, A..Z, 0-9, or '-'.
   * `request_id` may be at most 60 characters long.
   */
  set requestId(value: string|null) {
    this.Serializable$set('requestId', value);
  }

  getConstructor(): SerializableCtor<ExportImageRequest> {
    return ExportImageRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: [
        'assetExportOptions', 'description', 'expression', 'fileExportOptions',
        'grid', 'maxPixels', 'maxWorkerCount', 'requestId'
      ],
      objects: {
        'assetExportOptions': ImageAssetExportOptions,
        'expression': Expression,
        'fileExportOptions': ImageFileExportOptions,
        'grid': PixelGrid
      }
    };
  }
}

export interface ExportMapRequestParameters {
  expression?: Expression|null;
  description?: string|null;
  tileOptions?: TileOptions|null;
  tileExportOptions?: ImageFileExportOptions|null;
  requestId?: string|null;
  maxWorkerCount?: number|null;
}
export class ExportMapRequest extends Serializable {
  constructor(parameters: ExportMapRequestParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'tileOptions',
        (parameters.tileOptions == null) ? (null) : (parameters.tileOptions));
    this.Serializable$set(
        'tileExportOptions',
        (parameters.tileExportOptions == null) ?
            (null) :
            (parameters.tileExportOptions));
    this.Serializable$set(
        'requestId',
        (parameters.requestId == null) ? (null) : (parameters.requestId));
    this.Serializable$set(
        'maxWorkerCount',
        (parameters.maxWorkerCount == null) ? (null) :
                                              (parameters.maxWorkerCount));
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * An optional human-readable name of the task.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * An expression that evaluates to the image to compute and export. The
   * bounds of the image will be used to determine the set of map tiles to
   * render. To control the exported region, clip the image prior to exporting.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get maxWorkerCount(): number|null {
    return (
        (this.Serializable$has('maxWorkerCount')) ?
            (this.Serializable$get('maxWorkerCount')) :
            (null));
  }

  /**
   * Optional parameter setting the maximum amount of workers to use.
   */
  set maxWorkerCount(value: number|null) {
    this.Serializable$set('maxWorkerCount', value);
  }

  get requestId(): string|null {
    return (
        (this.Serializable$has('requestId')) ?
            (this.Serializable$get('requestId')) :
            (null));
  }

  /**
   * A unique string used to detect duplicated requests. If more than one
   * request is made by the same user with the same non-empty `request_id`,
   * only one of those requests may successfully start a long-running operation.
   * `request_id` may contain the characters a..z, A..Z, 0-9, or '-'.
   * `request_id` may be at most 60 characters long.
   */
  set requestId(value: string|null) {
    this.Serializable$set('requestId', value);
  }

  get tileExportOptions(): ImageFileExportOptions|null {
    return (
        (this.Serializable$has('tileExportOptions')) ?
            (this.Serializable$get('tileExportOptions')) :
            (null));
  }

  /**
   * Options for where and in what form to export the map tiles. Cloud Storage
   * is currently the only supported destination for map exports.
   */
  set tileExportOptions(value: ImageFileExportOptions|null) {
    this.Serializable$set('tileExportOptions', value);
  }

  get tileOptions(): TileOptions|null {
    return (
        (this.Serializable$has('tileOptions')) ?
            (this.Serializable$get('tileOptions')) :
            (null));
  }

  /**
   * Options describing the map tiles to generate.
   */
  set tileOptions(value: TileOptions|null) {
    this.Serializable$set('tileOptions', value);
  }

  getConstructor(): SerializableCtor<ExportMapRequest> {
    return ExportMapRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: [
        'description', 'expression', 'maxWorkerCount', 'requestId',
        'tileExportOptions', 'tileOptions'
      ],
      objects: {
        'expression': Expression,
        'tileExportOptions': ImageFileExportOptions,
        'tileOptions': TileOptions
      }
    };
  }
}

export interface ExportTableRequestParameters {
  expression?: Expression|null;
  description?: string|null;
  fileExportOptions?: TableFileExportOptions|null;
  assetExportOptions?: TableAssetExportOptions|null;
  selectors?: Array<string>|null;
  requestId?: string|null;
  maxErrorMeters?: number|null;
  maxWorkerCount?: number|null;
  maxVertices?: number|null;
}
export class ExportTableRequest extends Serializable {
  constructor(parameters: ExportTableRequestParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'fileExportOptions',
        (parameters.fileExportOptions == null) ?
            (null) :
            (parameters.fileExportOptions));
    this.Serializable$set(
        'assetExportOptions',
        (parameters.assetExportOptions == null) ?
            (null) :
            (parameters.assetExportOptions));
    this.Serializable$set(
        'selectors',
        (parameters.selectors == null) ? (null) : (parameters.selectors));
    this.Serializable$set(
        'requestId',
        (parameters.requestId == null) ? (null) : (parameters.requestId));
    this.Serializable$set(
        'maxErrorMeters',
        (parameters.maxErrorMeters == null) ? (null) :
                                              (parameters.maxErrorMeters));
    this.Serializable$set(
        'maxWorkerCount',
        (parameters.maxWorkerCount == null) ? (null) :
                                              (parameters.maxWorkerCount));
    this.Serializable$set(
        'maxVertices',
        (parameters.maxVertices == null) ? (null) : (parameters.maxVertices));
  }

  get assetExportOptions(): TableAssetExportOptions|null {
    return (
        (this.Serializable$has('assetExportOptions')) ?
            (this.Serializable$get('assetExportOptions')) :
            (null));
  }

  /**
   * If specified, configures export as an Earth Engine asset.
   */
  set assetExportOptions(value: TableAssetExportOptions|null) {
    this.Serializable$set('assetExportOptions', value);
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * An optional human-readable name of the task.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * An expression that evaluates to the table to compute and export.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get fileExportOptions(): TableFileExportOptions|null {
    return (
        (this.Serializable$has('fileExportOptions')) ?
            (this.Serializable$get('fileExportOptions')) :
            (null));
  }

  /**
   * If specified, configures export as a file.
   */
  set fileExportOptions(value: TableFileExportOptions|null) {
    this.Serializable$set('fileExportOptions', value);
  }

  get maxErrorMeters(): number|null {
    return (
        (this.Serializable$has('maxErrorMeters')) ?
            (this.Serializable$get('maxErrorMeters')) :
            (null));
  }

  /**
   * The max allowed error in meters when transforming geometry between
   * coordinate systems. If empty, the max error is 1 meter by default.
   */
  set maxErrorMeters(value: number|null) {
    this.Serializable$set('maxErrorMeters', value);
  }

  get maxVertices(): number|null {
    return (
        (this.Serializable$has('maxVertices')) ?
            (this.Serializable$get('maxVertices')) :
            (null));
  }

  /**
   * Max number of uncut vertices per geometry; geometries with more vertices
   * will be cut into pieces smaller than this size.
   */
  set maxVertices(value: number|null) {
    this.Serializable$set('maxVertices', value);
  }

  get maxWorkerCount(): number|null {
    return (
        (this.Serializable$has('maxWorkerCount')) ?
            (this.Serializable$get('maxWorkerCount')) :
            (null));
  }

  /**
   * Optional parameter setting the maximum amount of workers to use.
   */
  set maxWorkerCount(value: number|null) {
    this.Serializable$set('maxWorkerCount', value);
  }

  get requestId(): string|null {
    return (
        (this.Serializable$has('requestId')) ?
            (this.Serializable$get('requestId')) :
            (null));
  }

  /**
   * A unique string used to detect duplicated requests. If more than one
   * request is made by the same user with the same non-empty `request_id`,
   * only one of those requests may successfully start a long-running operation.
   * `request_id` may contain the characters a..z, A..Z, 0-9, or '-'.
   * `request_id` may be at most 60 characters long.
   */
  set requestId(value: string|null) {
    this.Serializable$set('requestId', value);
  }

  get selectors(): Array<string>|null {
    return (
        (this.Serializable$has('selectors')) ?
            (this.Serializable$get('selectors')) :
            (null));
  }

  /**
   * An optional explicit list of columns to include in the result.
   */
  set selectors(value: Array<string>|null) {
    this.Serializable$set('selectors', value);
  }

  getConstructor(): SerializableCtor<ExportTableRequest> {
    return ExportTableRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: [
        'assetExportOptions', 'description', 'expression', 'fileExportOptions',
        'maxErrorMeters', 'maxVertices', 'maxWorkerCount', 'requestId',
        'selectors'
      ],
      objects: {
        'assetExportOptions': TableAssetExportOptions,
        'expression': Expression,
        'fileExportOptions': TableFileExportOptions
      }
    };
  }
}

export interface ExportVideoMapRequestParameters {
  expression?: Expression|null;
  description?: string|null;
  videoOptions?: VideoOptions|null;
  tileOptions?: TileOptions|null;
  tileExportOptions?: VideoFileExportOptions|null;
  requestId?: string|null;
  version?: ExportVideoMapRequestVersion|null;
  maxWorkerCount?: number|null;
}
export class ExportVideoMapRequest extends Serializable {
  constructor(parameters: ExportVideoMapRequestParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'videoOptions',
        (parameters.videoOptions == null) ? (null) : (parameters.videoOptions));
    this.Serializable$set(
        'tileOptions',
        (parameters.tileOptions == null) ? (null) : (parameters.tileOptions));
    this.Serializable$set(
        'tileExportOptions',
        (parameters.tileExportOptions == null) ?
            (null) :
            (parameters.tileExportOptions));
    this.Serializable$set(
        'requestId',
        (parameters.requestId == null) ? (null) : (parameters.requestId));
    this.Serializable$set(
        'version',
        (parameters.version == null) ? (null) : (parameters.version));
    this.Serializable$set(
        'maxWorkerCount',
        (parameters.maxWorkerCount == null) ? (null) :
                                              (parameters.maxWorkerCount));
  }

  static get Version(): IExportVideoMapRequestVersionEnum {
    return ExportVideoMapRequestVersionEnum;
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * An optional human-readable name of the task.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * An expression that evaluates to the image collection to compute and export
   * as a video. The bounds of the first image will be used to determine the
   * set of video map tiles to render. To control the exported region, clip the
   * images prior to exporting.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get maxWorkerCount(): number|null {
    return (
        (this.Serializable$has('maxWorkerCount')) ?
            (this.Serializable$get('maxWorkerCount')) :
            (null));
  }

  /**
   * Optional parameter setting the maximum amount of workers to use.
   */
  set maxWorkerCount(value: number|null) {
    this.Serializable$set('maxWorkerCount', value);
  }

  get requestId(): string|null {
    return (
        (this.Serializable$has('requestId')) ?
            (this.Serializable$get('requestId')) :
            (null));
  }

  /**
   * A unique string used to detect duplicated requests. If more than one
   * request is made by the same user with the same non-empty `request_id`,
   * only one of those requests may successfully start a long-running operation.
   * `request_id` may contain the characters a..z, A..Z, 0-9, or '-'.
   * `request_id` may be at most 60 characters long.
   */
  set requestId(value: string|null) {
    this.Serializable$set('requestId', value);
  }

  get tileExportOptions(): VideoFileExportOptions|null {
    return (
        (this.Serializable$has('tileExportOptions')) ?
            (this.Serializable$get('tileExportOptions')) :
            (null));
  }

  /**
   * Options for where and in what form to export the video tiles. Cloud
   * Storage is currently the only supported destination for video map exports.
   */
  set tileExportOptions(value: VideoFileExportOptions|null) {
    this.Serializable$set('tileExportOptions', value);
  }

  get tileOptions(): TileOptions|null {
    return (
        (this.Serializable$has('tileOptions')) ?
            (this.Serializable$get('tileOptions')) :
            (null));
  }

  /**
   * Options describing the video map tiles to generate.
   */
  set tileOptions(value: TileOptions|null) {
    this.Serializable$set('tileOptions', value);
  }

  get version(): ExportVideoMapRequestVersion|null {
    return (
        (this.Serializable$has('version')) ?
            (this.Serializable$get('version')) :
            (null));
  }

  /**
   * The version of ExportVideoMap to use.
   */
  set version(value: ExportVideoMapRequestVersion|null) {
    this.Serializable$set('version', value);
  }

  get videoOptions(): VideoOptions|null {
    return (
        (this.Serializable$has('videoOptions')) ?
            (this.Serializable$get('videoOptions')) :
            (null));
  }

  /**
   * Basic options describing the videos to generate.
   */
  set videoOptions(value: VideoOptions|null) {
    this.Serializable$set('videoOptions', value);
  }

  getConstructor(): SerializableCtor<ExportVideoMapRequest> {
    return ExportVideoMapRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'version': ExportVideoMapRequestVersionEnum},
      keys: [
        'description', 'expression', 'maxWorkerCount', 'requestId',
        'tileExportOptions', 'tileOptions', 'version', 'videoOptions'
      ],
      objects: {
        'expression': Expression,
        'tileExportOptions': VideoFileExportOptions,
        'tileOptions': TileOptions,
        'videoOptions': VideoOptions
      }
    };
  }
}

export interface ExportVideoRequestParameters {
  expression?: Expression|null;
  description?: string|null;
  videoOptions?: VideoOptions|null;
  fileExportOptions?: VideoFileExportOptions|null;
  requestId?: string|null;
  maxWorkerCount?: number|null;
}
export class ExportVideoRequest extends Serializable {
  constructor(parameters: ExportVideoRequestParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'videoOptions',
        (parameters.videoOptions == null) ? (null) : (parameters.videoOptions));
    this.Serializable$set(
        'fileExportOptions',
        (parameters.fileExportOptions == null) ?
            (null) :
            (parameters.fileExportOptions));
    this.Serializable$set(
        'requestId',
        (parameters.requestId == null) ? (null) : (parameters.requestId));
    this.Serializable$set(
        'maxWorkerCount',
        (parameters.maxWorkerCount == null) ? (null) :
                                              (parameters.maxWorkerCount));
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * An optional human-readable name of the task.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * An expression that evaluates to the video to compute and export,
   * represented as an image collection.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get fileExportOptions(): VideoFileExportOptions|null {
    return (
        (this.Serializable$has('fileExportOptions')) ?
            (this.Serializable$get('fileExportOptions')) :
            (null));
  }

  /**
   * Options for where and in what form to export the video.
   */
  set fileExportOptions(value: VideoFileExportOptions|null) {
    this.Serializable$set('fileExportOptions', value);
  }

  get maxWorkerCount(): number|null {
    return (
        (this.Serializable$has('maxWorkerCount')) ?
            (this.Serializable$get('maxWorkerCount')) :
            (null));
  }

  /**
   * Optional parameter setting the maximum amount of workers to use.
   */
  set maxWorkerCount(value: number|null) {
    this.Serializable$set('maxWorkerCount', value);
  }

  get requestId(): string|null {
    return (
        (this.Serializable$has('requestId')) ?
            (this.Serializable$get('requestId')) :
            (null));
  }

  /**
   * A unique string used to detect duplicated requests. If more than one
   * request is made by the same user with the same non-empty `request_id`,
   * only one of those requests may successfully start a long-running operation.
   * `request_id` may contain the characters a..z, A..Z, 0-9, or '-'.
   * `request_id` may be at most 60 characters long.
   */
  set requestId(value: string|null) {
    this.Serializable$set('requestId', value);
  }

  get videoOptions(): VideoOptions|null {
    return (
        (this.Serializable$has('videoOptions')) ?
            (this.Serializable$get('videoOptions')) :
            (null));
  }

  /**
   * Basic options describing the video to generate.
   */
  set videoOptions(value: VideoOptions|null) {
    this.Serializable$set('videoOptions', value);
  }

  getConstructor(): SerializableCtor<ExportVideoRequest> {
    return ExportVideoRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: [
        'description', 'expression', 'fileExportOptions', 'maxWorkerCount',
        'requestId', 'videoOptions'
      ],
      objects: {
        'expression': Expression,
        'fileExportOptions': VideoFileExportOptions,
        'videoOptions': VideoOptions
      }
    };
  }
}

export interface ExprParameters {
  expression?: string|null;
  title?: string|null;
  description?: string|null;
  location?: string|null;
}
export class Expr extends Serializable {
  constructor(parameters: ExprParameters = {}) {
    super();
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'title', (parameters.title == null) ? (null) : (parameters.title));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'location',
        (parameters.location == null) ? (null) : (parameters.location));
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * Optional. Description of the expression. This is a longer text which
   * describes the expression, e.g. when hovered over it in a UI.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get expression(): string|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * Textual representation of an expression in Common Expression Language
   * syntax.
   */
  set expression(value: string|null) {
    this.Serializable$set('expression', value);
  }

  get location(): string|null {
    return (
        (this.Serializable$has('location')) ?
            (this.Serializable$get('location')) :
            (null));
  }

  /**
   * Optional. String indicating the location of the expression for error
   * reporting, e.g. a file name and a position in the file.
   */
  set location(value: string|null) {
    this.Serializable$set('location', value);
  }

  get title(): string|null {
    return (
        (this.Serializable$has('title')) ? (this.Serializable$get('title')) :
                                           (null));
  }

  /**
   * Optional. Title for the expression, i.e. a short string describing
   * its purpose. This can be used e.g. in UIs which allow to enter the
   * expression.
   */
  set title(value: string|null) {
    this.Serializable$set('title', value);
  }

  getConstructor(): SerializableCtor<Expr> {
    return Expr;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['description', 'expression', 'location', 'title']};
  }
}

export interface ExpressionParameters {
  values?: ApiClientObjectMap<ValueNode>|null;
  result?: string|null;
}
export class Expression extends Serializable {
  constructor(parameters: ExpressionParameters = {}) {
    super();
    this.Serializable$set(
        'values', (parameters.values == null) ? (null) : (parameters.values));
    this.Serializable$set(
        'result', (parameters.result == null) ? (null) : (parameters.result));
  }

  get result(): string|null {
    return (
        (this.Serializable$has('result')) ? (this.Serializable$get('result')) :
                                            (null));
  }

  /**
   * Which of the ValueNodes in \"values\" is the final result of the
   * computation.
   */
  set result(value: string|null) {
    this.Serializable$set('result', value);
  }

  get values(): ApiClientObjectMap<ValueNode>|null {
    return (
        (this.Serializable$has('values')) ? (this.Serializable$get('values')) :
                                            (null));
  }

  /**
   * All intermediate values in the computation. The directed graph these form
   * must be acyclic.
   */
  set values(value: ApiClientObjectMap<ValueNode>|null) {
    this.Serializable$set('values', value);
  }

  getConstructor(): SerializableCtor<Expression> {
    return Expression;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['result', 'values'],
      objectMaps: {
        'values': {
          ctor: ValueNode,
          isPropertyArray: false,
          isSerializable: true,
          isValueArray: false
        }
      }
    };
  }
}

export interface FeatureParameters {
  type?: string|null;
  geometry?: any|null;
  properties?: any|null;
}
export class Feature extends Serializable {
  constructor(parameters: FeatureParameters = {}) {
    super();
    this.Serializable$set(
        'type', (parameters.type == null) ? (null) : (parameters.type));
    this.Serializable$set(
        'geometry',
        (parameters.geometry == null) ? (null) : (parameters.geometry));
    this.Serializable$set(
        'properties',
        (parameters.properties == null) ? (null) : (parameters.properties));
  }

  get geometry(): any|null {
    return (
        (this.Serializable$has('geometry')) ?
            (this.Serializable$get('geometry')) :
            (null));
  }

  /**
   * The geometry of the feature.
   * This will contain a `google.protobuf.Struct` if geometry is present for
   * this feature. Otherwise, it will hold a `google.protobuf.NullValue`.
   */
  set geometry(value: any|null) {
    this.Serializable$set('geometry', value);
  }

  get properties(): any|null {
    return (
        (this.Serializable$has('properties')) ?
            (this.Serializable$get('properties')) :
            (null));
  }

  /**
   * The properties of the feature.
   * This will contain a `google.protobuf.Struct` if properties are present for
   * this feature. Otherwise, it will hold a `google.protobuf.NullValue`.
   */
  set properties(value: any|null) {
    this.Serializable$set('properties', value);
  }

  get type(): string|null {
    return (
        (this.Serializable$has('type')) ? (this.Serializable$get('type')) :
                                          (null));
  }

  /**
   * This string is always present and equal to \"Feature\".
   */
  set type(value: string|null) {
    this.Serializable$set('type', value);
  }

  getConstructor(): SerializableCtor<Feature> {
    return Feature;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['geometry', 'properties', 'type']};
  }
}

export interface FilmstripThumbnailParameters {
  name?: string|null;
  expression?: Expression|null;
  orientation?: FilmstripThumbnailOrientation|null;
  fileFormat?: FilmstripThumbnailFileFormat|null;
  grid?: PixelGrid|null;
}
export class FilmstripThumbnail extends Serializable {
  constructor(parameters: FilmstripThumbnailParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'orientation',
        (parameters.orientation == null) ? (null) : (parameters.orientation));
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'grid', (parameters.grid == null) ? (null) : (parameters.grid));
  }

  static get FileFormat(): IFilmstripThumbnailFileFormatEnum {
    return FilmstripThumbnailFileFormatEnum;
  }

  static get Orientation(): IFilmstripThumbnailOrientationEnum {
    return FilmstripThumbnailOrientationEnum;
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * The expression to compute. Must evaluate to an ImageCollection.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get fileFormat(): FilmstripThumbnailFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The output encoding in which to generate the resulting image.
   */
  set fileFormat(value: FilmstripThumbnailFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get grid(): PixelGrid|null {
    return (
        (this.Serializable$has('grid')) ? (this.Serializable$get('grid')) :
                                          (null));
  }

  /**
   * An optional pixel grid describing how the images computed by
   * `expression` are reprojected and clipped.
   */
  set grid(value: PixelGrid|null) {
    this.Serializable$set('grid', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The resource name representing the filmstrip thumbnail, of the form
   * \"projects/* /filmstripThumbnails/**\"
   * (e.g. \"projects/earthengine-legacy/filmstripThumbnails/<FILMSTRIP-ID>\").
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get orientation(): FilmstripThumbnailOrientation|null {
    return (
        (this.Serializable$has('orientation')) ?
            (this.Serializable$get('orientation')) :
            (null));
  }

  /**
   * How the images should be placed to form the filmstrip thumbnail.
   */
  set orientation(value: FilmstripThumbnailOrientation|null) {
    this.Serializable$set('orientation', value);
  }

  getConstructor(): SerializableCtor<FilmstripThumbnail> {
    return FilmstripThumbnail;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {
        'fileFormat': FilmstripThumbnailFileFormatEnum,
        'orientation': FilmstripThumbnailOrientationEnum
      },
      keys: ['expression', 'fileFormat', 'grid', 'name', 'orientation'],
      objects: {'expression': Expression, 'grid': PixelGrid}
    };
  }
}

export interface FolderQuotaParameters {
  sizeBytes?: string|null;
  maxSizeBytes?: string|null;
  assetCount?: string|null;
  maxAssetCount?: string|null;
}
export class FolderQuota extends Serializable {
  constructor(parameters: FolderQuotaParameters = {}) {
    super();
    this.Serializable$set(
        'sizeBytes',
        (parameters.sizeBytes == null) ? (null) : (parameters.sizeBytes));
    this.Serializable$set(
        'maxSizeBytes',
        (parameters.maxSizeBytes == null) ? (null) : (parameters.maxSizeBytes));
    this.Serializable$set(
        'assetCount',
        (parameters.assetCount == null) ? (null) : (parameters.assetCount));
    this.Serializable$set(
        'maxAssetCount',
        (parameters.maxAssetCount == null) ? (null) :
                                             (parameters.maxAssetCount));
  }

  get assetCount(): string|null {
    return (
        (this.Serializable$has('assetCount')) ?
            (this.Serializable$get('assetCount')) :
            (null));
  }

  /**
   * The number of assets stored in the folder.
   */
  set assetCount(value: string|null) {
    this.Serializable$set('assetCount', value);
  }

  get maxAssetCount(): string|null {
    return (
        (this.Serializable$has('maxAssetCount')) ?
            (this.Serializable$get('maxAssetCount')) :
            (null));
  }

  /**
   * The maximum number of assets that can be stored in the folder.
   */
  set maxAssetCount(value: string|null) {
    this.Serializable$set('maxAssetCount', value);
  }

  get maxSizeBytes(): string|null {
    return (
        (this.Serializable$has('maxSizeBytes')) ?
            (this.Serializable$get('maxSizeBytes')) :
            (null));
  }

  /**
   * The maximum size of the folder in bytes.
   */
  set maxSizeBytes(value: string|null) {
    this.Serializable$set('maxSizeBytes', value);
  }

  get sizeBytes(): string|null {
    return (
        (this.Serializable$has('sizeBytes')) ?
            (this.Serializable$get('sizeBytes')) :
            (null));
  }

  /**
   * The size of the folder in bytes.
   */
  set sizeBytes(value: string|null) {
    this.Serializable$set('sizeBytes', value);
  }

  getConstructor(): SerializableCtor<FolderQuota> {
    return FolderQuota;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['assetCount', 'maxAssetCount', 'maxSizeBytes', 'sizeBytes']};
  }
}

export interface FunctionDefinitionParameters {
  argumentNames?: Array<string>|null;
  body?: string|null;
}
export class FunctionDefinition extends Serializable {
  constructor(parameters: FunctionDefinitionParameters = {}) {
    super();
    this.Serializable$set(
        'argumentNames',
        (parameters.argumentNames == null) ? (null) :
                                             (parameters.argumentNames));
    this.Serializable$set(
        'body', (parameters.body == null) ? (null) : (parameters.body));
  }

  get argumentNames(): Array<string>|null {
    return (
        (this.Serializable$has('argumentNames')) ?
            (this.Serializable$get('argumentNames')) :
            (null));
  }

  /**
   * The names of the arguments accepted by this function. These can be referred
   * to by the \"argument_reference\" field of ValueNodes within the body.
   */
  set argumentNames(value: Array<string>|null) {
    this.Serializable$set('argumentNames', value);
  }

  get body(): string|null {
    return (
        (this.Serializable$has('body')) ? (this.Serializable$get('body')) :
                                          (null));
  }

  /**
   * The function body itself, as a reference to one of the ValueNodes in
   * the enclosing Expression.
   */
  set body(value: string|null) {
    this.Serializable$set('body', value);
  }

  getConstructor(): SerializableCtor<FunctionDefinition> {
    return FunctionDefinition;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['argumentNames', 'body']};
  }
}

export interface FunctionInvocationParameters {
  functionName?: string|null;
  functionReference?: string|null;
  arguments?: ApiClientObjectMap<ValueNode>|null;
}
export class FunctionInvocation extends Serializable {
  constructor(parameters: FunctionInvocationParameters = {}) {
    super();
    this.Serializable$set(
        'functionName',
        (parameters.functionName == null) ? (null) : (parameters.functionName));
    this.Serializable$set(
        'functionReference',
        (parameters.functionReference == null) ?
            (null) :
            (parameters.functionReference));
    this.Serializable$set(
        'arguments',
        (parameters.arguments == null) ? (null) : (parameters.arguments));
  }

  get arguments(): ApiClientObjectMap<ValueNode>|null {
    return (
        (this.Serializable$has('arguments')) ?
            (this.Serializable$get('arguments')) :
            (null));
  }

  /**
   * Arguments to this invocation. Order is insignificant.
   */
  set arguments(value: ApiClientObjectMap<ValueNode>|null) {
    this.Serializable$set('arguments', value);
  }

  get functionName(): string|null {
    return (
        (this.Serializable$has('functionName')) ?
            (this.Serializable$get('functionName')) :
            (null));
  }

  /**
   * A named function from the Earth Engine API.
   */
  set functionName(value: string|null) {
    this.Serializable$set('functionName', value);
  }

  get functionReference(): string|null {
    return (
        (this.Serializable$has('functionReference')) ?
            (this.Serializable$get('functionReference')) :
            (null));
  }

  /**
   * A reference to a function-valued value. This is usually a direct
   * reference to a FunctionDefinition value, but need not be: it could be a
   * reference to a FunctionInvocation whose result is a function, or to a
   * function-valued argument value.
   */
  set functionReference(value: string|null) {
    this.Serializable$set('functionReference', value);
  }

  getConstructor(): SerializableCtor<FunctionInvocation> {
    return FunctionInvocation;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['arguments', 'functionName', 'functionReference'],
      objectMaps: {
        'arguments': {
          ctor: ValueNode,
          isPropertyArray: false,
          isSerializable: true,
          isValueArray: false
        }
      }
    };
  }
}

export interface GcsDestinationParameters {
  bucket?: string|null;
  filenamePrefix?: string|null;
  permissions?: GcsDestinationPermissions|null;
  bucketCorsUris?: Array<string>|null;
}
export class GcsDestination extends Serializable {
  constructor(parameters: GcsDestinationParameters = {}) {
    super();
    this.Serializable$set(
        'bucket', (parameters.bucket == null) ? (null) : (parameters.bucket));
    this.Serializable$set(
        'filenamePrefix',
        (parameters.filenamePrefix == null) ? (null) :
                                              (parameters.filenamePrefix));
    this.Serializable$set(
        'permissions',
        (parameters.permissions == null) ? (null) : (parameters.permissions));
    this.Serializable$set(
        'bucketCorsUris',
        (parameters.bucketCorsUris == null) ? (null) :
                                              (parameters.bucketCorsUris));
  }

  static get Permissions(): IGcsDestinationPermissionsEnum {
    return GcsDestinationPermissionsEnum;
  }

  get bucket(): string|null {
    return (
        (this.Serializable$has('bucket')) ? (this.Serializable$get('bucket')) :
                                            (null));
  }

  /**
   * The Google Cloud Storage destination bucket.
   */
  set bucket(value: string|null) {
    this.Serializable$set('bucket', value);
  }

  get bucketCorsUris(): Array<string>|null {
    return (
        (this.Serializable$has('bucketCorsUris')) ?
            (this.Serializable$get('bucketCorsUris')) :
            (null));
  }

  /**
   * Optional list of URIs to whitelist for the CORS settings on the bucket.
   * Used to enable websites to access exported files via JavaScript.
   */
  set bucketCorsUris(value: Array<string>|null) {
    this.Serializable$set('bucketCorsUris', value);
  }

  get filenamePrefix(): string|null {
    return (
        (this.Serializable$has('filenamePrefix')) ?
            (this.Serializable$get('filenamePrefix')) :
            (null));
  }

  /**
   * The string used as the prefix for each output file. A trailing \"/\"
   * indicates a path. The filenames of the exported files will be constructed
   * from this prefix, the coordinates of each file in a mosaic (if any), and
   * a file extension corresponding to the file format.
   */
  set filenamePrefix(value: string|null) {
    this.Serializable$set('filenamePrefix', value);
  }

  get permissions(): GcsDestinationPermissions|null {
    return (
        (this.Serializable$has('permissions')) ?
            (this.Serializable$get('permissions')) :
            (null));
  }

  /**
   * Specifies the permissions to set on the exported tiles. If unspecified,
   * defaults to DEFAULT_OBJECT_ACL.
   */
  set permissions(value: GcsDestinationPermissions|null) {
    this.Serializable$set('permissions', value);
  }

  getConstructor(): SerializableCtor<GcsDestination> {
    return GcsDestination;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'permissions': GcsDestinationPermissionsEnum},
      keys: ['bucket', 'bucketCorsUris', 'filenamePrefix', 'permissions']
    };
  }
}

export interface GcsLocationParameters {
  uris?: Array<string>|null;
}
export class GcsLocation extends Serializable {
  constructor(parameters: GcsLocationParameters = {}) {
    super();
    this.Serializable$set(
        'uris', (parameters.uris == null) ? (null) : (parameters.uris));
  }

  get uris(): Array<string>|null {
    return (
        (this.Serializable$has('uris')) ? (this.Serializable$get('uris')) :
                                          (null));
  }

  /**
   * The URIs of the data. Only Google Cloud Storage URIs are supported. Each
   * URI must be specified in the following format:
   * \"gs://bucket-id/object-id\". Only one URI is currently supported. If more
   * than one URI is specified an `INALID_ARGUMENT` error is returned.
   */
  set uris(value: Array<string>|null) {
    this.Serializable$set('uris', value);
  }

  getConstructor(): SerializableCtor<GcsLocation> {
    return GcsLocation;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['uris']};
  }
}

export interface GeoTiffImageExportOptionsParameters {
  cloudOptimized?: boolean|null;
  tileDimensions?: GridDimensions|null;
  skipEmptyFiles?: boolean|null;
}
export class GeoTiffImageExportOptions extends Serializable {
  constructor(parameters: GeoTiffImageExportOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'cloudOptimized',
        (parameters.cloudOptimized == null) ? (null) :
                                              (parameters.cloudOptimized));
    this.Serializable$set(
        'tileDimensions',
        (parameters.tileDimensions == null) ? (null) :
                                              (parameters.tileDimensions));
    this.Serializable$set(
        'skipEmptyFiles',
        (parameters.skipEmptyFiles == null) ? (null) :
                                              (parameters.skipEmptyFiles));
  }

  get cloudOptimized(): boolean|null {
    return (
        (this.Serializable$has('cloudOptimized')) ?
            (this.Serializable$get('cloudOptimized')) :
            (null));
  }

  /**
   * If true, generates 'cloud optimized' GeoTIFF files for more efficient
   * access in cloud environments (see www.cogeo.org).
   */
  set cloudOptimized(value: boolean|null) {
    this.Serializable$set('cloudOptimized', value);
  }

  get skipEmptyFiles(): boolean|null {
    return (
        (this.Serializable$has('skipEmptyFiles')) ?
            (this.Serializable$get('skipEmptyFiles')) :
            (null));
  }

  /**
   * If true, skip writing empty (i.e. fully-masked) image files.
   */
  set skipEmptyFiles(value: boolean|null) {
    this.Serializable$set('skipEmptyFiles', value);
  }

  get tileDimensions(): GridDimensions|null {
    return (
        (this.Serializable$has('tileDimensions')) ?
            (this.Serializable$get('tileDimensions')) :
            (null));
  }

  /**
   * Optional explicit dimensions in pixels into which to split the image if it
   * is too large to fit in a single file.
   */
  set tileDimensions(value: GridDimensions|null) {
    this.Serializable$set('tileDimensions', value);
  }

  getConstructor(): SerializableCtor<GeoTiffImageExportOptions> {
    return GeoTiffImageExportOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['cloudOptimized', 'skipEmptyFiles', 'tileDimensions'],
      objects: {'tileDimensions': GridDimensions}
    };
  }
}

export interface GetIamPolicyRequestParameters {
  options?: GetPolicyOptions|null;
}
export class GetIamPolicyRequest extends Serializable {
  constructor(parameters: GetIamPolicyRequestParameters = {}) {
    super();
    this.Serializable$set(
        'options',
        (parameters.options == null) ? (null) : (parameters.options));
  }

  get options(): GetPolicyOptions|null {
    return (
        (this.Serializable$has('options')) ?
            (this.Serializable$get('options')) :
            (null));
  }

  /**
   * OPTIONAL: A `GetPolicyOptions` object for specifying options to
   * `GetIamPolicy`.
   */
  set options(value: GetPolicyOptions|null) {
    this.Serializable$set('options', value);
  }

  getConstructor(): SerializableCtor<GetIamPolicyRequest> {
    return GetIamPolicyRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['options'], objects: {'options': GetPolicyOptions}};
  }
}

export interface GetPixelsRequestParameters {
  fileFormat?: GetPixelsRequestFileFormat|null;
  grid?: PixelGrid|null;
  region?: ApiClientObjectMap<any>|null;
  bandIds?: Array<string>|null;
  visualizationOptions?: VisualizationOptions|null;
}
export class GetPixelsRequest extends Serializable {
  constructor(parameters: GetPixelsRequestParameters = {}) {
    super();
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'grid', (parameters.grid == null) ? (null) : (parameters.grid));
    this.Serializable$set(
        'region', (parameters.region == null) ? (null) : (parameters.region));
    this.Serializable$set(
        'bandIds',
        (parameters.bandIds == null) ? (null) : (parameters.bandIds));
    this.Serializable$set(
        'visualizationOptions',
        (parameters.visualizationOptions == null) ?
            (null) :
            (parameters.visualizationOptions));
  }

  static get FileFormat(): IGetPixelsRequestFileFormatEnum {
    return GetPixelsRequestFileFormatEnum;
  }

  get bandIds(): Array<string>|null {
    return (
        (this.Serializable$has('bandIds')) ?
            (this.Serializable$get('bandIds')) :
            (null));
  }

  /**
   * If present, specifies a specific set of bands from which to get pixels.
   * Bands are identified by id, as indicated by the `id` field of an
   * ImageBand proto.
   */
  set bandIds(value: Array<string>|null) {
    this.Serializable$set('bandIds', value);
  }

  get fileFormat(): GetPixelsRequestFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The output file format in which to return the pixel values.
   */
  set fileFormat(value: GetPixelsRequestFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get grid(): PixelGrid|null {
    return (
        (this.Serializable$has('grid')) ? (this.Serializable$get('grid')) :
                                          (null));
  }

  /**
   * Parameters describing the pixel grid in which to fetch data. Defaults to
   * the native pixel grid of the data.
   */
  set grid(value: PixelGrid|null) {
    this.Serializable$set('grid', value);
  }

  get region(): ApiClientObjectMap<any>|null {
    return (
        (this.Serializable$has('region')) ? (this.Serializable$get('region')) :
                                            (null));
  }

  /**
   * If present, the region of data to return, specified as a GeoJSON geometry
   * object (see RFC 7946). Since the returned image is always rectangular,
   * the bounding box of the given geometry in the output coordinate system
   * will actually be used.  If `grid.dimensions` is also specified then the
   * grid will finally be rescaled to the requested size.
   */
  set region(value: ApiClientObjectMap<any>|null) {
    this.Serializable$set('region', value);
  }

  get visualizationOptions(): VisualizationOptions|null {
    return (
        (this.Serializable$has('visualizationOptions')) ?
            (this.Serializable$get('visualizationOptions')) :
            (null));
  }

  /**
   * If present, a set of visualization options to apply to produce an
   * 8-bit RGB visualization of the data, rather than returning the raw data.
   */
  set visualizationOptions(value: VisualizationOptions|null) {
    this.Serializable$set('visualizationOptions', value);
  }

  getConstructor(): SerializableCtor<GetPixelsRequest> {
    return GetPixelsRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'fileFormat': GetPixelsRequestFileFormatEnum},
      keys: ['bandIds', 'fileFormat', 'grid', 'region', 'visualizationOptions'],
      objectMaps: {
        'region': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        }
      },
      objects: {'grid': PixelGrid, 'visualizationOptions': VisualizationOptions}
    };
  }
}

export interface GetPolicyOptionsParameters {
  requestedPolicyVersion?: number|null;
}
export class GetPolicyOptions extends Serializable {
  constructor(parameters: GetPolicyOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'requestedPolicyVersion',
        (parameters.requestedPolicyVersion == null) ?
            (null) :
            (parameters.requestedPolicyVersion));
  }

  get requestedPolicyVersion(): number|null {
    return (
        (this.Serializable$has('requestedPolicyVersion')) ?
            (this.Serializable$get('requestedPolicyVersion')) :
            (null));
  }

  /**
   * Optional. The policy format version to be returned.
   *
   * Valid values are 0, 1, and 3. Requests specifying an invalid value will be
   * rejected.
   *
   * Requests for policies with any conditional bindings must specify version 3.
   * Policies without any conditional bindings may specify any valid value or
   * leave the field unset.
   *
   * To learn which resources support conditions in their IAM policies, see the
   * [IAM
   * documentation](https://cloud.google.com/iam/help/conditions/resource-policies).
   */
  set requestedPolicyVersion(value: number|null) {
    this.Serializable$set('requestedPolicyVersion', value);
  }

  getConstructor(): SerializableCtor<GetPolicyOptions> {
    return GetPolicyOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['requestedPolicyVersion']};
  }
}

export interface GridDimensionsParameters {
  width?: number|null;
  height?: number|null;
}
export class GridDimensions extends Serializable {
  constructor(parameters: GridDimensionsParameters = {}) {
    super();
    this.Serializable$set(
        'width', (parameters.width == null) ? (null) : (parameters.width));
    this.Serializable$set(
        'height', (parameters.height == null) ? (null) : (parameters.height));
  }

  get height(): number|null {
    return (
        (this.Serializable$has('height')) ? (this.Serializable$get('height')) :
                                            (null));
  }

  /**
   * The height of the grid, in pixels.
   */
  set height(value: number|null) {
    this.Serializable$set('height', value);
  }

  get width(): number|null {
    return (
        (this.Serializable$has('width')) ? (this.Serializable$get('width')) :
                                           (null));
  }

  /**
   * The width of the grid, in pixels.
   */
  set width(value: number|null) {
    this.Serializable$set('width', value);
  }

  getConstructor(): SerializableCtor<GridDimensions> {
    return GridDimensions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['height', 'width']};
  }
}

export interface GridPointParameters {
  x?: number|null;
  y?: number|null;
}
export class GridPoint extends Serializable {
  constructor(parameters: GridPointParameters = {}) {
    super();
    this.Serializable$set(
        'x', (parameters.x == null) ? (null) : (parameters.x));
    this.Serializable$set(
        'y', (parameters.y == null) ? (null) : (parameters.y));
  }

  get x(): number|null {
    return (
        (this.Serializable$has('x')) ? (this.Serializable$get('x')) : (null));
  }

  /**
   * The x coordinate value.
   */
  set x(value: number|null) {
    this.Serializable$set('x', value);
  }

  get y(): number|null {
    return (
        (this.Serializable$has('y')) ? (this.Serializable$get('y')) : (null));
  }

  /**
   * The y coordinate value.
   */
  set y(value: number|null) {
    this.Serializable$set('y', value);
  }

  getConstructor(): SerializableCtor<GridPoint> {
    return GridPoint;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['x', 'y']};
  }
}

export interface HttpBodyParameters {
  contentType?: string|null;
  data?: string|null;
  extensions?: Array<ApiClientObjectMap<any>>|null;
}
export class HttpBody extends Serializable {
  constructor(parameters: HttpBodyParameters = {}) {
    super();
    this.Serializable$set(
        'contentType',
        (parameters.contentType == null) ? (null) : (parameters.contentType));
    this.Serializable$set(
        'data', (parameters.data == null) ? (null) : (parameters.data));
    this.Serializable$set(
        'extensions',
        (parameters.extensions == null) ? (null) : (parameters.extensions));
  }

  get contentType(): string|null {
    return (
        (this.Serializable$has('contentType')) ?
            (this.Serializable$get('contentType')) :
            (null));
  }

  /**
   * The HTTP Content-Type header value specifying the content type of the body.
   */
  set contentType(value: string|null) {
    this.Serializable$set('contentType', value);
  }

  get data(): string|null {
    return (
        (this.Serializable$has('data')) ? (this.Serializable$get('data')) :
                                          (null));
  }

  /**
   * The HTTP request/response body as raw binary.
   */
  set data(value: string|null) {
    this.Serializable$set('data', value);
  }

  get extensions(): Array<ApiClientObjectMap<any>>|null {
    return (
        (this.Serializable$has('extensions')) ?
            (this.Serializable$get('extensions')) :
            (null));
  }

  /**
   * Application specific response metadata. Must be set in the first response
   * for streaming APIs.
   */
  set extensions(value: Array<ApiClientObjectMap<any>>|null) {
    this.Serializable$set('extensions', value);
  }

  getConstructor(): SerializableCtor<HttpBody> {
    return HttpBody;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['contentType', 'data', 'extensions'],
      objectMaps: {
        'extensions': {
          ctor: null,
          isPropertyArray: true,
          isSerializable: false,
          isValueArray: false
        }
      }
    };
  }
}

export interface ImageParameters {
  name?: string|null;
  id?: string|null;
  updateTime?: string|null;
  title?: string|null;
  description?: string|null;
  properties?: ApiClientObjectMap<any>|null;
  startTime?: string|null;
  endTime?: string|null;
  geometry?: ApiClientObjectMap<any>|null;
  bands?: Array<ImageBand>|null;
  sizeBytes?: string|null;
}
export class Image extends Serializable {
  constructor(parameters: ImageParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'id', (parameters.id == null) ? (null) : (parameters.id));
    this.Serializable$set(
        'updateTime',
        (parameters.updateTime == null) ? (null) : (parameters.updateTime));
    this.Serializable$set(
        'title', (parameters.title == null) ? (null) : (parameters.title));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'properties',
        (parameters.properties == null) ? (null) : (parameters.properties));
    this.Serializable$set(
        'startTime',
        (parameters.startTime == null) ? (null) : (parameters.startTime));
    this.Serializable$set(
        'endTime',
        (parameters.endTime == null) ? (null) : (parameters.endTime));
    this.Serializable$set(
        'geometry',
        (parameters.geometry == null) ? (null) : (parameters.geometry));
    this.Serializable$set(
        'bands', (parameters.bands == null) ? (null) : (parameters.bands));
    this.Serializable$set(
        'sizeBytes',
        (parameters.sizeBytes == null) ? (null) : (parameters.sizeBytes));
  }

  get bands(): Array<ImageBand>|null {
    return (
        (this.Serializable$has('bands')) ? (this.Serializable$get('bands')) :
                                           (null));
  }

  /**
   * Information about the data bands of the image.
   */
  set bands(value: Array<ImageBand>|null) {
    this.Serializable$set('bands', value);
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * The description of the asset.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get endTime(): string|null {
    return (
        (this.Serializable$has('endTime')) ?
            (this.Serializable$get('endTime')) :
            (null));
  }

  /**
   * For assets that correspond to an interval of time, such as average values
   * over a month or year, this timestamp corresponds to the end of that
   * interval (exclusive).
   */
  set endTime(value: string|null) {
    this.Serializable$set('endTime', value);
  }

  get geometry(): ApiClientObjectMap<any>|null {
    return (
        (this.Serializable$has('geometry')) ?
            (this.Serializable$get('geometry')) :
            (null));
  }

  /**
   * The spatial footprint associated with the image, if any, as a GeoJSON
   * geometry object (see RFC 7946).
   */
  set geometry(value: ApiClientObjectMap<any>|null) {
    this.Serializable$set('geometry', value);
  }

  get id(): string|null {
    return (
        (this.Serializable$has('id')) ? (this.Serializable$get('id')) : (null));
  }

  /**
   * The ID of the image, if present. Equivalent to `name` without the
   * \"projects/* /assets/\" prefix (e.g. \"users/<USER>/<ASSET>\").
   * This should typically be present for stored images, but will be the empty
   * string for computed ones.
   */
  set id(value: string|null) {
    this.Serializable$set('id', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The name of the image, if present. `name` is of the format
   * \"projects/* /assets/**\"
   * (e.g. \"projects/earthengine-legacy/assets/users/<USER>/<ASSET>\").
   * This should typically be present for stored images, but will be the empty
   * string for computed ones.
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get properties(): ApiClientObjectMap<any>|null {
    return (
        (this.Serializable$has('properties')) ?
            (this.Serializable$get('properties')) :
            (null));
  }

  /**
   * Key/value properties associated with the image.
   */
  set properties(value: ApiClientObjectMap<any>|null) {
    this.Serializable$set('properties', value);
  }

  get sizeBytes(): string|null {
    return (
        (this.Serializable$has('sizeBytes')) ?
            (this.Serializable$get('sizeBytes')) :
            (null));
  }

  /**
   * The size of a leaf asset (e.g. an image) in bytes.
   * This should typically be non-zero for stored images, and zero for computed
   * ones.
   */
  set sizeBytes(value: string|null) {
    this.Serializable$set('sizeBytes', value);
  }

  get startTime(): string|null {
    return (
        (this.Serializable$has('startTime')) ?
            (this.Serializable$get('startTime')) :
            (null));
  }

  /**
   * The timestamp associated with the image, if any, e.g. the time at which a
   * satellite image was taken. For assets that correspond to an interval of
   * time, such as average values over a month or year, this timestamp
   * corresponds to the start of that interval.
   */
  set startTime(value: string|null) {
    this.Serializable$set('startTime', value);
  }

  get title(): string|null {
    return (
        (this.Serializable$has('title')) ? (this.Serializable$get('title')) :
                                           (null));
  }

  /**
   * The title of the asset.
   */
  set title(value: string|null) {
    this.Serializable$set('title', value);
  }

  get updateTime(): string|null {
    return (
        (this.Serializable$has('updateTime')) ?
            (this.Serializable$get('updateTime')) :
            (null));
  }

  /**
   * The last-modified time of the image.
   */
  set updateTime(value: string|null) {
    this.Serializable$set('updateTime', value);
  }

  getConstructor(): SerializableCtor<Image> {
    return Image;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'bands': ImageBand},
      keys: [
        'bands', 'description', 'endTime', 'geometry', 'id', 'name',
        'properties', 'sizeBytes', 'startTime', 'title', 'updateTime'
      ],
      objectMaps: {
        'geometry': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        },
        'properties': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        }
      }
    };
  }
}

export interface ImageAssetExportOptionsParameters {
  earthEngineDestination?: EarthEngineDestination|null;
  pyramidingPolicy?: ImageAssetExportOptionsPyramidingPolicy|null;
  pyramidingPolicyOverrides?:
      ApiClientObjectMap<ImageAssetExportOptionsPyramidingPolicyOverrides>|null;
  tileSize?: number|null;
}
export class ImageAssetExportOptions extends Serializable {
  constructor(parameters: ImageAssetExportOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'earthEngineDestination',
        (parameters.earthEngineDestination == null) ?
            (null) :
            (parameters.earthEngineDestination));
    this.Serializable$set(
        'pyramidingPolicy',
        (parameters.pyramidingPolicy == null) ? (null) :
                                                (parameters.pyramidingPolicy));
    this.Serializable$set(
        'pyramidingPolicyOverrides',
        (parameters.pyramidingPolicyOverrides == null) ?
            (null) :
            (parameters.pyramidingPolicyOverrides));
    this.Serializable$set(
        'tileSize',
        (parameters.tileSize == null) ? (null) : (parameters.tileSize));
  }

  static get PyramidingPolicy(): IImageAssetExportOptionsPyramidingPolicyEnum {
    return ImageAssetExportOptionsPyramidingPolicyEnum;
  }

  static get PyramidingPolicyOverrides():
      IImageAssetExportOptionsPyramidingPolicyOverridesEnum {
    return ImageAssetExportOptionsPyramidingPolicyOverridesEnum;
  }

  get earthEngineDestination(): EarthEngineDestination|null {
    return (
        (this.Serializable$has('earthEngineDestination')) ?
            (this.Serializable$get('earthEngineDestination')) :
            (null));
  }

  /**
   * If specified, configures export to Earth Engine.
   */
  set earthEngineDestination(value: EarthEngineDestination|null) {
    this.Serializable$set('earthEngineDestination', value);
  }

  get pyramidingPolicy(): ImageAssetExportOptionsPyramidingPolicy|null {
    return (
        (this.Serializable$has('pyramidingPolicy')) ?
            (this.Serializable$get('pyramidingPolicy')) :
            (null));
  }

  /**
   * The pyramiding policy to apply by default to all bands.
   */
  set pyramidingPolicy(value: ImageAssetExportOptionsPyramidingPolicy|null) {
    this.Serializable$set('pyramidingPolicy', value);
  }

  get pyramidingPolicyOverrides():
      ApiClientObjectMap<ImageAssetExportOptionsPyramidingPolicyOverrides>|
      null {
    return (
        (this.Serializable$has('pyramidingPolicyOverrides')) ?
            (this.Serializable$get('pyramidingPolicyOverrides')) :
            (null));
  }

  /**
   * Specific per-band pyramid policy overrides.
   */
  set pyramidingPolicyOverrides(
      value:
          ApiClientObjectMap<ImageAssetExportOptionsPyramidingPolicyOverrides>|
      null) {
    this.Serializable$set('pyramidingPolicyOverrides', value);
  }

  get tileSize(): number|null {
    return (
        (this.Serializable$has('tileSize')) ?
            (this.Serializable$get('tileSize')) :
            (null));
  }

  /**
   * Tile size in the generated raster files.  The default (256) is appropriate
   * for scalar bands, but may need to be reduced for assets with array-valued
   * pixels.  Note that a single value is used for all bands.
   */
  set tileSize(value: number|null) {
    this.Serializable$set('tileSize', value);
  }

  getConstructor(): SerializableCtor<ImageAssetExportOptions> {
    return ImageAssetExportOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {
        'pyramidingPolicy': ImageAssetExportOptionsPyramidingPolicyEnum,
        'pyramidingPolicyOverrides':
            ImageAssetExportOptionsPyramidingPolicyOverridesEnum
      },
      keys: [
        'earthEngineDestination', 'pyramidingPolicy',
        'pyramidingPolicyOverrides', 'tileSize'
      ],
      objectMaps: {
        'pyramidingPolicyOverrides': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        }
      },
      objects: {'earthEngineDestination': EarthEngineDestination}
    };
  }
}

export interface ImageBandParameters {
  id?: string|null;
  dataType?: PixelDataType|null;
  grid?: PixelGrid|null;
  pyramidingPolicy?: ImageBandPyramidingPolicy|null;
  tilesets?: Array<TilestoreTileset>|null;
  missingData?: MissingData|null;
}
export class ImageBand extends Serializable {
  constructor(parameters: ImageBandParameters = {}) {
    super();
    this.Serializable$set(
        'id', (parameters.id == null) ? (null) : (parameters.id));
    this.Serializable$set(
        'dataType',
        (parameters.dataType == null) ? (null) : (parameters.dataType));
    this.Serializable$set(
        'grid', (parameters.grid == null) ? (null) : (parameters.grid));
    this.Serializable$set(
        'pyramidingPolicy',
        (parameters.pyramidingPolicy == null) ? (null) :
                                                (parameters.pyramidingPolicy));
    this.Serializable$set(
        'tilesets',
        (parameters.tilesets == null) ? (null) : (parameters.tilesets));
    this.Serializable$set(
        'missingData',
        (parameters.missingData == null) ? (null) : (parameters.missingData));
  }

  static get PyramidingPolicy(): IImageBandPyramidingPolicyEnum {
    return ImageBandPyramidingPolicyEnum;
  }

  get dataType(): PixelDataType|null {
    return (
        (this.Serializable$has('dataType')) ?
            (this.Serializable$get('dataType')) :
            (null));
  }

  /**
   * The numeric type of the band.
   */
  set dataType(value: PixelDataType|null) {
    this.Serializable$set('dataType', value);
  }

  get grid(): PixelGrid|null {
    return (
        (this.Serializable$has('grid')) ? (this.Serializable$get('grid')) :
                                          (null));
  }

  /**
   * The pixel grid of the band.
   */
  set grid(value: PixelGrid|null) {
    this.Serializable$set('grid', value);
  }

  get id(): string|null {
    return (
        (this.Serializable$has('id')) ? (this.Serializable$get('id')) : (null));
  }

  /**
   * The ID of the band.
   */
  set id(value: string|null) {
    this.Serializable$set('id', value);
  }

  get missingData(): MissingData|null {
    return (
        (this.Serializable$has('missingData')) ?
            (this.Serializable$get('missingData')) :
            (null));
  }

  /**
   * The value(s) denoting missing data.
   */
  set missingData(value: MissingData|null) {
    this.Serializable$set('missingData', value);
  }

  get pyramidingPolicy(): ImageBandPyramidingPolicy|null {
    return (
        (this.Serializable$has('pyramidingPolicy')) ?
            (this.Serializable$get('pyramidingPolicy')) :
            (null));
  }

  /**
   * The pyramiding policy of the band.
   */
  set pyramidingPolicy(value: ImageBandPyramidingPolicy|null) {
    this.Serializable$set('pyramidingPolicy', value);
  }

  get tilesets(): Array<TilestoreTileset>|null {
    return (
        (this.Serializable$has('tilesets')) ?
            (this.Serializable$get('tilesets')) :
            (null));
  }

  /**
   * There is one TilestoreTileset per each zoom level.
   */
  set tilesets(value: Array<TilestoreTileset>|null) {
    this.Serializable$set('tilesets', value);
  }

  getConstructor(): SerializableCtor<ImageBand> {
    return ImageBand;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'tilesets': TilestoreTileset},
      enums: {'pyramidingPolicy': ImageBandPyramidingPolicyEnum},
      keys: [
        'dataType', 'grid', 'id', 'missingData', 'pyramidingPolicy', 'tilesets'
      ],
      objects: {
        'dataType': PixelDataType,
        'grid': PixelGrid,
        'missingData': MissingData
      }
    };
  }
}

export interface ImageFileExportOptionsParameters {
  fileFormat?: ImageFileExportOptionsFileFormat|null;
  driveDestination?: DriveDestination|null;
  gcsDestination?: GcsDestination|null;
  geoTiffOptions?: GeoTiffImageExportOptions|null;
  tfRecordOptions?: TfRecordImageExportOptions|null;
}
export class ImageFileExportOptions extends Serializable {
  constructor(parameters: ImageFileExportOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'driveDestination',
        (parameters.driveDestination == null) ? (null) :
                                                (parameters.driveDestination));
    this.Serializable$set(
        'gcsDestination',
        (parameters.gcsDestination == null) ? (null) :
                                              (parameters.gcsDestination));
    this.Serializable$set(
        'geoTiffOptions',
        (parameters.geoTiffOptions == null) ? (null) :
                                              (parameters.geoTiffOptions));
    this.Serializable$set(
        'tfRecordOptions',
        (parameters.tfRecordOptions == null) ? (null) :
                                               (parameters.tfRecordOptions));
  }

  static get FileFormat(): IImageFileExportOptionsFileFormatEnum {
    return ImageFileExportOptionsFileFormatEnum;
  }

  get driveDestination(): DriveDestination|null {
    return (
        (this.Serializable$has('driveDestination')) ?
            (this.Serializable$get('driveDestination')) :
            (null));
  }

  /**
   * If specified, configures export to Google Drive.
   */
  set driveDestination(value: DriveDestination|null) {
    this.Serializable$set('driveDestination', value);
  }

  get fileFormat(): ImageFileExportOptionsFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The file format in which to export the image(s).
   */
  set fileFormat(value: ImageFileExportOptionsFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get gcsDestination(): GcsDestination|null {
    return (
        (this.Serializable$has('gcsDestination')) ?
            (this.Serializable$get('gcsDestination')) :
            (null));
  }

  /**
   * If specified, configures export to Google Cloud Storage.
   */
  set gcsDestination(value: GcsDestination|null) {
    this.Serializable$set('gcsDestination', value);
  }

  get geoTiffOptions(): GeoTiffImageExportOptions|null {
    return (
        (this.Serializable$has('geoTiffOptions')) ?
            (this.Serializable$get('geoTiffOptions')) :
            (null));
  }

  /**
   * File-format-specific options for `GEO_TIFF` exports.
   */
  set geoTiffOptions(value: GeoTiffImageExportOptions|null) {
    this.Serializable$set('geoTiffOptions', value);
  }

  get tfRecordOptions(): TfRecordImageExportOptions|null {
    return (
        (this.Serializable$has('tfRecordOptions')) ?
            (this.Serializable$get('tfRecordOptions')) :
            (null));
  }

  /**
   * File-format-specific options for `TF_RECORD_IMAGE` exports.
   */
  set tfRecordOptions(value: TfRecordImageExportOptions|null) {
    this.Serializable$set('tfRecordOptions', value);
  }

  getConstructor(): SerializableCtor<ImageFileExportOptions> {
    return ImageFileExportOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'fileFormat': ImageFileExportOptionsFileFormatEnum},
      keys: [
        'driveDestination', 'fileFormat', 'gcsDestination', 'geoTiffOptions',
        'tfRecordOptions'
      ],
      objects: {
        'driveDestination': DriveDestination,
        'gcsDestination': GcsDestination,
        'geoTiffOptions': GeoTiffImageExportOptions,
        'tfRecordOptions': TfRecordImageExportOptions
      }
    };
  }
}

export interface ImageManifestParameters {
  name?: string|null;
  properties?: ApiClientObjectMap<any>|null;
  uriPrefix?: string|null;
  tilesets?: Array<Tileset>|null;
  bands?: Array<TilesetBand>|null;
  maskBands?: Array<TilesetMaskBand>|null;
  footprint?: PixelFootprint|null;
  missingData?: MissingData|null;
  pyramidingPolicy?: ImageManifestPyramidingPolicy|null;
  startTime?: string|null;
  endTime?: string|null;
}
export class ImageManifest extends Serializable {
  constructor(parameters: ImageManifestParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'properties',
        (parameters.properties == null) ? (null) : (parameters.properties));
    this.Serializable$set(
        'uriPrefix',
        (parameters.uriPrefix == null) ? (null) : (parameters.uriPrefix));
    this.Serializable$set(
        'tilesets',
        (parameters.tilesets == null) ? (null) : (parameters.tilesets));
    this.Serializable$set(
        'bands', (parameters.bands == null) ? (null) : (parameters.bands));
    this.Serializable$set(
        'maskBands',
        (parameters.maskBands == null) ? (null) : (parameters.maskBands));
    this.Serializable$set(
        'footprint',
        (parameters.footprint == null) ? (null) : (parameters.footprint));
    this.Serializable$set(
        'missingData',
        (parameters.missingData == null) ? (null) : (parameters.missingData));
    this.Serializable$set(
        'pyramidingPolicy',
        (parameters.pyramidingPolicy == null) ? (null) :
                                                (parameters.pyramidingPolicy));
    this.Serializable$set(
        'startTime',
        (parameters.startTime == null) ? (null) : (parameters.startTime));
    this.Serializable$set(
        'endTime',
        (parameters.endTime == null) ? (null) : (parameters.endTime));
  }

  static get PyramidingPolicy(): IImageManifestPyramidingPolicyEnum {
    return ImageManifestPyramidingPolicyEnum;
  }

  get bands(): Array<TilesetBand>|null {
    return (
        (this.Serializable$has('bands')) ? (this.Serializable$get('bands')) :
                                           (null));
  }

  /**
   * The bands. The band order of the asset is the same as the order of `bands`.
   */
  set bands(value: Array<TilesetBand>|null) {
    this.Serializable$set('bands', value);
  }

  get endTime(): string|null {
    return (
        (this.Serializable$has('endTime')) ?
            (this.Serializable$get('endTime')) :
            (null));
  }

  /**
   * For assets that correspond to an interval of time, such as average values
   * over a month or year, this timestamp corresponds to the end of that
   * interval (exclusive).
   */
  set endTime(value: string|null) {
    this.Serializable$set('endTime', value);
  }

  get footprint(): PixelFootprint|null {
    return (
        (this.Serializable$has('footprint')) ?
            (this.Serializable$get('footprint')) :
            (null));
  }

  /**
   * The footprint in pixel coordinates (not in lat/lng coordinates).
   * If empty, the footprint is by default the entire image.
   * See `PixelGrid` for a more detailed description of pixel coordinates.
   */
  set footprint(value: PixelFootprint|null) {
    this.Serializable$set('footprint', value);
  }

  get maskBands(): Array<TilesetMaskBand>|null {
    return (
        (this.Serializable$has('maskBands')) ?
            (this.Serializable$get('maskBands')) :
            (null));
  }

  /**
   * The mask bands.
   */
  set maskBands(value: Array<TilesetMaskBand>|null) {
    this.Serializable$set('maskBands', value);
  }

  get missingData(): MissingData|null {
    return (
        (this.Serializable$has('missingData')) ?
            (this.Serializable$get('missingData')) :
            (null));
  }

  /**
   * The values which represent no data in all bands of the image. Applies to
   * all bands which do not specify their own `missing_data`.
   */
  set missingData(value: MissingData|null) {
    this.Serializable$set('missingData', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The name of the asset to be created.
   * `name` is of the format \"projects/* /assets/**\"
   * (e.g. \"projects/earthengine-legacy/assets/users/<USER>/<ASSET>\").
   * All user-owned assets are under the project \"earthengine-legacy\"
   * (e.g. \"projects/earthengine-legacy/assets/users/foo/bar\").
   * All other assets are under the project \"earthengine-public\"
   * (e.g. \"projects/earthengine-public/assets/LANDSAT\").
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get properties(): ApiClientObjectMap<any>|null {
    return (
        (this.Serializable$has('properties')) ?
            (this.Serializable$get('properties')) :
            (null));
  }

  /**
   * Additional properties of the asset. The property names
   * \"system:time_start\" and \"system:time_end\" are deprecated. Use the
   * fields `start_time` and `end_time` instead.
   */
  set properties(value: ApiClientObjectMap<any>|null) {
    this.Serializable$set('properties', value);
  }

  get pyramidingPolicy(): ImageManifestPyramidingPolicy|null {
    return (
        (this.Serializable$has('pyramidingPolicy')) ?
            (this.Serializable$get('pyramidingPolicy')) :
            (null));
  }

  /**
   * The pyramiding policy. If unspecified, the policy MEAN is applied by
   * default. Applies to all bands which do not specify their own
   * `pyramiding_policy`.
   */
  set pyramidingPolicy(value: ImageManifestPyramidingPolicy|null) {
    this.Serializable$set('pyramidingPolicy', value);
  }

  get startTime(): string|null {
    return (
        (this.Serializable$has('startTime')) ?
            (this.Serializable$get('startTime')) :
            (null));
  }

  /**
   * The timestamp associated with the asset, if any, e.g. the time at which a
   * satellite image was taken. For assets that correspond to an interval of
   * time, such as average values over a month or year, this timestamp
   * corresponds to the start of that interval.
   */
  set startTime(value: string|null) {
    this.Serializable$set('startTime', value);
  }

  get tilesets(): Array<Tileset>|null {
    return (
        (this.Serializable$has('tilesets')) ?
            (this.Serializable$get('tilesets')) :
            (null));
  }

  /**
   * The tilesets. Each tileset must have a unique ID.
   */
  set tilesets(value: Array<Tileset>|null) {
    this.Serializable$set('tilesets', value);
  }

  get uriPrefix(): string|null {
    return (
        (this.Serializable$has('uriPrefix')) ?
            (this.Serializable$get('uriPrefix')) :
            (null));
  }

  /**
   * The optional prefix prepended to all `uri`s defined in this
   * manifest.
   */
  set uriPrefix(value: string|null) {
    this.Serializable$set('uriPrefix', value);
  }

  getConstructor(): SerializableCtor<ImageManifest> {
    return ImageManifest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {
        'bands': TilesetBand,
        'maskBands': TilesetMaskBand,
        'tilesets': Tileset
      },
      enums: {'pyramidingPolicy': ImageManifestPyramidingPolicyEnum},
      keys: [
        'bands', 'endTime', 'footprint', 'maskBands', 'missingData', 'name',
        'properties', 'pyramidingPolicy', 'startTime', 'tilesets', 'uriPrefix'
      ],
      objectMaps: {
        'properties': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        }
      },
      objects: {'footprint': PixelFootprint, 'missingData': MissingData}
    };
  }
}

export interface ImageSourceParameters {
  uris?: Array<string>|null;
  affineTransform?: AffineTransform|null;
}
export class ImageSource extends Serializable {
  constructor(parameters: ImageSourceParameters = {}) {
    super();
    this.Serializable$set(
        'uris', (parameters.uris == null) ? (null) : (parameters.uris));
    this.Serializable$set(
        'affineTransform',
        (parameters.affineTransform == null) ? (null) :
                                               (parameters.affineTransform));
  }

  get affineTransform(): AffineTransform|null {
    return (
        (this.Serializable$has('affineTransform')) ?
            (this.Serializable$get('affineTransform')) :
            (null));
  }

  /**
   * An optional affine transform. Should only be specified if the data from
   * `uris` (including any sidecars) isn't sufficient to place the pixels.
   */
  set affineTransform(value: AffineTransform|null) {
    this.Serializable$set('affineTransform', value);
  }

  get uris(): Array<string>|null {
    return (
        (this.Serializable$has('uris')) ? (this.Serializable$get('uris')) :
                                          (null));
  }

  /**
   * The URIs of the data to import. Currently, only Google Cloud Storage URIs
   * are supported. Each URI must be specified in the following format:
   * \"gs://bucket-id/object-id\".
   * The primary object should be the first element of the list, and sidecars
   * listed afterwards. Each URI is prefixed with
   * `ImageManifest.uri_prefix` if set.
   */
  set uris(value: Array<string>|null) {
    this.Serializable$set('uris', value);
  }

  getConstructor(): SerializableCtor<ImageSource> {
    return ImageSource;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['affineTransform', 'uris'],
      objects: {'affineTransform': AffineTransform}
    };
  }
}

export interface ImportImageRequestParameters {
  imageManifest?: ImageManifest|null;
  description?: string|null;
  overwrite?: boolean|null;
  requestId?: string|null;
}
export class ImportImageRequest extends Serializable {
  constructor(parameters: ImportImageRequestParameters = {}) {
    super();
    this.Serializable$set(
        'imageManifest',
        (parameters.imageManifest == null) ? (null) :
                                             (parameters.imageManifest));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'overwrite',
        (parameters.overwrite == null) ? (null) : (parameters.overwrite));
    this.Serializable$set(
        'requestId',
        (parameters.requestId == null) ? (null) : (parameters.requestId));
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * An optional human-readable name of the task.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get imageManifest(): ImageManifest|null {
    return (
        (this.Serializable$has('imageManifest')) ?
            (this.Serializable$get('imageManifest')) :
            (null));
  }

  /**
   * The image manifest.
   */
  set imageManifest(value: ImageManifest|null) {
    this.Serializable$set('imageManifest', value);
  }

  get overwrite(): boolean|null {
    return (
        (this.Serializable$has('overwrite')) ?
            (this.Serializable$get('overwrite')) :
            (null));
  }

  /**
   * An optional flag to allow overwriting an existing asset.
   */
  set overwrite(value: boolean|null) {
    this.Serializable$set('overwrite', value);
  }

  get requestId(): string|null {
    return (
        (this.Serializable$has('requestId')) ?
            (this.Serializable$get('requestId')) :
            (null));
  }

  /**
   * A unique string used to detect duplicated requests. If more than one
   * request is made by the same user with the same non-empty `request_id`,
   * only one of those requests may successfully start a long-running operation.
   * `request_id` may contain the characters a..z, A..Z, 0-9, or '-'.
   * `request_id` may be at most 60 characters long.
   */
  set requestId(value: string|null) {
    this.Serializable$set('requestId', value);
  }

  getConstructor(): SerializableCtor<ImportImageRequest> {
    return ImportImageRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['description', 'imageManifest', 'overwrite', 'requestId'],
      objects: {'imageManifest': ImageManifest}
    };
  }
}

export interface ImportTableRequestParameters {
  tableManifest?: TableManifest|null;
  description?: string|null;
  overwrite?: boolean|null;
  requestId?: string|null;
}
export class ImportTableRequest extends Serializable {
  constructor(parameters: ImportTableRequestParameters = {}) {
    super();
    this.Serializable$set(
        'tableManifest',
        (parameters.tableManifest == null) ? (null) :
                                             (parameters.tableManifest));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'overwrite',
        (parameters.overwrite == null) ? (null) : (parameters.overwrite));
    this.Serializable$set(
        'requestId',
        (parameters.requestId == null) ? (null) : (parameters.requestId));
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * An optional human-readable name of the task.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get overwrite(): boolean|null {
    return (
        (this.Serializable$has('overwrite')) ?
            (this.Serializable$get('overwrite')) :
            (null));
  }

  /**
   * An optional flag to allow overwriting an existing asset.
   */
  set overwrite(value: boolean|null) {
    this.Serializable$set('overwrite', value);
  }

  get requestId(): string|null {
    return (
        (this.Serializable$has('requestId')) ?
            (this.Serializable$get('requestId')) :
            (null));
  }

  /**
   * A unique string used to detect duplicated requests. If more than one
   * request is made by the same user with the same non-empty `request_id`,
   * only one of those requests may successfully start a long-running operation.
   * `request_id` may contain the characters a..z, A..Z, 0-9, or '-'.
   * `request_id` may be at most 60 characters long.
   */
  set requestId(value: string|null) {
    this.Serializable$set('requestId', value);
  }

  get tableManifest(): TableManifest|null {
    return (
        (this.Serializable$has('tableManifest')) ?
            (this.Serializable$get('tableManifest')) :
            (null));
  }

  /**
   * The table manifest.
   */
  set tableManifest(value: TableManifest|null) {
    this.Serializable$set('tableManifest', value);
  }

  getConstructor(): SerializableCtor<ImportTableRequest> {
    return ImportTableRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['description', 'overwrite', 'requestId', 'tableManifest'],
      objects: {'tableManifest': TableManifest}
    };
  }
}

export interface LinkAssetRequestParameters {
  destinationName?: string|null;
}
export class LinkAssetRequest extends Serializable {
  constructor(parameters: LinkAssetRequestParameters = {}) {
    super();
    this.Serializable$set(
        'destinationName',
        (parameters.destinationName == null) ? (null) :
                                               (parameters.destinationName));
  }

  get destinationName(): string|null {
    return (
        (this.Serializable$has('destinationName')) ?
            (this.Serializable$get('destinationName')) :
            (null));
  }

  /**
   * The destination name to which we are linking the asset.
   * `name` is of the format \"projects/* /assets\"
   * (e.g., \"projects/my-project/assets\").
   */
  set destinationName(value: string|null) {
    this.Serializable$set('destinationName', value);
  }

  getConstructor(): SerializableCtor<LinkAssetRequest> {
    return LinkAssetRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['destinationName']};
  }
}

export interface ListAlgorithmsResponseParameters {
  algorithms?: Array<Algorithm>|null;
}
export class ListAlgorithmsResponse extends Serializable {
  constructor(parameters: ListAlgorithmsResponseParameters = {}) {
    super();
    this.Serializable$set(
        'algorithms',
        (parameters.algorithms == null) ? (null) : (parameters.algorithms));
  }

  get algorithms(): Array<Algorithm>|null {
    return (
        (this.Serializable$has('algorithms')) ?
            (this.Serializable$get('algorithms')) :
            (null));
  }

  /**
   * A list of the available algorithms.
   */
  set algorithms(value: Array<Algorithm>|null) {
    this.Serializable$set('algorithms', value);
  }

  getConstructor(): SerializableCtor<ListAlgorithmsResponse> {
    return ListAlgorithmsResponse;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {arrays: {'algorithms': Algorithm}, keys: ['algorithms']};
  }
}

export interface ListAssetsResponseParameters {
  assets?: Array<EarthEngineAsset>|null;
  nextPageToken?: string|null;
}
export class ListAssetsResponse extends Serializable {
  constructor(parameters: ListAssetsResponseParameters = {}) {
    super();
    this.Serializable$set(
        'assets', (parameters.assets == null) ? (null) : (parameters.assets));
    this.Serializable$set(
        'nextPageToken',
        (parameters.nextPageToken == null) ? (null) :
                                             (parameters.nextPageToken));
  }

  get assets(): Array<EarthEngineAsset>|null {
    return (
        (this.Serializable$has('assets')) ? (this.Serializable$get('assets')) :
                                            (null));
  }

  /**
   * The list of assets. Only the `id`, `name`, and `type` fields of each asset
   * will be populated.
   */
  set assets(value: Array<EarthEngineAsset>|null) {
    this.Serializable$set('assets', value);
  }

  get nextPageToken(): string|null {
    return (
        (this.Serializable$has('nextPageToken')) ?
            (this.Serializable$get('nextPageToken')) :
            (null));
  }

  /**
   * A token to retrieve the next page of results. Pass this value in the
   * ListAssetsRequest.page_token
   * field in the subsequent call to the `ListAssets` method to
   * retrieve the next page of results.
   */
  set nextPageToken(value: string|null) {
    this.Serializable$set('nextPageToken', value);
  }

  getConstructor(): SerializableCtor<ListAssetsResponse> {
    return ListAssetsResponse;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'assets': EarthEngineAsset},
      keys: ['assets', 'nextPageToken']
    };
  }
}

export interface ListFeaturesResponseParameters {
  type?: string|null;
  features?: Array<Feature>|null;
  nextPageToken?: string|null;
}
export class ListFeaturesResponse extends Serializable {
  constructor(parameters: ListFeaturesResponseParameters = {}) {
    super();
    this.Serializable$set(
        'type', (parameters.type == null) ? (null) : (parameters.type));
    this.Serializable$set(
        'features',
        (parameters.features == null) ? (null) : (parameters.features));
    this.Serializable$set(
        'nextPageToken',
        (parameters.nextPageToken == null) ? (null) :
                                             (parameters.nextPageToken));
  }

  get features(): Array<Feature>|null {
    return (
        (this.Serializable$has('features')) ?
            (this.Serializable$get('features')) :
            (null));
  }

  /**
   * The list of features matching the query, as a list of GeoJSON
   * feature objects (see RFC 7946) containing the string \"Feature\" in
   * a field named \"type\", the geometry in a field named \"geometry\",
   * and key/value properties in a field named \"properties\".
   */
  set features(value: Array<Feature>|null) {
    this.Serializable$set('features', value);
  }

  get nextPageToken(): string|null {
    return (
        (this.Serializable$has('nextPageToken')) ?
            (this.Serializable$get('nextPageToken')) :
            (null));
  }

  /**
   * A token to retrieve the next page of results. Pass this value in the
   * ListFeaturesRequest.page_token
   * field in the subsequent call to the `ListFeatures` method
   * to retrieve the next page of results.
   */
  set nextPageToken(value: string|null) {
    this.Serializable$set('nextPageToken', value);
  }

  get type(): string|null {
    return (
        (this.Serializable$has('type')) ? (this.Serializable$get('type')) :
                                          (null));
  }

  /**
   * Always contains the constant string \"FeatureCollection\", marking
   * this as a GeoJSON FeatureCollection object.
   */
  set type(value: string|null) {
    this.Serializable$set('type', value);
  }

  getConstructor(): SerializableCtor<ListFeaturesResponse> {
    return ListFeaturesResponse;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'features': Feature},
      keys: ['features', 'nextPageToken', 'type']
    };
  }
}

export interface ListImagesResponseParameters {
  images?: Array<Image>|null;
  nextPageToken?: string|null;
}
export class ListImagesResponse extends Serializable {
  constructor(parameters: ListImagesResponseParameters = {}) {
    super();
    this.Serializable$set(
        'images', (parameters.images == null) ? (null) : (parameters.images));
    this.Serializable$set(
        'nextPageToken',
        (parameters.nextPageToken == null) ? (null) :
                                             (parameters.nextPageToken));
  }

  get images(): Array<Image>|null {
    return (
        (this.Serializable$has('images')) ? (this.Serializable$get('images')) :
                                            (null));
  }

  /**
   * The list of images matching the query.
   */
  set images(value: Array<Image>|null) {
    this.Serializable$set('images', value);
  }

  get nextPageToken(): string|null {
    return (
        (this.Serializable$has('nextPageToken')) ?
            (this.Serializable$get('nextPageToken')) :
            (null));
  }

  /**
   * A token to retrieve the next page of results. Pass this value in the
   * ListImagesRequest.page_token
   * field in the subsequent call to the `ListImages` method to retrieve the
   * next page of results.
   */
  set nextPageToken(value: string|null) {
    this.Serializable$set('nextPageToken', value);
  }

  getConstructor(): SerializableCtor<ListImagesResponse> {
    return ListImagesResponse;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {arrays: {'images': Image}, keys: ['images', 'nextPageToken']};
  }
}

export interface ListOperationsResponseParameters {
  operations?: Array<Operation>|null;
  nextPageToken?: string|null;
}
export class ListOperationsResponse extends Serializable {
  constructor(parameters: ListOperationsResponseParameters = {}) {
    super();
    this.Serializable$set(
        'operations',
        (parameters.operations == null) ? (null) : (parameters.operations));
    this.Serializable$set(
        'nextPageToken',
        (parameters.nextPageToken == null) ? (null) :
                                             (parameters.nextPageToken));
  }

  get nextPageToken(): string|null {
    return (
        (this.Serializable$has('nextPageToken')) ?
            (this.Serializable$get('nextPageToken')) :
            (null));
  }

  /**
   * The standard List next-page token.
   */
  set nextPageToken(value: string|null) {
    this.Serializable$set('nextPageToken', value);
  }

  get operations(): Array<Operation>|null {
    return (
        (this.Serializable$has('operations')) ?
            (this.Serializable$get('operations')) :
            (null));
  }

  /**
   * A list of operations that matches the specified filter in the request.
   */
  set operations(value: Array<Operation>|null) {
    this.Serializable$set('operations', value);
  }

  getConstructor(): SerializableCtor<ListOperationsResponse> {
    return ListOperationsResponse;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'operations': Operation},
      keys: ['nextPageToken', 'operations']
    };
  }
}

export interface LogConfigParameters {
  counter?: CounterOptions|null;
  dataAccess?: DataAccessOptions|null;
  cloudAudit?: CloudAuditOptions|null;
}
export class LogConfig extends Serializable {
  constructor(parameters: LogConfigParameters = {}) {
    super();
    this.Serializable$set(
        'counter',
        (parameters.counter == null) ? (null) : (parameters.counter));
    this.Serializable$set(
        'dataAccess',
        (parameters.dataAccess == null) ? (null) : (parameters.dataAccess));
    this.Serializable$set(
        'cloudAudit',
        (parameters.cloudAudit == null) ? (null) : (parameters.cloudAudit));
  }

  get cloudAudit(): CloudAuditOptions|null {
    return (
        (this.Serializable$has('cloudAudit')) ?
            (this.Serializable$get('cloudAudit')) :
            (null));
  }

  /**
   * Cloud audit options.
   */
  set cloudAudit(value: CloudAuditOptions|null) {
    this.Serializable$set('cloudAudit', value);
  }

  get counter(): CounterOptions|null {
    return (
        (this.Serializable$has('counter')) ?
            (this.Serializable$get('counter')) :
            (null));
  }

  /**
   * Counter options.
   */
  set counter(value: CounterOptions|null) {
    this.Serializable$set('counter', value);
  }

  get dataAccess(): DataAccessOptions|null {
    return (
        (this.Serializable$has('dataAccess')) ?
            (this.Serializable$get('dataAccess')) :
            (null));
  }

  /**
   * Data access options.
   */
  set dataAccess(value: DataAccessOptions|null) {
    this.Serializable$set('dataAccess', value);
  }

  getConstructor(): SerializableCtor<LogConfig> {
    return LogConfig;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['cloudAudit', 'counter', 'dataAccess'],
      objects: {
        'cloudAudit': CloudAuditOptions,
        'counter': CounterOptions,
        'dataAccess': DataAccessOptions
      }
    };
  }
}

export interface MissingDataParameters {
  values?: Array<number>|null;
}
export class MissingData extends Serializable {
  constructor(parameters: MissingDataParameters = {}) {
    super();
    this.Serializable$set(
        'values', (parameters.values == null) ? (null) : (parameters.values));
  }

  get values(): Array<number>|null {
    return (
        (this.Serializable$has('values')) ? (this.Serializable$get('values')) :
                                            (null));
  }

  /**
   * Values which represent no data.
   */
  set values(value: Array<number>|null) {
    this.Serializable$set('values', value);
  }

  getConstructor(): SerializableCtor<MissingData> {
    return MissingData;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['values']};
  }
}

export interface MoveAssetRequestParameters {
  destinationName?: string|null;
}
export class MoveAssetRequest extends Serializable {
  constructor(parameters: MoveAssetRequestParameters = {}) {
    super();
    this.Serializable$set(
        'destinationName',
        (parameters.destinationName == null) ? (null) :
                                               (parameters.destinationName));
  }

  get destinationName(): string|null {
    return (
        (this.Serializable$has('destinationName')) ?
            (this.Serializable$get('destinationName')) :
            (null));
  }

  /**
   * The destination name to which to move the asset.
   * `name` is of the format \"projects/* /assets/**\"
   * (e.g., \"projects/earthengine-legacy/assets/users/[USER]/[ASSET]\").
   * All user-owned assets are under the project \"earthengine-legacy\"
   * (e.g., \"projects/earthengine-legacy/assets/users/foo/bar\").
   * All other assets are under the project \"earthengine-public\"
   * (e.g., \"projects/earthengine-public/assets/LANDSAT\").
   */
  set destinationName(value: string|null) {
    this.Serializable$set('destinationName', value);
  }

  getConstructor(): SerializableCtor<MoveAssetRequest> {
    return MoveAssetRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['destinationName']};
  }
}

export interface OperationParameters {
  name?: string|null;
  metadata?: ApiClientObjectMap<any>|null;
  done?: boolean|null;
  error?: Status|null;
  response?: ApiClientObjectMap<any>|null;
}
export class Operation extends Serializable {
  constructor(parameters: OperationParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'metadata',
        (parameters.metadata == null) ? (null) : (parameters.metadata));
    this.Serializable$set(
        'done', (parameters.done == null) ? (null) : (parameters.done));
    this.Serializable$set(
        'error', (parameters.error == null) ? (null) : (parameters.error));
    this.Serializable$set(
        'response',
        (parameters.response == null) ? (null) : (parameters.response));
  }

  get done(): boolean|null {
    return (
        (this.Serializable$has('done')) ? (this.Serializable$get('done')) :
                                          (null));
  }

  /**
   * If the value is `false`, it means the operation is still in progress.
   * If `true`, the operation is completed, and either `error` or `response` is
   * available.
   */
  set done(value: boolean|null) {
    this.Serializable$set('done', value);
  }

  get error(): Status|null {
    return (
        (this.Serializable$has('error')) ? (this.Serializable$get('error')) :
                                           (null));
  }

  /**
   * The error result of the operation in case of failure or cancellation.
   */
  set error(value: Status|null) {
    this.Serializable$set('error', value);
  }

  get metadata(): ApiClientObjectMap<any>|null {
    return (
        (this.Serializable$has('metadata')) ?
            (this.Serializable$get('metadata')) :
            (null));
  }

  /**
   * Service-specific metadata associated with the operation.  It typically
   * contains progress information and common metadata such as create time.
   * Some services might not provide such metadata.  Any method that returns a
   * long-running operation should document the metadata type, if any.
   */
  set metadata(value: ApiClientObjectMap<any>|null) {
    this.Serializable$set('metadata', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The server-assigned name, which is only unique within the same service that
   * originally returns it. If you use the default HTTP mapping, the
   * `name` should be a resource name ending with `operations/{unique_id}`.
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get response(): ApiClientObjectMap<any>|null {
    return (
        (this.Serializable$has('response')) ?
            (this.Serializable$get('response')) :
            (null));
  }

  /**
   * The normal response of the operation in case of success.  If the original
   * method returns no data on success, such as `Delete`, the response is
   * `google.protobuf.Empty`.  If the original method is standard
   * `Get`/`Create`/`Update`, the response should be the resource.  For other
   * methods, the response should have the type `XxxResponse`, where `Xxx`
   * is the original method name.  For example, if the original method name
   * is `TakeSnapshot()`, the inferred response type is
   * `TakeSnapshotResponse`.
   */
  set response(value: ApiClientObjectMap<any>|null) {
    this.Serializable$set('response', value);
  }

  getConstructor(): SerializableCtor<Operation> {
    return Operation;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['done', 'error', 'metadata', 'name', 'response'],
      objectMaps: {
        'metadata': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        },
        'response': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        }
      },
      objects: {'error': Status}
    };
  }
}

export interface OperationMetadataParameters {
  state?: OperationMetadataState|null;
  description?: string|null;
  type?: string|null;
  priority?: number|null;
  createTime?: string|null;
  updateTime?: string|null;
  startTime?: string|null;
  endTime?: string|null;
  scriptUri?: string|null;
  destinationUris?: Array<string>|null;
}
export class OperationMetadata extends Serializable {
  constructor(parameters: OperationMetadataParameters = {}) {
    super();
    this.Serializable$set(
        'state', (parameters.state == null) ? (null) : (parameters.state));
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'type', (parameters.type == null) ? (null) : (parameters.type));
    this.Serializable$set(
        'priority',
        (parameters.priority == null) ? (null) : (parameters.priority));
    this.Serializable$set(
        'createTime',
        (parameters.createTime == null) ? (null) : (parameters.createTime));
    this.Serializable$set(
        'updateTime',
        (parameters.updateTime == null) ? (null) : (parameters.updateTime));
    this.Serializable$set(
        'startTime',
        (parameters.startTime == null) ? (null) : (parameters.startTime));
    this.Serializable$set(
        'endTime',
        (parameters.endTime == null) ? (null) : (parameters.endTime));
    this.Serializable$set(
        'scriptUri',
        (parameters.scriptUri == null) ? (null) : (parameters.scriptUri));
    this.Serializable$set(
        'destinationUris',
        (parameters.destinationUris == null) ? (null) :
                                               (parameters.destinationUris));
  }

  static get State(): IOperationMetadataStateEnum {
    return OperationMetadataStateEnum;
  }

  get createTime(): string|null {
    return (
        (this.Serializable$has('createTime')) ?
            (this.Serializable$get('createTime')) :
            (null));
  }

  /**
   * Time the operation was created.
   */
  set createTime(value: string|null) {
    this.Serializable$set('createTime', value);
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * Description of the operation.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get destinationUris(): Array<string>|null {
    return (
        (this.Serializable$has('destinationUris')) ?
            (this.Serializable$get('destinationUris')) :
            (null));
  }

  /**
   * The URI(s) pointing to the resources output by this operation.
   */
  set destinationUris(value: Array<string>|null) {
    this.Serializable$set('destinationUris', value);
  }

  get endTime(): string|null {
    return (
        (this.Serializable$has('endTime')) ?
            (this.Serializable$get('endTime')) :
            (null));
  }

  /**
   * Time the operation ended, if the operation has ended.
   */
  set endTime(value: string|null) {
    this.Serializable$set('endTime', value);
  }

  get priority(): number|null {
    return (
        (this.Serializable$has('priority')) ?
            (this.Serializable$get('priority')) :
            (null));
  }

  /**
   * Priority of the operation. A higher value indicates a higher priority. The
   * default priority is 0.
   */
  set priority(value: number|null) {
    this.Serializable$set('priority', value);
  }

  get scriptUri(): string|null {
    return (
        (this.Serializable$has('scriptUri')) ?
            (this.Serializable$get('scriptUri')) :
            (null));
  }

  /**
   * The URI of the script from which this operation originated, if the
   * operation was started in the Code Editor.
   */
  set scriptUri(value: string|null) {
    this.Serializable$set('scriptUri', value);
  }

  get startTime(): string|null {
    return (
        (this.Serializable$has('startTime')) ?
            (this.Serializable$get('startTime')) :
            (null));
  }

  /**
   * Time the operation started, if the operation has started.
   */
  set startTime(value: string|null) {
    this.Serializable$set('startTime', value);
  }

  get state(): OperationMetadataState|null {
    return (
        (this.Serializable$has('state')) ? (this.Serializable$get('state')) :
                                           (null));
  }

  /**
   * State of the operation.
   */
  set state(value: OperationMetadataState|null) {
    this.Serializable$set('state', value);
  }

  get type(): string|null {
    return (
        (this.Serializable$has('type')) ? (this.Serializable$get('type')) :
                                          (null));
  }

  /**
   * The type of this task (e.g., EXPORT_IMAGE, EXPORT_FEATURES, etc.).
   */
  set type(value: string|null) {
    this.Serializable$set('type', value);
  }

  get updateTime(): string|null {
    return (
        (this.Serializable$has('updateTime')) ?
            (this.Serializable$get('updateTime')) :
            (null));
  }

  /**
   * Time the operation was last updated.
   */
  set updateTime(value: string|null) {
    this.Serializable$set('updateTime', value);
  }

  getConstructor(): SerializableCtor<OperationMetadata> {
    return OperationMetadata;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'state': OperationMetadataStateEnum},
      keys: [
        'createTime', 'description', 'destinationUris', 'endTime', 'priority',
        'scriptUri', 'startTime', 'state', 'type', 'updateTime'
      ]
    };
  }
}

export interface PixelDataTypeParameters {
  precision?: PixelDataTypePrecision|null;
  range?: DoubleRange|null;
  dimensionsCount?: number|null;
}
export class PixelDataType extends Serializable {
  constructor(parameters: PixelDataTypeParameters = {}) {
    super();
    this.Serializable$set(
        'precision',
        (parameters.precision == null) ? (null) : (parameters.precision));
    this.Serializable$set(
        'range', (parameters.range == null) ? (null) : (parameters.range));
    this.Serializable$set(
        'dimensionsCount',
        (parameters.dimensionsCount == null) ? (null) :
                                               (parameters.dimensionsCount));
  }

  static get Precision(): IPixelDataTypePrecisionEnum {
    return PixelDataTypePrecisionEnum;
  }

  get dimensionsCount(): number|null {
    return (
        (this.Serializable$has('dimensionsCount')) ?
            (this.Serializable$get('dimensionsCount')) :
            (null));
  }

  /**
   * The number of dimensions in an array-valued data type, or zero to indicate
   * an ordinary scalar type.
   */
  set dimensionsCount(value: number|null) {
    this.Serializable$set('dimensionsCount', value);
  }

  get precision(): PixelDataTypePrecision|null {
    return (
        (this.Serializable$has('precision')) ?
            (this.Serializable$get('precision')) :
            (null));
  }

  /**
   * The numeric precision of the type.
   */
  set precision(value: PixelDataTypePrecision|null) {
    this.Serializable$set('precision', value);
  }

  get range(): DoubleRange|null {
    return (
        (this.Serializable$has('range')) ? (this.Serializable$get('range')) :
                                           (null));
  }

  /**
   * The range of the numeric type, if any. Typically absent for floating-point
   * types.
   */
  set range(value: DoubleRange|null) {
    this.Serializable$set('range', value);
  }

  getConstructor(): SerializableCtor<PixelDataType> {
    return PixelDataType;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'precision': PixelDataTypePrecisionEnum},
      keys: ['dimensionsCount', 'precision', 'range'],
      objects: {'range': DoubleRange}
    };
  }
}

export interface PixelFootprintParameters {
  points?: Array<GridPoint>|null;
  bandId?: string|null;
}
export class PixelFootprint extends Serializable {
  constructor(parameters: PixelFootprintParameters = {}) {
    super();
    this.Serializable$set(
        'points', (parameters.points == null) ? (null) : (parameters.points));
    this.Serializable$set(
        'bandId', (parameters.bandId == null) ? (null) : (parameters.bandId));
  }

  get bandId(): string|null {
    return (
        (this.Serializable$has('bandId')) ? (this.Serializable$get('bandId')) :
                                            (null));
  }

  /**
   * The ID of the band whose CRS defines the coordinates of the footprint.
   * If empty, the first band is used.
   */
  set bandId(value: string|null) {
    this.Serializable$set('bandId', value);
  }

  get points(): Array<GridPoint>|null {
    return (
        (this.Serializable$has('points')) ? (this.Serializable$get('points')) :
                                            (null));
  }

  /**
   * A ring which forms the exterior of a simple polygon that must contain the
   * centers of all valid pixels of the image. This must be a linear ring: the
   * last point must be equal to the first. Coordinates are in the projection of
   * the band specified by `band_id`.
   *
   * Note: Use non-integer coordinates such as the center of each pixel because
   * footprint is taken to include a pixel iff the pixel (a 1x1 rectangle)
   * intersects the footprint. To avoid accidentally selecting neighboring
   * pixels, don't use integer-valued coordinates, because those are the
   * boundaries between pixels. Drawing the footprint along the pixel centers
   * prevents including unintended pixels, which can cause errors when
   * intended pixels are abutting a map boundary such as the antimeridian
   * or a pole.
   *
   * For example, for a 2x2 image with all 4 valid pixels the following is one
   * possible ring:
   * [{\"x\": 0.5, \"y\": 0.5}, {\"x\": 0.5, \"y\": 1.5}, {\"x\": 1.5,
   * \"y\": 1.5},
   *  {\"x\": 1.5, \"y\": 0.5}, {\"x\": 0.5, \"y\": 0.5}]
   */
  set points(value: Array<GridPoint>|null) {
    this.Serializable$set('points', value);
  }

  getConstructor(): SerializableCtor<PixelFootprint> {
    return PixelFootprint;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {arrays: {'points': GridPoint}, keys: ['bandId', 'points']};
  }
}

export interface PixelGridParameters {
  crsCode?: string|null;
  crsWkt?: string|null;
  dimensions?: GridDimensions|null;
  affineTransform?: AffineTransform|null;
}
export class PixelGrid extends Serializable {
  constructor(parameters: PixelGridParameters = {}) {
    super();
    this.Serializable$set(
        'crsCode',
        (parameters.crsCode == null) ? (null) : (parameters.crsCode));
    this.Serializable$set(
        'crsWkt', (parameters.crsWkt == null) ? (null) : (parameters.crsWkt));
    this.Serializable$set(
        'dimensions',
        (parameters.dimensions == null) ? (null) : (parameters.dimensions));
    this.Serializable$set(
        'affineTransform',
        (parameters.affineTransform == null) ? (null) :
                                               (parameters.affineTransform));
  }

  get affineTransform(): AffineTransform|null {
    return (
        (this.Serializable$has('affineTransform')) ?
            (this.Serializable$get('affineTransform')) :
            (null));
  }

  /**
   * The affine transform.
   */
  set affineTransform(value: AffineTransform|null) {
    this.Serializable$set('affineTransform', value);
  }

  get crsCode(): string|null {
    return (
        (this.Serializable$has('crsCode')) ?
            (this.Serializable$get('crsCode')) :
            (null));
  }

  /**
   * A standard coordinate reference system code (e.g. \"EPSG:4326\").
   */
  set crsCode(value: string|null) {
    this.Serializable$set('crsCode', value);
  }

  get crsWkt(): string|null {
    return (
        (this.Serializable$has('crsWkt')) ? (this.Serializable$get('crsWkt')) :
                                            (null));
  }

  /**
   * A coordinate reference system in WKT format (\"Well-Known Text\").
   */
  set crsWkt(value: string|null) {
    this.Serializable$set('crsWkt', value);
  }

  get dimensions(): GridDimensions|null {
    return (
        (this.Serializable$has('dimensions')) ?
            (this.Serializable$get('dimensions')) :
            (null));
  }

  /**
   * The dimensions of the pixel grid.
   */
  set dimensions(value: GridDimensions|null) {
    this.Serializable$set('dimensions', value);
  }

  getConstructor(): SerializableCtor<PixelGrid> {
    return PixelGrid;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['affineTransform', 'crsCode', 'crsWkt', 'dimensions'],
      objects:
          {'affineTransform': AffineTransform, 'dimensions': GridDimensions}
    };
  }
}

export interface PolicyParameters {
  version?: number|null;
  bindings?: Array<Binding>|null;
  auditConfigs?: Array<AuditConfig>|null;
  rules?: Array<Rule>|null;
  etag?: string|null;
  iamOwned?: boolean|null;
}
export class Policy extends Serializable {
  constructor(parameters: PolicyParameters = {}) {
    super();
    this.Serializable$set(
        'version',
        (parameters.version == null) ? (null) : (parameters.version));
    this.Serializable$set(
        'bindings',
        (parameters.bindings == null) ? (null) : (parameters.bindings));
    this.Serializable$set(
        'auditConfigs',
        (parameters.auditConfigs == null) ? (null) : (parameters.auditConfigs));
    this.Serializable$set(
        'rules', (parameters.rules == null) ? (null) : (parameters.rules));
    this.Serializable$set(
        'etag', (parameters.etag == null) ? (null) : (parameters.etag));
    this.Serializable$set(
        'iamOwned',
        (parameters.iamOwned == null) ? (null) : (parameters.iamOwned));
  }

  get auditConfigs(): Array<AuditConfig>|null {
    return (
        (this.Serializable$has('auditConfigs')) ?
            (this.Serializable$get('auditConfigs')) :
            (null));
  }

  /**
   * Specifies cloud audit logging configuration for this policy.
   */
  set auditConfigs(value: Array<AuditConfig>|null) {
    this.Serializable$set('auditConfigs', value);
  }

  get bindings(): Array<Binding>|null {
    return (
        (this.Serializable$has('bindings')) ?
            (this.Serializable$get('bindings')) :
            (null));
  }

  /**
   * Associates a list of `members` to a `role`. Optionally, may specify a
   * `condition` that determines how and when the `bindings` are applied. Each
   * of the `bindings` must contain at least one member.
   */
  set bindings(value: Array<Binding>|null) {
    this.Serializable$set('bindings', value);
  }

  get etag(): string|null {
    return (
        (this.Serializable$has('etag')) ? (this.Serializable$get('etag')) :
                                          (null));
  }

  /**
   * `etag` is used for optimistic concurrency control as a way to help
   * prevent simultaneous updates of a policy from overwriting each other.
   * It is strongly suggested that systems make use of the `etag` in the
   * read-modify-write cycle to perform policy updates in order to avoid race
   * conditions: An `etag` is returned in the response to `getIamPolicy`, and
   * systems are expected to put that etag in the request to `setIamPolicy` to
   * ensure that their change will be applied to the same version of the policy.
   *
   * **Important:** If you use IAM Conditions, you must include the `etag` field
   * whenever you call `setIamPolicy`. If you omit this field, then IAM allows
   * you to overwrite a version `3` policy with a version `1` policy, and all of
   * the conditions in the version `3` policy are lost.
   */
  set etag(value: string|null) {
    this.Serializable$set('etag', value);
  }

  get iamOwned(): boolean|null {
    return (
        (this.Serializable$has('iamOwned')) ?
            (this.Serializable$get('iamOwned')) :
            (null));
  }

  set iamOwned(value: boolean|null) {
    this.Serializable$set('iamOwned', value);
  }

  get rules(): Array<Rule>|null {
    return (
        (this.Serializable$has('rules')) ? (this.Serializable$get('rules')) :
                                           (null));
  }

  /**
   * If more than one rule is specified, the rules are applied in the following
   * manner:
   * - All matching LOG rules are always applied.
   * - If any DENY/DENY_WITH_LOG rule matches, permission is denied.
   *   Logging will be applied if one or more matching rule requires logging.
   * - Otherwise, if any ALLOW/ALLOW_WITH_LOG rule matches, permission is
   *   granted.
   *   Logging will be applied if one or more matching rule requires logging.
   * - Otherwise, if no rule applies, permission is denied.
   */
  set rules(value: Array<Rule>|null) {
    this.Serializable$set('rules', value);
  }

  get version(): number|null {
    return (
        (this.Serializable$has('version')) ?
            (this.Serializable$get('version')) :
            (null));
  }

  /**
   * Specifies the format of the policy.
   *
   * Valid values are `0`, `1`, and `3`. Requests that specify an invalid value
   * are rejected.
   *
   * Any operation that affects conditional role bindings must specify version
   * `3`. This requirement applies to the following operations:
   *
   * * Getting a policy that includes a conditional role binding
   * * Adding a conditional role binding to a policy
   * * Changing a conditional role binding in a policy
   * * Removing any role binding, with or without a condition, from a policy
   *   that includes conditions
   *
   * **Important:** If you use IAM Conditions, you must include the `etag` field
   * whenever you call `setIamPolicy`. If you omit this field, then IAM allows
   * you to overwrite a version `3` policy with a version `1` policy, and all of
   * the conditions in the version `3` policy are lost.
   *
   * If a policy does not include any conditions, operations on that policy may
   * specify any valid version or leave the field unset.
   *
   * To learn which resources support conditions in their IAM policies, see the
   * [IAM
   * documentation](https://cloud.google.com/iam/help/conditions/resource-policies).
   */
  set version(value: number|null) {
    this.Serializable$set('version', value);
  }

  getConstructor(): SerializableCtor<Policy> {
    return Policy;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'auditConfigs': AuditConfig, 'bindings': Binding, 'rules': Rule},
      keys: ['auditConfigs', 'bindings', 'etag', 'iamOwned', 'rules', 'version']
    };
  }
}

export interface RuleParameters {
  description?: string|null;
  permissions?: Array<string>|null;
  action?: RuleAction|null;
  in ?: Array<string>|null;
  notIn?: Array<string>|null;
  conditions?: Array<Condition>|null;
  logConfig?: Array<LogConfig>|null;
}
export class Rule extends Serializable {
  constructor(parameters: RuleParameters = {}) {
    super();
    this.Serializable$set(
        'description',
        (parameters.description == null) ? (null) : (parameters.description));
    this.Serializable$set(
        'permissions',
        (parameters.permissions == null) ? (null) : (parameters.permissions));
    this.Serializable$set(
        'action', (parameters.action == null) ? (null) : (parameters.action));
    this.Serializable$set(
        'in', (parameters.in == null) ? (null) : (parameters.in));
    this.Serializable$set(
        'notIn', (parameters.notIn == null) ? (null) : (parameters.notIn));
    this.Serializable$set(
        'conditions',
        (parameters.conditions == null) ? (null) : (parameters.conditions));
    this.Serializable$set(
        'logConfig',
        (parameters.logConfig == null) ? (null) : (parameters.logConfig));
  }

  static get Action(): IRuleActionEnum {
    return RuleActionEnum;
  }

  get action(): RuleAction|null {
    return (
        (this.Serializable$has('action')) ? (this.Serializable$get('action')) :
                                            (null));
  }

  /**
   * Required
   */
  set action(value: RuleAction|null) {
    this.Serializable$set('action', value);
  }

  get conditions(): Array<Condition>|null {
    return (
        (this.Serializable$has('conditions')) ?
            (this.Serializable$get('conditions')) :
            (null));
  }

  /**
   * Additional restrictions that must be met. All conditions must pass for the
   * rule to match.
   */
  set conditions(value: Array<Condition>|null) {
    this.Serializable$set('conditions', value);
  }

  get description(): string|null {
    return (
        (this.Serializable$has('description')) ?
            (this.Serializable$get('description')) :
            (null));
  }

  /**
   * Human-readable description of the rule.
   */
  set description(value: string|null) {
    this.Serializable$set('description', value);
  }

  get in(): Array<string>|null {
    return (
        (this.Serializable$has('in')) ? (this.Serializable$get('in')) : (null));
  }

  /**
   * If one or more 'in' clauses are specified, the rule matches if
   * the PRINCIPAL/AUTHORITY_SELECTOR is in at least one of these entries.
   */
  set in(value: Array<string>|null) {
    this.Serializable$set('in', value);
  }

  get logConfig(): Array<LogConfig>|null {
    return (
        (this.Serializable$has('logConfig')) ?
            (this.Serializable$get('logConfig')) :
            (null));
  }

  /**
   * The config returned to callers of tech.iam.IAM.CheckPolicy for any entries
   * that match the LOG action.
   */
  set logConfig(value: Array<LogConfig>|null) {
    this.Serializable$set('logConfig', value);
  }

  get notIn(): Array<string>|null {
    return (
        (this.Serializable$has('notIn')) ? (this.Serializable$get('notIn')) :
                                           (null));
  }

  /**
   * If one or more 'not_in' clauses are specified, the rule matches
   * if the PRINCIPAL/AUTHORITY_SELECTOR is in none of the entries.
   * The format for in and not_in entries can be found at in the Local IAM
   * documentation (see go/local-iam#features).
   */
  set notIn(value: Array<string>|null) {
    this.Serializable$set('notIn', value);
  }

  get permissions(): Array<string>|null {
    return (
        (this.Serializable$has('permissions')) ?
            (this.Serializable$get('permissions')) :
            (null));
  }

  /**
   * A permission is a string of form '<service>.<resource type>.<verb>'
   * (e.g., 'storage.buckets.list'). A value of '*' matches all permissions,
   * and a verb part of '*' (e.g., 'storage.buckets.*') matches all verbs.
   */
  set permissions(value: Array<string>|null) {
    this.Serializable$set('permissions', value);
  }

  getConstructor(): SerializableCtor<Rule> {
    return Rule;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'conditions': Condition, 'logConfig': LogConfig},
      enums: {'action': RuleActionEnum},
      keys: [
        'action', 'conditions', 'description', 'in', 'logConfig', 'notIn',
        'permissions'
      ]
    };
  }
}

export interface SetIamPolicyRequestParameters {
  policy?: Policy|null;
  updateMask?: string|null;
}
export class SetIamPolicyRequest extends Serializable {
  constructor(parameters: SetIamPolicyRequestParameters = {}) {
    super();
    this.Serializable$set(
        'policy', (parameters.policy == null) ? (null) : (parameters.policy));
    this.Serializable$set(
        'updateMask',
        (parameters.updateMask == null) ? (null) : (parameters.updateMask));
  }

  get policy(): Policy|null {
    return (
        (this.Serializable$has('policy')) ? (this.Serializable$get('policy')) :
                                            (null));
  }

  /**
   * REQUIRED: The complete policy to be applied to the `resource`. The size of
   * the policy is limited to a few 10s of KB. An empty policy is a
   * valid policy but certain Cloud Platform services (such as Projects)
   * might reject them.
   */
  set policy(value: Policy|null) {
    this.Serializable$set('policy', value);
  }

  get updateMask(): string|null {
    return (
        (this.Serializable$has('updateMask')) ?
            (this.Serializable$get('updateMask')) :
            (null));
  }

  /**
   * OPTIONAL: A FieldMask specifying which fields of the policy to modify. Only
   * the fields in the mask will be modified. If no mask is provided, the
   * following default mask is used:
   *
   * `paths: \"bindings, etag\"`
   */
  set updateMask(value: string|null) {
    this.Serializable$set('updateMask', value);
  }

  getConstructor(): SerializableCtor<SetIamPolicyRequest> {
    return SetIamPolicyRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['policy', 'updateMask'], objects: {'policy': Policy}};
  }
}

export interface StatusParameters {
  code?: number|null;
  message?: string|null;
  details?: Array<ApiClientObjectMap<any>>|null;
}
export class Status extends Serializable {
  constructor(parameters: StatusParameters = {}) {
    super();
    this.Serializable$set(
        'code', (parameters.code == null) ? (null) : (parameters.code));
    this.Serializable$set(
        'message',
        (parameters.message == null) ? (null) : (parameters.message));
    this.Serializable$set(
        'details',
        (parameters.details == null) ? (null) : (parameters.details));
  }

  get code(): number|null {
    return (
        (this.Serializable$has('code')) ? (this.Serializable$get('code')) :
                                          (null));
  }

  /**
   * The status code, which should be an enum value of google.rpc.Code.
   */
  set code(value: number|null) {
    this.Serializable$set('code', value);
  }

  get details(): Array<ApiClientObjectMap<any>>|null {
    return (
        (this.Serializable$has('details')) ?
            (this.Serializable$get('details')) :
            (null));
  }

  /**
   * A list of messages that carry the error details.  There is a common set of
   * message types for APIs to use.
   */
  set details(value: Array<ApiClientObjectMap<any>>|null) {
    this.Serializable$set('details', value);
  }

  get message(): string|null {
    return (
        (this.Serializable$has('message')) ?
            (this.Serializable$get('message')) :
            (null));
  }

  /**
   * A developer-facing error message, which should be in English. Any
   * user-facing error message should be localized and sent in the
   * google.rpc.Status.details field, or localized by the client.
   */
  set message(value: string|null) {
    this.Serializable$set('message', value);
  }

  getConstructor(): SerializableCtor<Status> {
    return Status;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['code', 'details', 'message'],
      objectMaps: {
        'details': {
          ctor: null,
          isPropertyArray: true,
          isSerializable: false,
          isValueArray: false
        }
      }
    };
  }
}

export interface TableParameters {
  name?: string|null;
  expression?: Expression|null;
  fileFormat?: TableFileFormat|null;
  selectors?: Array<string>|null;
  filename?: string|null;
}
export class Table extends Serializable {
  constructor(parameters: TableParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'selectors',
        (parameters.selectors == null) ? (null) : (parameters.selectors));
    this.Serializable$set(
        'filename',
        (parameters.filename == null) ? (null) : (parameters.filename));
  }

  static get FileFormat(): ITableFileFormatEnum {
    return TableFileFormatEnum;
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * The expression to compute. Must evaluate to a FeatureCollection.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get fileFormat(): TableFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The output encoding in which to generate the resulting table.
   */
  set fileFormat(value: TableFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get filename(): string|null {
    return (
        (this.Serializable$has('filename')) ?
            (this.Serializable$get('filename')) :
            (null));
  }

  /**
   * Optional filename of the resulting table.
   */
  set filename(value: string|null) {
    this.Serializable$set('filename', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The resource name representing the thumbnail, of the form
   * \"projects/* /tables/**\"
   * (e.g. \"projects/earthengine-legacy/tables/<THUMBNAIL-ID>\").
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get selectors(): Array<string>|null {
    return (
        (this.Serializable$has('selectors')) ?
            (this.Serializable$get('selectors')) :
            (null));
  }

  /**
   * Optional property fields to select from the specified table.
   */
  set selectors(value: Array<string>|null) {
    this.Serializable$set('selectors', value);
  }

  getConstructor(): SerializableCtor<Table> {
    return Table;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'fileFormat': TableFileFormatEnum},
      keys: ['expression', 'fileFormat', 'filename', 'name', 'selectors'],
      objects: {'expression': Expression}
    };
  }
}

export interface TableAssetExportOptionsParameters {
  earthEngineDestination?: EarthEngineDestination|null;
}
export class TableAssetExportOptions extends Serializable {
  constructor(parameters: TableAssetExportOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'earthEngineDestination',
        (parameters.earthEngineDestination == null) ?
            (null) :
            (parameters.earthEngineDestination));
  }

  get earthEngineDestination(): EarthEngineDestination|null {
    return (
        (this.Serializable$has('earthEngineDestination')) ?
            (this.Serializable$get('earthEngineDestination')) :
            (null));
  }

  /**
   * If specified, configures export to Earth Engine.
   */
  set earthEngineDestination(value: EarthEngineDestination|null) {
    this.Serializable$set('earthEngineDestination', value);
  }

  getConstructor(): SerializableCtor<TableAssetExportOptions> {
    return TableAssetExportOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['earthEngineDestination'],
      objects: {'earthEngineDestination': EarthEngineDestination}
    };
  }
}

export interface TableFileExportOptionsParameters {
  fileFormat?: TableFileExportOptionsFileFormat|null;
  driveDestination?: DriveDestination|null;
  gcsDestination?: GcsDestination|null;
}
export class TableFileExportOptions extends Serializable {
  constructor(parameters: TableFileExportOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'driveDestination',
        (parameters.driveDestination == null) ? (null) :
                                                (parameters.driveDestination));
    this.Serializable$set(
        'gcsDestination',
        (parameters.gcsDestination == null) ? (null) :
                                              (parameters.gcsDestination));
  }

  static get FileFormat(): ITableFileExportOptionsFileFormatEnum {
    return TableFileExportOptionsFileFormatEnum;
  }

  get driveDestination(): DriveDestination|null {
    return (
        (this.Serializable$has('driveDestination')) ?
            (this.Serializable$get('driveDestination')) :
            (null));
  }

  /**
   * If specified, configures export to Google Drive.
   */
  set driveDestination(value: DriveDestination|null) {
    this.Serializable$set('driveDestination', value);
  }

  get fileFormat(): TableFileExportOptionsFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The file format in which to export the table(s).
   */
  set fileFormat(value: TableFileExportOptionsFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get gcsDestination(): GcsDestination|null {
    return (
        (this.Serializable$has('gcsDestination')) ?
            (this.Serializable$get('gcsDestination')) :
            (null));
  }

  /**
   * If specified, configures export to Google Cloud Storage.
   */
  set gcsDestination(value: GcsDestination|null) {
    this.Serializable$set('gcsDestination', value);
  }

  getConstructor(): SerializableCtor<TableFileExportOptions> {
    return TableFileExportOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'fileFormat': TableFileExportOptionsFileFormatEnum},
      keys: ['driveDestination', 'fileFormat', 'gcsDestination'],
      objects: {
        'driveDestination': DriveDestination,
        'gcsDestination': GcsDestination
      }
    };
  }
}

export interface TableManifestParameters {
  name?: string|null;
  properties?: ApiClientObjectMap<any>|null;
  uriPrefix?: string|null;
  sources?: Array<TableSource>|null;
  startTime?: string|null;
  endTime?: string|null;
}
export class TableManifest extends Serializable {
  constructor(parameters: TableManifestParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'properties',
        (parameters.properties == null) ? (null) : (parameters.properties));
    this.Serializable$set(
        'uriPrefix',
        (parameters.uriPrefix == null) ? (null) : (parameters.uriPrefix));
    this.Serializable$set(
        'sources',
        (parameters.sources == null) ? (null) : (parameters.sources));
    this.Serializable$set(
        'startTime',
        (parameters.startTime == null) ? (null) : (parameters.startTime));
    this.Serializable$set(
        'endTime',
        (parameters.endTime == null) ? (null) : (parameters.endTime));
  }

  get endTime(): string|null {
    return (
        (this.Serializable$has('endTime')) ?
            (this.Serializable$get('endTime')) :
            (null));
  }

  /**
   * For assets that correspond to an interval of time, such as average values
   * over a month or year, this timestamp corresponds to the end of that
   * interval (exclusive).
   */
  set endTime(value: string|null) {
    this.Serializable$set('endTime', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The name of the asset to be created.
   * `name` is of the format \"projects/* /assets/**\"
   * (e.g. \"projects/earthengine-legacy/assets/users/<USER>/<ASSET>\").
   * All user-owned assets are under the project \"earthengine-legacy\"
   * (e.g. \"projects/earthengine-legacy/assets/users/foo/bar\").
   * All other assets are under the project \"earthengine-public\"
   * (e.g. \"projects/earthengine-public/assets/LANDSAT\").
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get properties(): ApiClientObjectMap<any>|null {
    return (
        (this.Serializable$has('properties')) ?
            (this.Serializable$get('properties')) :
            (null));
  }

  /**
   * Additional properties of the asset. The property names
   * \"system:time_start\" and \"system:time_end\" are deprecated. Use the
   * fields `start_time` and `end_time` instead.
   */
  set properties(value: ApiClientObjectMap<any>|null) {
    this.Serializable$set('properties', value);
  }

  get sources(): Array<TableSource>|null {
    return (
        (this.Serializable$has('sources')) ?
            (this.Serializable$get('sources')) :
            (null));
  }

  /**
   * The sources which comprise this table.
   */
  set sources(value: Array<TableSource>|null) {
    this.Serializable$set('sources', value);
  }

  get startTime(): string|null {
    return (
        (this.Serializable$has('startTime')) ?
            (this.Serializable$get('startTime')) :
            (null));
  }

  /**
   * The timestamp associated with the asset, if any, e.g. the time at which a
   * satellite image was taken. For assets that correspond to an interval of
   * time, such as average values over a month or year, this timestamp
   * corresponds to the start of that interval.
   */
  set startTime(value: string|null) {
    this.Serializable$set('startTime', value);
  }

  get uriPrefix(): string|null {
    return (
        (this.Serializable$has('uriPrefix')) ?
            (this.Serializable$get('uriPrefix')) :
            (null));
  }

  /**
   * The optional prefix prepended to all `uri`s defined in this
   * manifest.
   */
  set uriPrefix(value: string|null) {
    this.Serializable$set('uriPrefix', value);
  }

  getConstructor(): SerializableCtor<TableManifest> {
    return TableManifest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'sources': TableSource},
      keys: [
        'endTime', 'name', 'properties', 'sources', 'startTime', 'uriPrefix'
      ],
      objectMaps: {
        'properties': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        }
      }
    };
  }
}

export interface TableSourceParameters {
  uris?: Array<string>|null;
  charset?: string|null;
  maxErrorMeters?: number|null;
  maxVertices?: number|null;
  crs?: string|null;
  geodesic?: boolean|null;
  primaryGeometryColumn?: string|null;
  xColumn?: string|null;
  yColumn?: string|null;
  dateFormat?: string|null;
  csvDelimiter?: string|null;
  csvQualifier?: string|null;
}
export class TableSource extends Serializable {
  constructor(parameters: TableSourceParameters = {}) {
    super();
    this.Serializable$set(
        'uris', (parameters.uris == null) ? (null) : (parameters.uris));
    this.Serializable$set(
        'charset',
        (parameters.charset == null) ? (null) : (parameters.charset));
    this.Serializable$set(
        'maxErrorMeters',
        (parameters.maxErrorMeters == null) ? (null) :
                                              (parameters.maxErrorMeters));
    this.Serializable$set(
        'maxVertices',
        (parameters.maxVertices == null) ? (null) : (parameters.maxVertices));
    this.Serializable$set(
        'crs', (parameters.crs == null) ? (null) : (parameters.crs));
    this.Serializable$set(
        'geodesic',
        (parameters.geodesic == null) ? (null) : (parameters.geodesic));
    this.Serializable$set(
        'primaryGeometryColumn',
        (parameters.primaryGeometryColumn == null) ?
            (null) :
            (parameters.primaryGeometryColumn));
    this.Serializable$set(
        'xColumn',
        (parameters.xColumn == null) ? (null) : (parameters.xColumn));
    this.Serializable$set(
        'yColumn',
        (parameters.yColumn == null) ? (null) : (parameters.yColumn));
    this.Serializable$set(
        'dateFormat',
        (parameters.dateFormat == null) ? (null) : (parameters.dateFormat));
    this.Serializable$set(
        'csvDelimiter',
        (parameters.csvDelimiter == null) ? (null) : (parameters.csvDelimiter));
    this.Serializable$set(
        'csvQualifier',
        (parameters.csvQualifier == null) ? (null) : (parameters.csvQualifier));
  }

  get charset(): string|null {
    return (
        (this.Serializable$has('charset')) ?
            (this.Serializable$get('charset')) :
            (null));
  }

  /**
   * The name of the default charset to use for decoding strings. If empty,
   * the charset \"utf-8\" is assumed by default.
   */
  set charset(value: string|null) {
    this.Serializable$set('charset', value);
  }

  get crs(): string|null {
    return (
        (this.Serializable$has('crs')) ? (this.Serializable$get('crs')) :
                                         (null));
  }

  /**
   * The default CRS code or WKT string specifying the coordinate reference
   * system of any geometry that does not have one specified. If left blank, the
   * default will be EPSG:4326: https://epsg.io/4326. For CSV/TFRecord sources
   * only.
   */
  set crs(value: string|null) {
    this.Serializable$set('crs', value);
  }

  get csvDelimiter(): string|null {
    return (
        (this.Serializable$has('csvDelimiter')) ?
            (this.Serializable$get('csvDelimiter')) :
            (null));
  }

  /**
   * When ingesting CSV files, a single character used as a delimiter between
   * column values in a row. If left blank, defaults to ','. For CSV sources
   * only.
   */
  set csvDelimiter(value: string|null) {
    this.Serializable$set('csvDelimiter', value);
  }

  get csvQualifier(): string|null {
    return (
        (this.Serializable$has('csvQualifier')) ?
            (this.Serializable$get('csvQualifier')) :
            (null));
  }

  /**
   * When ingesting CSV files, a character that surrounds column values (a.k.a.
   * \"quote character\"). If left blank, defaults to '\"'. For CSV sources
   * only.
   *
   * If a column value is not surrounded by qualifiers, leading and tailing
   * whitespace is trimmed.
   * For example:
   *    ..., test,...            <== this value is not qualified
   * becomes the string value:
   *    \"test\"                   <== whitespace is stripped
   *
   * where:
   *    ...,\" test\",...          <== this value IS qualified with quotes
   * becomes the string value:
   *    \" test\"                  <== whitespace remains!
   */
  set csvQualifier(value: string|null) {
    this.Serializable$set('csvQualifier', value);
  }

  get dateFormat(): string|null {
    return (
        (this.Serializable$has('dateFormat')) ?
            (this.Serializable$get('dateFormat')) :
            (null));
  }

  /**
   * A format with which to parse fields encoding dates. The format pattern must
   * be as described at
   * http://joda-time.sourceforge.net/apidocs/org/joda/time/format/DateTimeFormat.html.
   * If left blank, dates will be imported as strings. For CSV/TFRecord sources
   * only.
   */
  set dateFormat(value: string|null) {
    this.Serializable$set('dateFormat', value);
  }

  get geodesic(): boolean|null {
    return (
        (this.Serializable$has('geodesic')) ?
            (this.Serializable$get('geodesic')) :
            (null));
  }

  /**
   * The default strategy for interpreting edges in geometry that do not have
   * one otherwise specified. If false, edges are straight in the projection. If
   * true, edges are curved to follow the shortest path on the surface of the
   * Earth. When blank, defaults to false if 'crs' is a projected coordinate
   * system. For CSV/TFRecord sources only.
   */
  set geodesic(value: boolean|null) {
    this.Serializable$set('geodesic', value);
  }

  get maxErrorMeters(): number|null {
    return (
        (this.Serializable$has('maxErrorMeters')) ?
            (this.Serializable$get('maxErrorMeters')) :
            (null));
  }

  /**
   * The max allowed error in meters when transforming geometry between
   * coordinate systems. If empty, the max error is 1 meter by default.
   */
  set maxErrorMeters(value: number|null) {
    this.Serializable$set('maxErrorMeters', value);
  }

  get maxVertices(): number|null {
    return (
        (this.Serializable$has('maxVertices')) ?
            (this.Serializable$get('maxVertices')) :
            (null));
  }

  /**
   * The max number of vertices. If not zero, geometry will be subdivided into
   * spatially disjoint pieces which are each under this limit.
   */
  set maxVertices(value: number|null) {
    this.Serializable$set('maxVertices', value);
  }

  get primaryGeometryColumn(): string|null {
    return (
        (this.Serializable$has('primaryGeometryColumn')) ?
            (this.Serializable$get('primaryGeometryColumn')) :
            (null));
  }

  /**
   * The geometry column to use as a row's primary geometry when there is more
   * than one geometry column.
   *
   * If left blank and more than one geometry column exists, the first geometry
   * column encountered is used. For CSV/TFRecord sources only.
   */
  set primaryGeometryColumn(value: string|null) {
    this.Serializable$set('primaryGeometryColumn', value);
  }

  get uris(): Array<string>|null {
    return (
        (this.Serializable$has('uris')) ? (this.Serializable$get('uris')) :
                                          (null));
  }

  /**
   * The URIs of the data to import. Currently only Google Cloud Storage URIs
   * are supported. Each URI must be specified in the following format:
   * \"gs://bucket-id/object-id\".
   * The primary object should be the first element of the list, sidecar files
   * are inferred from the filepath of the primary object. Only one URI is
   * currently supported. If more than one URI is specified an
   * `INALID_ARGUMENT` error is returned.
   */
  set uris(value: Array<string>|null) {
    this.Serializable$set('uris', value);
  }

  get xColumn(): string|null {
    return (
        (this.Serializable$has('xColumn')) ?
            (this.Serializable$get('xColumn')) :
            (null));
  }

  /**
   * The name of the numeric x coordinate column for deducing point geometry. If
   * the y_column is also specified, and both columns contain number values,
   * then a point geometry column will be constructed with x,y values in the
   * coordinate system given in 'crs'. If left blank and 'crs' does _not_
   * specify a projected coordinate system, defaults to \"longitude\". If left
   * blank and 'crs' _does_ specify a projected coordinate system, defaults to
   * \"\" and no point geometry is generated.
   *
   * A generated point geometry column will be named {x_column}_{y_column}_N
   * where N is appended such that {x_column}_{y_column}_N is unique if a column
   * named {x_column}_{y_column} already exists. For CSV/TFRecord sources only.
   */
  set xColumn(value: string|null) {
    this.Serializable$set('xColumn', value);
  }

  get yColumn(): string|null {
    return (
        (this.Serializable$has('yColumn')) ?
            (this.Serializable$get('yColumn')) :
            (null));
  }

  /**
   * The name of the numeric y coordinate column for deducing point geometry. If
   * the x_column is also specified, and both columns contain number values,
   * then a point geometry column will be constructed with x,y values in the
   * coordinate system given in 'crs'. If left blank and 'crs' does _not_
   * specify a projected coordinate system, defaults to \"latitude\". If left
   * blank and 'crs' _does_ specify a projected coordinate system, defaults to
   * \"\" and no point geometry is generated.
   *
   * A generated point geometry column will be named {x_column}_{y_column}_N
   * where N is appended such that {x_column}_{y_column}_N is unique if a column
   * named {x_column}_{y_column} already exists. For CSV/TFRecord sources only.
   */
  set yColumn(value: string|null) {
    this.Serializable$set('yColumn', value);
  }

  getConstructor(): SerializableCtor<TableSource> {
    return TableSource;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: [
        'charset', 'crs', 'csvDelimiter', 'csvQualifier', 'dateFormat',
        'geodesic', 'maxErrorMeters', 'maxVertices', 'primaryGeometryColumn',
        'uris', 'xColumn', 'yColumn'
      ]
    };
  }
}

export interface TestIamPermissionsRequestParameters {
  permissions?: Array<string>|null;
}
export class TestIamPermissionsRequest extends Serializable {
  constructor(parameters: TestIamPermissionsRequestParameters = {}) {
    super();
    this.Serializable$set(
        'permissions',
        (parameters.permissions == null) ? (null) : (parameters.permissions));
  }

  get permissions(): Array<string>|null {
    return (
        (this.Serializable$has('permissions')) ?
            (this.Serializable$get('permissions')) :
            (null));
  }

  /**
   * The set of permissions to check for the `resource`. Permissions with
   * wildcards (such as '*' or 'storage.*') are not allowed. For more
   * information see
   * [IAM Overview](https://cloud.google.com/iam/docs/overview#permissions).
   */
  set permissions(value: Array<string>|null) {
    this.Serializable$set('permissions', value);
  }

  getConstructor(): SerializableCtor<TestIamPermissionsRequest> {
    return TestIamPermissionsRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['permissions']};
  }
}

export interface TestIamPermissionsResponseParameters {
  permissions?: Array<string>|null;
}
export class TestIamPermissionsResponse extends Serializable {
  constructor(parameters: TestIamPermissionsResponseParameters = {}) {
    super();
    this.Serializable$set(
        'permissions',
        (parameters.permissions == null) ? (null) : (parameters.permissions));
  }

  get permissions(): Array<string>|null {
    return (
        (this.Serializable$has('permissions')) ?
            (this.Serializable$get('permissions')) :
            (null));
  }

  /**
   * A subset of `TestPermissionsRequest.permissions` that the caller is
   * allowed.
   */
  set permissions(value: Array<string>|null) {
    this.Serializable$set('permissions', value);
  }

  getConstructor(): SerializableCtor<TestIamPermissionsResponse> {
    return TestIamPermissionsResponse;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['permissions']};
  }
}

export interface TfRecordImageExportOptionsParameters {
  tileDimensions?: GridDimensions|null;
  marginDimensions?: GridDimensions|null;
  compress?: boolean|null;
  maxSizeBytes?: string|null;
  defaultValue?: number|null;
  tensorDepths?: ApiClientObjectMap<number>|null;
  sequenceData?: boolean|null;
  collapseBands?: boolean|null;
  maxMaskedRatio?: number|null;
}
export class TfRecordImageExportOptions extends Serializable {
  constructor(parameters: TfRecordImageExportOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'tileDimensions',
        (parameters.tileDimensions == null) ? (null) :
                                              (parameters.tileDimensions));
    this.Serializable$set(
        'marginDimensions',
        (parameters.marginDimensions == null) ? (null) :
                                                (parameters.marginDimensions));
    this.Serializable$set(
        'compress',
        (parameters.compress == null) ? (null) : (parameters.compress));
    this.Serializable$set(
        'maxSizeBytes',
        (parameters.maxSizeBytes == null) ? (null) : (parameters.maxSizeBytes));
    this.Serializable$set(
        'defaultValue',
        (parameters.defaultValue == null) ? (null) : (parameters.defaultValue));
    this.Serializable$set(
        'tensorDepths',
        (parameters.tensorDepths == null) ? (null) : (parameters.tensorDepths));
    this.Serializable$set(
        'sequenceData',
        (parameters.sequenceData == null) ? (null) : (parameters.sequenceData));
    this.Serializable$set(
        'collapseBands',
        (parameters.collapseBands == null) ? (null) :
                                             (parameters.collapseBands));
    this.Serializable$set(
        'maxMaskedRatio',
        (parameters.maxMaskedRatio == null) ? (null) :
                                              (parameters.maxMaskedRatio));
  }

  get collapseBands(): boolean|null {
    return (
        (this.Serializable$has('collapseBands')) ?
            (this.Serializable$get('collapseBands')) :
            (null));
  }

  /**
   * If true, all bands will be combined into a single 3D tensor, taking on the
   * name of the first band in the image. All bands are promoted to bytes,
   * int64s, then floats in that order depending on the type furthest in that
   * sequence within all bands. Array bands are allowed as long as tensor_depths
   * is specified.
   */
  set collapseBands(value: boolean|null) {
    this.Serializable$set('collapseBands', value);
  }

  get compress(): boolean|null {
    return (
        (this.Serializable$has('compress')) ?
            (this.Serializable$get('compress')) :
            (null));
  }

  /**
   * If true, compresses the .tfrecord files with gzip and appends the \".gz\"
   * suffix.
   */
  set compress(value: boolean|null) {
    this.Serializable$set('compress', value);
  }

  get defaultValue(): number|null {
    return (
        (this.Serializable$has('defaultValue')) ?
            (this.Serializable$get('defaultValue')) :
            (null));
  }

  /**
   * The value set in each band of a pixel that is partially or completely
   * masked, and, the value set at each value in an output 3D feature made from
   * an array band where the array length at the source pixel was less than the
   * depth of the feature value. The fractional part is dropped for integer type
   * bands, and clamped to the range of the band type. Defaults to 0.
   */
  set defaultValue(value: number|null) {
    this.Serializable$set('defaultValue', value);
  }

  get marginDimensions(): GridDimensions|null {
    return (
        (this.Serializable$has('marginDimensions')) ?
            (this.Serializable$get('marginDimensions')) :
            (null));
  }

  /**
   * If specified, tiles will be buffered by the margin dimensions both
   * positively and negatively, resulting in overlap between neighboring
   * patches.
   */
  set marginDimensions(value: GridDimensions|null) {
    this.Serializable$set('marginDimensions', value);
  }

  get maxMaskedRatio(): number|null {
    return (
        (this.Serializable$has('maxMaskedRatio')) ?
            (this.Serializable$get('maxMaskedRatio')) :
            (null));
  }

  /**
   * Maximum allowed proportion of masked pixels in a patch. Patches which
   * exceed this allowance will be dropped rather than written to files. If this
   * field is set to anything but 1, the JSON sidecar will not be produced.
   * Defaults to 1.
   */
  set maxMaskedRatio(value: number|null) {
    this.Serializable$set('maxMaskedRatio', value);
  }

  get maxSizeBytes(): string|null {
    return (
        (this.Serializable$has('maxSizeBytes')) ?
            (this.Serializable$get('maxSizeBytes')) :
            (null));
  }

  /**
   * Maximum size, in bytes, for an exported .tfrecord (before compression). A
   * smaller file size will result in greater sharding (and, thus, more output
   * files). Defaults to 1GiB.
   */
  set maxSizeBytes(value: string|null) {
    this.Serializable$set('maxSizeBytes', value);
  }

  get sequenceData(): boolean|null {
    return (
        (this.Serializable$has('sequenceData')) ?
            (this.Serializable$get('sequenceData')) :
            (null));
  }

  /**
   * If true, each pixel is output as a SequenceExample mapping scalar bands to
   * the context and array bands to the example’s sequences. The
   * SequenceExamples are output in row-major order of pixels in each patch, and
   * then by row-major order of area patches in the file sequence.
   */
  set sequenceData(value: boolean|null) {
    this.Serializable$set('sequenceData', value);
  }

  get tensorDepths(): ApiClientObjectMap<number>|null {
    return (
        (this.Serializable$has('tensorDepths')) ?
            (this.Serializable$get('tensorDepths')) :
            (null));
  }

  /**
   * Mapping from the names of input array bands to the depth of the 3D tensors
   * they create. Arrays will be truncated, or padded with default values to fit
   * the shape specified. For each array band, this must have a corresponding
   * entry.
   */
  set tensorDepths(value: ApiClientObjectMap<number>|null) {
    this.Serializable$set('tensorDepths', value);
  }

  get tileDimensions(): GridDimensions|null {
    return (
        (this.Serializable$has('tileDimensions')) ?
            (this.Serializable$get('tileDimensions')) :
            (null));
  }

  /**
   * Dimensions tiled over the export area, covering every pixel in the bounding
   * box exactly once (except when the patch dimensions do not evenly divide the
   * bounding box in which case border tiles along the greatest x/y edges will
   * be dropped). Dimensions must be > 0.
   */
  set tileDimensions(value: GridDimensions|null) {
    this.Serializable$set('tileDimensions', value);
  }

  getConstructor(): SerializableCtor<TfRecordImageExportOptions> {
    return TfRecordImageExportOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: [
        'collapseBands', 'compress', 'defaultValue', 'marginDimensions',
        'maxMaskedRatio', 'maxSizeBytes', 'sequenceData', 'tensorDepths',
        'tileDimensions'
      ],
      objectMaps: {
        'tensorDepths': {
          ctor: null,
          isPropertyArray: false,
          isSerializable: false,
          isValueArray: false
        }
      },
      objects:
          {'marginDimensions': GridDimensions, 'tileDimensions': GridDimensions}
    };
  }
}

export interface ThumbnailParameters {
  name?: string|null;
  expression?: Expression|null;
  fileFormat?: ThumbnailFileFormat|null;
  bandIds?: Array<string>|null;
  visualizationOptions?: VisualizationOptions|null;
  grid?: PixelGrid|null;
  filenamePrefix?: string|null;
}
export class Thumbnail extends Serializable {
  constructor(parameters: ThumbnailParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'bandIds',
        (parameters.bandIds == null) ? (null) : (parameters.bandIds));
    this.Serializable$set(
        'visualizationOptions',
        (parameters.visualizationOptions == null) ?
            (null) :
            (parameters.visualizationOptions));
    this.Serializable$set(
        'grid', (parameters.grid == null) ? (null) : (parameters.grid));
    this.Serializable$set(
        'filenamePrefix',
        (parameters.filenamePrefix == null) ? (null) :
                                              (parameters.filenamePrefix));
  }

  static get FileFormat(): IThumbnailFileFormatEnum {
    return ThumbnailFileFormatEnum;
  }

  get bandIds(): Array<string>|null {
    return (
        (this.Serializable$has('bandIds')) ?
            (this.Serializable$get('bandIds')) :
            (null));
  }

  /**
   * If present, specifies a specific set of bands that will be
   * selected from the result of evaluating `expression`. If not
   * present, all bands resulting from `expression` will be selected.
   */
  set bandIds(value: Array<string>|null) {
    this.Serializable$set('bandIds', value);
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * The expression to compute. Must evaluate to an Image.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get fileFormat(): ThumbnailFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The output encoding in which to generate the resulting image.
   */
  set fileFormat(value: ThumbnailFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get filenamePrefix(): string|null {
    return (
        (this.Serializable$has('filenamePrefix')) ?
            (this.Serializable$get('filenamePrefix')) :
            (null));
  }

  /**
   * Only used when file_format is ZIPPED_GEO_TIFF or ZIPPED_GEO_TIFF_PER_BAND.
   */
  set filenamePrefix(value: string|null) {
    this.Serializable$set('filenamePrefix', value);
  }

  get grid(): PixelGrid|null {
    return (
        (this.Serializable$has('grid')) ? (this.Serializable$get('grid')) :
                                          (null));
  }

  /**
   * An optional pixel grid describing how the image computed by
   * `expression` is reprojected and clipped.
   */
  set grid(value: PixelGrid|null) {
    this.Serializable$set('grid', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The resource name representing the thumbnail, of the form
   * \"projects/* /thumbnails/**\"
   * (e.g. \"projects/earthengine-legacy/thumbnails/<THUMBNAIL-ID>\").
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get visualizationOptions(): VisualizationOptions|null {
    return (
        (this.Serializable$has('visualizationOptions')) ?
            (this.Serializable$get('visualizationOptions')) :
            (null));
  }

  /**
   * If present, a set of visualization options to apply to produce an
   * 8-bit RGB visualization of the data.
   */
  set visualizationOptions(value: VisualizationOptions|null) {
    this.Serializable$set('visualizationOptions', value);
  }

  getConstructor(): SerializableCtor<Thumbnail> {
    return Thumbnail;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'fileFormat': ThumbnailFileFormatEnum},
      keys: [
        'bandIds', 'expression', 'fileFormat', 'filenamePrefix', 'grid', 'name',
        'visualizationOptions'
      ],
      objects: {
        'expression': Expression,
        'grid': PixelGrid,
        'visualizationOptions': VisualizationOptions
      }
    };
  }
}

export interface TileOptionsParameters {
  maxZoom?: number|null;
  scale?: number|null;
  minZoom?: number|null;
  skipEmptyTiles?: boolean|null;
  mapsApiKey?: string|null;
  tileDimensions?: GridDimensions|null;
  stride?: number|null;
  zoomSubset?: ZoomSubset|null;
}
export class TileOptions extends Serializable {
  constructor(parameters: TileOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'maxZoom',
        (parameters.maxZoom == null) ? (null) : (parameters.maxZoom));
    this.Serializable$set(
        'scale', (parameters.scale == null) ? (null) : (parameters.scale));
    this.Serializable$set(
        'minZoom',
        (parameters.minZoom == null) ? (null) : (parameters.minZoom));
    this.Serializable$set(
        'skipEmptyTiles',
        (parameters.skipEmptyTiles == null) ? (null) :
                                              (parameters.skipEmptyTiles));
    this.Serializable$set(
        'mapsApiKey',
        (parameters.mapsApiKey == null) ? (null) : (parameters.mapsApiKey));
    this.Serializable$set(
        'tileDimensions',
        (parameters.tileDimensions == null) ? (null) :
                                              (parameters.tileDimensions));
    this.Serializable$set(
        'stride', (parameters.stride == null) ? (null) : (parameters.stride));
    this.Serializable$set(
        'zoomSubset',
        (parameters.zoomSubset == null) ? (null) : (parameters.zoomSubset));
  }

  get mapsApiKey(): string|null {
    return (
        (this.Serializable$has('mapsApiKey')) ?
            (this.Serializable$get('mapsApiKey')) :
            (null));
  }

  /**
   * Optional Google Maps Platform API Key for generated map tile viewer.
   */
  set mapsApiKey(value: string|null) {
    this.Serializable$set('mapsApiKey', value);
  }

  get maxZoom(): number|null {
    return (
        (this.Serializable$has('maxZoom')) ?
            (this.Serializable$get('maxZoom')) :
            (null));
  }

  /**
   * The maximum zoom level of the map tiles to export.
   */
  set maxZoom(value: number|null) {
    this.Serializable$set('maxZoom', value);
  }

  get minZoom(): number|null {
    return (
        (this.Serializable$has('minZoom')) ?
            (this.Serializable$get('minZoom')) :
            (null));
  }

  /**
   * The minimum zoom level of the map tiles to export. Defaults to zero.
   */
  set minZoom(value: number|null) {
    this.Serializable$set('minZoom', value);
  }

  get scale(): number|null {
    return (
        (this.Serializable$has('scale')) ? (this.Serializable$get('scale')) :
                                           (null));
  }

  /**
   * The max image resolution in meters per pixel. The scale will be converted
   * to the most appropriate maximum zoom level at the equator.
   */
  set scale(value: number|null) {
    this.Serializable$set('scale', value);
  }

  get skipEmptyTiles(): boolean|null {
    return (
        (this.Serializable$has('skipEmptyTiles')) ?
            (this.Serializable$get('skipEmptyTiles')) :
            (null));
  }

  /**
   * If true, skip writing empty (i.e. fully-transparent) map tiles.
   */
  set skipEmptyTiles(value: boolean|null) {
    this.Serializable$set('skipEmptyTiles', value);
  }

  get stride(): number|null {
    return (
        (this.Serializable$has('stride')) ? (this.Serializable$get('stride')) :
                                            (null));
  }

  /**
   * Tile row and column stride. (ExportVideoMap)
   * Set to 4 for sparse tiles (WebGL-only) or 1 (default) for maximum
   * compatibility.
   */
  set stride(value: number|null) {
    this.Serializable$set('stride', value);
  }

  get tileDimensions(): GridDimensions|null {
    return (
        (this.Serializable$has('tileDimensions')) ?
            (this.Serializable$get('tileDimensions')) :
            (null));
  }

  /**
   * The width and height of output video tiles, used only for exporting tiled
   * video pyramids (ExportVideoMap).
   */
  set tileDimensions(value: GridDimensions|null) {
    this.Serializable$set('tileDimensions', value);
  }

  get zoomSubset(): ZoomSubset|null {
    return (
        (this.Serializable$has('zoomSubset')) ?
            (this.Serializable$get('zoomSubset')) :
            (null));
  }

  /**
   * A subset of zoom levels for which to generate tiles. May only be specified
   * in a call to `ExportVideoMap`.
   */
  set zoomSubset(value: ZoomSubset|null) {
    this.Serializable$set('zoomSubset', value);
  }

  getConstructor(): SerializableCtor<TileOptions> {
    return TileOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: [
        'mapsApiKey', 'maxZoom', 'minZoom', 'scale', 'skipEmptyTiles', 'stride',
        'tileDimensions', 'zoomSubset'
      ],
      objects: {'tileDimensions': GridDimensions, 'zoomSubset': ZoomSubset}
    };
  }
}

export interface TilesetParameters {
  id?: string|null;
  sources?: Array<ImageSource>|null;
  dataType?: TilesetDataType|null;
  crs?: string|null;
  subdatasetPrefix?: string|null;
  subdatasetSuffix?: string|null;
}
export class Tileset extends Serializable {
  constructor(parameters: TilesetParameters = {}) {
    super();
    this.Serializable$set(
        'id', (parameters.id == null) ? (null) : (parameters.id));
    this.Serializable$set(
        'sources',
        (parameters.sources == null) ? (null) : (parameters.sources));
    this.Serializable$set(
        'dataType',
        (parameters.dataType == null) ? (null) : (parameters.dataType));
    this.Serializable$set(
        'crs', (parameters.crs == null) ? (null) : (parameters.crs));
    this.Serializable$set(
        'subdatasetPrefix',
        (parameters.subdatasetPrefix == null) ? (null) :
                                                (parameters.subdatasetPrefix));
    this.Serializable$set(
        'subdatasetSuffix',
        (parameters.subdatasetSuffix == null) ? (null) :
                                                (parameters.subdatasetSuffix));
  }

  static get DataType(): ITilesetDataTypeEnum {
    return TilesetDataTypeEnum;
  }

  get crs(): string|null {
    return (
        (this.Serializable$has('crs')) ? (this.Serializable$get('crs')) :
                                         (null));
  }

  /**
   * The coordinate reference system of the pixel grid, specified as a
   * standard code where possible, and in WKT format otherwise.
   */
  set crs(value: string|null) {
    this.Serializable$set('crs', value);
  }

  get dataType(): TilesetDataType|null {
    return (
        (this.Serializable$has('dataType')) ?
            (this.Serializable$get('dataType')) :
            (null));
  }

  /**
   * An optional data type for the band. If specified, no check is done
   * to verify that the type of every input file matches.
   * `data_type` must match the type of every input file, except for cases
   * where the input type is ambiguous (e.g. `Byte` can be `INT8` or `UINT8`).
   */
  set dataType(value: TilesetDataType|null) {
    this.Serializable$set('dataType', value);
  }

  get id(): string|null {
    return (
        (this.Serializable$has('id')) ? (this.Serializable$get('id')) : (null));
  }

  /**
   * The ID of the tileset. Must be unique among tilesets specified in the
   * ImageManifest. This ID is discarded during the processing step; it is
   * only used to link a Tileset to a band. The empty string is a valid ID.
   */
  set id(value: string|null) {
    this.Serializable$set('id', value);
  }

  get sources(): Array<ImageSource>|null {
    return (
        (this.Serializable$has('sources')) ?
            (this.Serializable$get('sources')) :
            (null));
  }

  /**
   * The sources which comprise this tileset.
   */
  set sources(value: Array<ImageSource>|null) {
    this.Serializable$set('sources', value);
  }

  get subdatasetPrefix(): string|null {
    return (
        (this.Serializable$has('subdatasetPrefix')) ?
            (this.Serializable$get('subdatasetPrefix')) :
            (null));
  }

  /**
   * A string which is prepended to the source's primary filename. Needed by
   * GDAL to reference a subdataset of the source.
   */
  set subdatasetPrefix(value: string|null) {
    this.Serializable$set('subdatasetPrefix', value);
  }

  get subdatasetSuffix(): string|null {
    return (
        (this.Serializable$has('subdatasetSuffix')) ?
            (this.Serializable$get('subdatasetSuffix')) :
            (null));
  }

  /**
   * A string which is appended to the source's primary filename. Needed by GDAL
   * to reference a subdataset of the source.
   */
  set subdatasetSuffix(value: string|null) {
    this.Serializable$set('subdatasetSuffix', value);
  }

  getConstructor(): SerializableCtor<Tileset> {
    return Tileset;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'sources': ImageSource},
      enums: {'dataType': TilesetDataTypeEnum},
      keys: [
        'crs', 'dataType', 'id', 'sources', 'subdatasetPrefix',
        'subdatasetSuffix'
      ]
    };
  }
}

export interface TilesetBandParameters {
  id?: string|null;
  tilesetId?: string|null;
  tilesetBandIndex?: number|null;
  missingData?: MissingData|null;
  pyramidingPolicy?: TilesetBandPyramidingPolicy|null;
}
export class TilesetBand extends Serializable {
  constructor(parameters: TilesetBandParameters = {}) {
    super();
    this.Serializable$set(
        'id', (parameters.id == null) ? (null) : (parameters.id));
    this.Serializable$set(
        'tilesetId',
        (parameters.tilesetId == null) ? (null) : (parameters.tilesetId));
    this.Serializable$set(
        'tilesetBandIndex',
        (parameters.tilesetBandIndex == null) ? (null) :
                                                (parameters.tilesetBandIndex));
    this.Serializable$set(
        'missingData',
        (parameters.missingData == null) ? (null) : (parameters.missingData));
    this.Serializable$set(
        'pyramidingPolicy',
        (parameters.pyramidingPolicy == null) ? (null) :
                                                (parameters.pyramidingPolicy));
  }

  static get PyramidingPolicy(): ITilesetBandPyramidingPolicyEnum {
    return TilesetBandPyramidingPolicyEnum;
  }

  get id(): string|null {
    return (
        (this.Serializable$has('id')) ? (this.Serializable$get('id')) : (null));
  }

  /**
   * The ID of the band.
   */
  set id(value: string|null) {
    this.Serializable$set('id', value);
  }

  get missingData(): MissingData|null {
    return (
        (this.Serializable$has('missingData')) ?
            (this.Serializable$get('missingData')) :
            (null));
  }

  /**
   * The values which represent no data in the band.
   */
  set missingData(value: MissingData|null) {
    this.Serializable$set('missingData', value);
  }

  get pyramidingPolicy(): TilesetBandPyramidingPolicy|null {
    return (
        (this.Serializable$has('pyramidingPolicy')) ?
            (this.Serializable$get('pyramidingPolicy')) :
            (null));
  }

  /**
   * The pyramiding policy.
   */
  set pyramidingPolicy(value: TilesetBandPyramidingPolicy|null) {
    this.Serializable$set('pyramidingPolicy', value);
  }

  get tilesetBandIndex(): number|null {
    return (
        (this.Serializable$has('tilesetBandIndex')) ?
            (this.Serializable$get('tilesetBandIndex')) :
            (null));
  }

  /**
   * The zero-based band index from the tileset corresponding to the band.
   */
  set tilesetBandIndex(value: number|null) {
    this.Serializable$set('tilesetBandIndex', value);
  }

  get tilesetId(): string|null {
    return (
        (this.Serializable$has('tilesetId')) ?
            (this.Serializable$get('tilesetId')) :
            (null));
  }

  /**
   * The ID of the tileset corresponding to the band.
   */
  set tilesetId(value: string|null) {
    this.Serializable$set('tilesetId', value);
  }

  getConstructor(): SerializableCtor<TilesetBand> {
    return TilesetBand;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'pyramidingPolicy': TilesetBandPyramidingPolicyEnum},
      keys: [
        'id', 'missingData', 'pyramidingPolicy', 'tilesetBandIndex', 'tilesetId'
      ],
      objects: {'missingData': MissingData}
    };
  }
}

export interface TilesetMaskBandParameters {
  tilesetId?: string|null;
  bandIds?: Array<string>|null;
}
export class TilesetMaskBand extends Serializable {
  constructor(parameters: TilesetMaskBandParameters = {}) {
    super();
    this.Serializable$set(
        'tilesetId',
        (parameters.tilesetId == null) ? (null) : (parameters.tilesetId));
    this.Serializable$set(
        'bandIds',
        (parameters.bandIds == null) ? (null) : (parameters.bandIds));
  }

  get bandIds(): Array<string>|null {
    return (
        (this.Serializable$has('bandIds')) ?
            (this.Serializable$get('bandIds')) :
            (null));
  }

  /**
   * The IDs of bands that the mask band applies to. If empty, the mask band
   * is applied to all bands in the asset. Each band may only have one
   * corresponding mask band.
   */
  set bandIds(value: Array<string>|null) {
    this.Serializable$set('bandIds', value);
  }

  get tilesetId(): string|null {
    return (
        (this.Serializable$has('tilesetId')) ?
            (this.Serializable$get('tilesetId')) :
            (null));
  }

  /**
   * The ID of the Tileset corresponding to the mask band. The last band of the
   * Tileset is always used as the mask band.
   */
  set tilesetId(value: string|null) {
    this.Serializable$set('tilesetId', value);
  }

  getConstructor(): SerializableCtor<TilesetMaskBand> {
    return TilesetMaskBand;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['bandIds', 'tilesetId']};
  }
}

export interface TilestoreEntryParameters {
  sources?: Array<TilestoreSource>|null;
  pathPrefix?: string|null;
}
export class TilestoreEntry extends Serializable {
  constructor(parameters: TilestoreEntryParameters = {}) {
    super();
    this.Serializable$set(
        'sources',
        (parameters.sources == null) ? (null) : (parameters.sources));
    this.Serializable$set(
        'pathPrefix',
        (parameters.pathPrefix == null) ? (null) : (parameters.pathPrefix));
  }

  get pathPrefix(): string|null {
    return (
        (this.Serializable$has('pathPrefix')) ?
            (this.Serializable$get('pathPrefix')) :
            (null));
  }

  /**
   * Prepend this to each of path in tilestore_files to get a file path
   * relative to the tilestore root. Must end with a slash.
   */
  set pathPrefix(value: string|null) {
    this.Serializable$set('pathPrefix', value);
  }

  get sources(): Array<TilestoreSource>|null {
    return (
        (this.Serializable$has('sources')) ?
            (this.Serializable$get('sources')) :
            (null));
  }

  /**
   * Container for all EER tile information.
   */
  set sources(value: Array<TilestoreSource>|null) {
    this.Serializable$set('sources', value);
  }

  getConstructor(): SerializableCtor<TilestoreEntry> {
    return TilestoreEntry;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'sources': TilestoreSource},
      keys: ['pathPrefix', 'sources']
    };
  }
}

export interface TilestoreSourceParameters {
  pathSuffix?: string|null;
  headerSizeBytes?: number|null;
}
export class TilestoreSource extends Serializable {
  constructor(parameters: TilestoreSourceParameters = {}) {
    super();
    this.Serializable$set(
        'pathSuffix',
        (parameters.pathSuffix == null) ? (null) : (parameters.pathSuffix));
    this.Serializable$set(
        'headerSizeBytes',
        (parameters.headerSizeBytes == null) ? (null) :
                                               (parameters.headerSizeBytes));
  }

  get headerSizeBytes(): number|null {
    return (
        (this.Serializable$has('headerSizeBytes')) ?
            (this.Serializable$get('headerSizeBytes')) :
            (null));
  }

  /**
   * Size of the compressed header for the file.
   */
  set headerSizeBytes(value: number|null) {
    this.Serializable$set('headerSizeBytes', value);
  }

  get pathSuffix(): string|null {
    return (
        (this.Serializable$has('pathSuffix')) ?
            (this.Serializable$get('pathSuffix')) :
            (null));
  }

  /**
   * Path to a go/eeraster file (relative to the tilestore root)
   */
  set pathSuffix(value: string|null) {
    this.Serializable$set('pathSuffix', value);
  }

  getConstructor(): SerializableCtor<TilestoreSource> {
    return TilestoreSource;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['headerSizeBytes', 'pathSuffix']};
  }
}

export interface TilestoreTilesetParameters {
  fileIndexes?: Array<number>|null;
  firstTileIndex?: number|null;
  tilesPerFile?: number|null;
}
export class TilestoreTileset extends Serializable {
  constructor(parameters: TilestoreTilesetParameters = {}) {
    super();
    this.Serializable$set(
        'fileIndexes',
        (parameters.fileIndexes == null) ? (null) : (parameters.fileIndexes));
    this.Serializable$set(
        'firstTileIndex',
        (parameters.firstTileIndex == null) ? (null) :
                                              (parameters.firstTileIndex));
    this.Serializable$set(
        'tilesPerFile',
        (parameters.tilesPerFile == null) ? (null) : (parameters.tilesPerFile));
  }

  get fileIndexes(): Array<number>|null {
    return (
        (this.Serializable$has('fileIndexes')) ?
            (this.Serializable$get('fileIndexes')) :
            (null));
  }

  /**
   * Indexes into TilestoreEntry's raster_files array.
   */
  set fileIndexes(value: Array<number>|null) {
    this.Serializable$set('fileIndexes', value);
  }

  get firstTileIndex(): number|null {
    return (
        (this.Serializable$has('firstTileIndex')) ?
            (this.Serializable$get('firstTileIndex')) :
            (null));
  }

  /**
   * Set if there is only one file_index.
   */
  set firstTileIndex(value: number|null) {
    this.Serializable$set('firstTileIndex', value);
  }

  get tilesPerFile(): number|null {
    return (
        (this.Serializable$has('tilesPerFile')) ?
            (this.Serializable$get('tilesPerFile')) :
            (null));
  }

  /**
   * Set if there is more than one file_index.
   */
  set tilesPerFile(value: number|null) {
    this.Serializable$set('tilesPerFile', value);
  }

  getConstructor(): SerializableCtor<TilestoreTileset> {
    return TilestoreTileset;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['fileIndexes', 'firstTileIndex', 'tilesPerFile']};
  }
}

export interface UpdateAssetRequestParameters {
  asset?: EarthEngineAsset|null;
  updateMask?: string|null;
}
export class UpdateAssetRequest extends Serializable {
  constructor(parameters: UpdateAssetRequestParameters = {}) {
    super();
    this.Serializable$set(
        'asset', (parameters.asset == null) ? (null) : (parameters.asset));
    this.Serializable$set(
        'updateMask',
        (parameters.updateMask == null) ? (null) : (parameters.updateMask));
  }

  get asset(): EarthEngineAsset|null {
    return (
        (this.Serializable$has('asset')) ? (this.Serializable$get('asset')) :
                                           (null));
  }

  /**
   * The asset resource containing updated field values.
   */
  set asset(value: EarthEngineAsset|null) {
    this.Serializable$set('asset', value);
  }

  get updateMask(): string|null {
    return (
        (this.Serializable$has('updateMask')) ?
            (this.Serializable$get('updateMask')) :
            (null));
  }

  /**
   * The update mask specifying which fields of the asset to update.
   */
  set updateMask(value: string|null) {
    this.Serializable$set('updateMask', value);
  }

  getConstructor(): SerializableCtor<UpdateAssetRequest> {
    return UpdateAssetRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: ['asset', 'updateMask'],
      objects: {'asset': EarthEngineAsset}
    };
  }
}

export interface ValueNodeParameters {
  constantValue?: any|null;
  integerValue?: string|null;
  bytesValue?: string|null;
  arrayValue?: ArrayValue|null;
  dictionaryValue?: DictionaryValue|null;
  functionDefinitionValue?: FunctionDefinition|null;
  functionInvocationValue?: FunctionInvocation|null;
  argumentReference?: string|null;
  valueReference?: string|null;
}
export class ValueNode extends Serializable {
  constructor(parameters: ValueNodeParameters = {}) {
    super();
    this.Serializable$set(
        'constantValue',
        (parameters.constantValue == null) ? (null) :
                                             (parameters.constantValue));
    this.Serializable$set(
        'integerValue',
        (parameters.integerValue == null) ? (null) : (parameters.integerValue));
    this.Serializable$set(
        'bytesValue',
        (parameters.bytesValue == null) ? (null) : (parameters.bytesValue));
    this.Serializable$set(
        'arrayValue',
        (parameters.arrayValue == null) ? (null) : (parameters.arrayValue));
    this.Serializable$set(
        'dictionaryValue',
        (parameters.dictionaryValue == null) ? (null) :
                                               (parameters.dictionaryValue));
    this.Serializable$set(
        'functionDefinitionValue',
        (parameters.functionDefinitionValue == null) ?
            (null) :
            (parameters.functionDefinitionValue));
    this.Serializable$set(
        'functionInvocationValue',
        (parameters.functionInvocationValue == null) ?
            (null) :
            (parameters.functionInvocationValue));
    this.Serializable$set(
        'argumentReference',
        (parameters.argumentReference == null) ?
            (null) :
            (parameters.argumentReference));
    this.Serializable$set(
        'valueReference',
        (parameters.valueReference == null) ? (null) :
                                              (parameters.valueReference));
  }

  get argumentReference(): string|null {
    return (
        (this.Serializable$has('argumentReference')) ?
            (this.Serializable$get('argumentReference')) :
            (null));
  }

  /**
   * A reference to an argument of some enclosing FunctionDefinition. Only
   * valid inside the subgraph rooted at the \"body\" field of a
   * FunctionDefinition.
   */
  set argumentReference(value: string|null) {
    this.Serializable$set('argumentReference', value);
  }

  get arrayValue(): ArrayValue|null {
    return (
        (this.Serializable$has('arrayValue')) ?
            (this.Serializable$get('arrayValue')) :
            (null));
  }

  /**
   * An array of values.
   */
  set arrayValue(value: ArrayValue|null) {
    this.Serializable$set('arrayValue', value);
  }

  get bytesValue(): string|null {
    return (
        (this.Serializable$has('bytesValue')) ?
            (this.Serializable$get('bytesValue')) :
            (null));
  }

  /**
   * An opaque series of bytes.
   */
  set bytesValue(value: string|null) {
    this.Serializable$set('bytesValue', value);
  }

  get constantValue(): any|null {
    return (
        (this.Serializable$has('constantValue')) ?
            (this.Serializable$get('constantValue')) :
            (null));
  }

  /**
   * A constant value. This is allowed to be of arbitrary complexity
   * (i.e., may contain Structs and ListValues).
   */
  set constantValue(value: any|null) {
    this.Serializable$set('constantValue', value);
  }

  get dictionaryValue(): DictionaryValue|null {
    return (
        (this.Serializable$has('dictionaryValue')) ?
            (this.Serializable$get('dictionaryValue')) :
            (null));
  }

  /**
   * A dictionary of values.
   */
  set dictionaryValue(value: DictionaryValue|null) {
    this.Serializable$set('dictionaryValue', value);
  }

  get functionDefinitionValue(): FunctionDefinition|null {
    return (
        (this.Serializable$has('functionDefinitionValue')) ?
            (this.Serializable$get('functionDefinitionValue')) :
            (null));
  }

  /**
   * A function object.
   */
  set functionDefinitionValue(value: FunctionDefinition|null) {
    this.Serializable$set('functionDefinitionValue', value);
  }

  get functionInvocationValue(): FunctionInvocation|null {
    return (
        (this.Serializable$has('functionInvocationValue')) ?
            (this.Serializable$get('functionInvocationValue')) :
            (null));
  }

  /**
   * A function invocation.
   */
  set functionInvocationValue(value: FunctionInvocation|null) {
    this.Serializable$set('functionInvocationValue', value);
  }

  get integerValue(): string|null {
    return (
        (this.Serializable$has('integerValue')) ?
            (this.Serializable$get('integerValue')) :
            (null));
  }

  /**
   * An integer value.
   */
  set integerValue(value: string|null) {
    this.Serializable$set('integerValue', value);
  }

  get valueReference(): string|null {
    return (
        (this.Serializable$has('valueReference')) ?
            (this.Serializable$get('valueReference')) :
            (null));
  }

  /**
   * A reference to a named ValueNode, defined in the enclosing
   * Expression's \"values\" field.
   */
  set valueReference(value: string|null) {
    this.Serializable$set('valueReference', value);
  }

  getConstructor(): SerializableCtor<ValueNode> {
    return ValueNode;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      keys: [
        'argumentReference', 'arrayValue', 'bytesValue', 'constantValue',
        'dictionaryValue', 'functionDefinitionValue', 'functionInvocationValue',
        'integerValue', 'valueReference'
      ],
      objects: {
        'arrayValue': ArrayValue,
        'dictionaryValue': DictionaryValue,
        'functionDefinitionValue': FunctionDefinition,
        'functionInvocationValue': FunctionInvocation
      }
    };
  }
}

export interface VideoFileExportOptionsParameters {
  fileFormat?: VideoFileExportOptionsFileFormat|null;
  driveDestination?: DriveDestination|null;
  gcsDestination?: GcsDestination|null;
}
export class VideoFileExportOptions extends Serializable {
  constructor(parameters: VideoFileExportOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'driveDestination',
        (parameters.driveDestination == null) ? (null) :
                                                (parameters.driveDestination));
    this.Serializable$set(
        'gcsDestination',
        (parameters.gcsDestination == null) ? (null) :
                                              (parameters.gcsDestination));
  }

  static get FileFormat(): IVideoFileExportOptionsFileFormatEnum {
    return VideoFileExportOptionsFileFormatEnum;
  }

  get driveDestination(): DriveDestination|null {
    return (
        (this.Serializable$has('driveDestination')) ?
            (this.Serializable$get('driveDestination')) :
            (null));
  }

  /**
   * If specified, configures export to Google Drive.
   */
  set driveDestination(value: DriveDestination|null) {
    this.Serializable$set('driveDestination', value);
  }

  get fileFormat(): VideoFileExportOptionsFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The file format in which to export the video(s). Currently only
   * MP4 is supported.
   */
  set fileFormat(value: VideoFileExportOptionsFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get gcsDestination(): GcsDestination|null {
    return (
        (this.Serializable$has('gcsDestination')) ?
            (this.Serializable$get('gcsDestination')) :
            (null));
  }

  /**
   * If specified, configures export to Google Cloud Storage.
   */
  set gcsDestination(value: GcsDestination|null) {
    this.Serializable$set('gcsDestination', value);
  }

  getConstructor(): SerializableCtor<VideoFileExportOptions> {
    return VideoFileExportOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'fileFormat': VideoFileExportOptionsFileFormatEnum},
      keys: ['driveDestination', 'fileFormat', 'gcsDestination'],
      objects: {
        'driveDestination': DriveDestination,
        'gcsDestination': GcsDestination
      }
    };
  }
}

export interface VideoOptionsParameters {
  framesPerSecond?: number|null;
  maxFrames?: number|null;
  maxPixelsPerFrame?: string|null;
}
export class VideoOptions extends Serializable {
  constructor(parameters: VideoOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'framesPerSecond',
        (parameters.framesPerSecond == null) ? (null) :
                                               (parameters.framesPerSecond));
    this.Serializable$set(
        'maxFrames',
        (parameters.maxFrames == null) ? (null) : (parameters.maxFrames));
    this.Serializable$set(
        'maxPixelsPerFrame',
        (parameters.maxPixelsPerFrame == null) ?
            (null) :
            (parameters.maxPixelsPerFrame));
  }

  get framesPerSecond(): number|null {
    return (
        (this.Serializable$has('framesPerSecond')) ?
            (this.Serializable$get('framesPerSecond')) :
            (null));
  }

  /**
   * The frame rate of the exported video. Must be a value between 0.1 and 120.
   * Defaults to 5.0.
   */
  set framesPerSecond(value: number|null) {
    this.Serializable$set('framesPerSecond', value);
  }

  get maxFrames(): number|null {
    return (
        (this.Serializable$has('maxFrames')) ?
            (this.Serializable$get('maxFrames')) :
            (null));
  }

  /**
   * The maximum number of video frames to compute and export. This is a safety
   * guard to prevent you from accidentally starting a larger export than you
   * had intended. The default value is 1000 frames, but you can set the value
   * explicitly to raise or lower this limit.
   */
  set maxFrames(value: number|null) {
    this.Serializable$set('maxFrames', value);
  }

  get maxPixelsPerFrame(): string|null {
    return (
        (this.Serializable$has('maxPixelsPerFrame')) ?
            (this.Serializable$get('maxPixelsPerFrame')) :
            (null));
  }

  /**
   * The maximum number of pixels to compute and export per frame. This is a
   * safety guard to prevent you from accidentally starting a larger export than
   * you had intended. The default value is 1e8 pixels, but you can set the
   * value explicitly to raise or lower this limit.
   */
  set maxPixelsPerFrame(value: string|null) {
    this.Serializable$set('maxPixelsPerFrame', value);
  }

  getConstructor(): SerializableCtor<VideoOptions> {
    return VideoOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['framesPerSecond', 'maxFrames', 'maxPixelsPerFrame']};
  }
}

export interface VideoThumbnailParameters {
  name?: string|null;
  expression?: Expression|null;
  videoOptions?: VideoOptions|null;
  fileFormat?: VideoThumbnailFileFormat|null;
  grid?: PixelGrid|null;
}
export class VideoThumbnail extends Serializable {
  constructor(parameters: VideoThumbnailParameters = {}) {
    super();
    this.Serializable$set(
        'name', (parameters.name == null) ? (null) : (parameters.name));
    this.Serializable$set(
        'expression',
        (parameters.expression == null) ? (null) : (parameters.expression));
    this.Serializable$set(
        'videoOptions',
        (parameters.videoOptions == null) ? (null) : (parameters.videoOptions));
    this.Serializable$set(
        'fileFormat',
        (parameters.fileFormat == null) ? (null) : (parameters.fileFormat));
    this.Serializable$set(
        'grid', (parameters.grid == null) ? (null) : (parameters.grid));
  }

  static get FileFormat(): IVideoThumbnailFileFormatEnum {
    return VideoThumbnailFileFormatEnum;
  }

  get expression(): Expression|null {
    return (
        (this.Serializable$has('expression')) ?
            (this.Serializable$get('expression')) :
            (null));
  }

  /**
   * The expression to compute. Must evaluate to an ImageCollection.
   */
  set expression(value: Expression|null) {
    this.Serializable$set('expression', value);
  }

  get fileFormat(): VideoThumbnailFileFormat|null {
    return (
        (this.Serializable$has('fileFormat')) ?
            (this.Serializable$get('fileFormat')) :
            (null));
  }

  /**
   * The output encoding in which to generate the resulting video
   * thumbnail. Currently only GIF is supported.
   */
  set fileFormat(value: VideoThumbnailFileFormat|null) {
    this.Serializable$set('fileFormat', value);
  }

  get grid(): PixelGrid|null {
    return (
        (this.Serializable$has('grid')) ? (this.Serializable$get('grid')) :
                                          (null));
  }

  /**
   * An optional pixel grid describing how the images computed by
   * `expression` are reprojected and clipped.
   */
  set grid(value: PixelGrid|null) {
    this.Serializable$set('grid', value);
  }

  get name(): string|null {
    return (
        (this.Serializable$has('name')) ? (this.Serializable$get('name')) :
                                          (null));
  }

  /**
   * The resource name representing the video thumbnail, of the form
   * \"projects/* /videoThumbnails/**\"
   * (e.g. \"projects/earthengine-legacy/videoThumbnails/<THUMBNAIL-ID>\").
   */
  set name(value: string|null) {
    this.Serializable$set('name', value);
  }

  get videoOptions(): VideoOptions|null {
    return (
        (this.Serializable$has('videoOptions')) ?
            (this.Serializable$get('videoOptions')) :
            (null));
  }

  /**
   * Options for the animation.
   */
  set videoOptions(value: VideoOptions|null) {
    this.Serializable$set('videoOptions', value);
  }

  getConstructor(): SerializableCtor<VideoThumbnail> {
    return VideoThumbnail;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      enums: {'fileFormat': VideoThumbnailFileFormatEnum},
      keys: ['expression', 'fileFormat', 'grid', 'name', 'videoOptions'],
      objects: {
        'expression': Expression,
        'grid': PixelGrid,
        'videoOptions': VideoOptions
      }
    };
  }
}

export interface VisualizationOptionsParameters {
  ranges?: Array<DoubleRange>|null;
  paletteColors?: Array<string>|null;
  gamma?: number|null;
  opacity?: number|null;
}
export class VisualizationOptions extends Serializable {
  constructor(parameters: VisualizationOptionsParameters = {}) {
    super();
    this.Serializable$set(
        'ranges', (parameters.ranges == null) ? (null) : (parameters.ranges));
    this.Serializable$set(
        'paletteColors',
        (parameters.paletteColors == null) ? (null) :
                                             (parameters.paletteColors));
    this.Serializable$set(
        'gamma', (parameters.gamma == null) ? (null) : (parameters.gamma));
    this.Serializable$set(
        'opacity',
        (parameters.opacity == null) ? (null) : (parameters.opacity));
  }

  get gamma(): number|null {
    return (
        (this.Serializable$has('gamma')) ? (this.Serializable$get('gamma')) :
                                           (null));
  }

  /**
   * If present, specifies an overall gamma correction factor to apply to the
   * image.
   */
  set gamma(value: number|null) {
    this.Serializable$set('gamma', value);
  }

  get opacity(): number|null {
    return (
        (this.Serializable$has('opacity')) ?
            (this.Serializable$get('opacity')) :
            (null));
  }

  /**
   * If present, specifies an overall opacity factor to apply to the image, in
   * the range 0.0 to 1.0.
   */
  set opacity(value: number|null) {
    this.Serializable$set('opacity', value);
  }

  get paletteColors(): Array<string>|null {
    return (
        (this.Serializable$has('paletteColors')) ?
            (this.Serializable$get('paletteColors')) :
            (null));
  }

  /**
   * If present, specifies sequence of CSS-style RGB color identifiers to apply
   * as a color palette. Only allowed when visualizing a single data band.
   */
  set paletteColors(value: Array<string>|null) {
    this.Serializable$set('paletteColors', value);
  }

  get ranges(): Array<DoubleRange>|null {
    return (
        (this.Serializable$has('ranges')) ? (this.Serializable$get('ranges')) :
                                            (null));
  }

  /**
   * If present, specifies the range of data values to visualize. This range of
   * values will be mapped to 0-255 (black to white) in the resulting image, and
   * values outside this range will be clamped.  May specify as one range for
   * each band being visualized or else a single range to be applied to all
   * bands.
   */
  set ranges(value: Array<DoubleRange>|null) {
    this.Serializable$set('ranges', value);
  }

  getConstructor(): SerializableCtor<VisualizationOptions> {
    return VisualizationOptions;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {
      arrays: {'ranges': DoubleRange},
      keys: ['gamma', 'opacity', 'paletteColors', 'ranges']
    };
  }
}

export interface WaitOperationRequestParameters {
  timeout?: string|null;
}
export class WaitOperationRequest extends Serializable {
  constructor(parameters: WaitOperationRequestParameters = {}) {
    super();
    this.Serializable$set(
        'timeout',
        (parameters.timeout == null) ? (null) : (parameters.timeout));
  }

  get timeout(): string|null {
    return (
        (this.Serializable$has('timeout')) ?
            (this.Serializable$get('timeout')) :
            (null));
  }

  /**
   * The maximum duration to wait before timing out. If left blank, the wait
   * will be at most the time permitted by the underlying HTTP/RPC protocol.
   * If RPC context deadline is also specified, the shorter one will be used.
   */
  set timeout(value: string|null) {
    this.Serializable$set('timeout', value);
  }

  getConstructor(): SerializableCtor<WaitOperationRequest> {
    return WaitOperationRequest;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['timeout']};
  }
}

export interface ZoomSubsetParameters {
  min?: number|null;
  max?: number|null;
}
export class ZoomSubset extends Serializable {
  constructor(parameters: ZoomSubsetParameters = {}) {
    super();
    this.Serializable$set(
        'min', (parameters.min == null) ? (null) : (parameters.min));
    this.Serializable$set(
        'max', (parameters.max == null) ? (null) : (parameters.max));
  }

  get max(): number|null {
    return (
        (this.Serializable$has('max')) ? (this.Serializable$get('max')) :
                                         (null));
  }

  /**
   * Maximum zoom level subset for which to generate tiles (ExportVideoMap),
   * allowing you to render a zoom level incrementally, up to but not including
   * the maximum subset (if provided) in some unspecified but deterministic
   * order.
   */
  set max(value: number|null) {
    this.Serializable$set('max', value);
  }

  get min(): number|null {
    return (
        (this.Serializable$has('min')) ? (this.Serializable$get('min')) :
                                         (null));
  }

  /**
   * Minimum zoom level subset for which to generate tiles (ExportVideoMap)
   * Here, subset is a double precision value, allowing you to render a zoom
   * level incrementally, so 12.1 for example is the first 10% of the tiles in
   * zoom 12 in some unspecified but deterministic order.
   */
  set min(value: number|null) {
    this.Serializable$set('min', value);
  }

  getConstructor(): SerializableCtor<ZoomSubset> {
    return ZoomSubset;
  }

  getPartialClassMetadata(): Partial<ClassMetadata> {
    return {keys: ['max', 'min']};
  }
}
const PARAM_MAP_0 = {
  $Xgafv: '$.xgafv',
  access_token: 'access_token',
  alt: 'alt',
  assetId: 'assetId',
  callback: 'callback',
  endTime: 'endTime',
  fields: 'fields',
  filter: 'filter',
  key: 'key',
  oauth_token: 'oauth_token',
  overwrite: 'overwrite',
  pageSize: 'pageSize',
  pageToken: 'pageToken',
  prettyPrint: 'prettyPrint',
  quotaUser: 'quotaUser',
  region: 'region',
  startTime: 'startTime',
  uploadType: 'uploadType',
  upload_protocol: 'upload_protocol',
  view: 'view'
};

export type ProjectsAlgorithmsApiClient$Xgafv = '1'|'2';

export interface IProjectsAlgorithmsApiClient$XgafvEnum {
  readonly 1: ProjectsAlgorithmsApiClient$Xgafv;
  readonly 2: ProjectsAlgorithmsApiClient$Xgafv;

  values(): Array<ProjectsAlgorithmsApiClient$Xgafv>;
}

export const ProjectsAlgorithmsApiClient$XgafvEnum:
    IProjectsAlgorithmsApiClient$XgafvEnum = {
      1: <ProjectsAlgorithmsApiClient$Xgafv>'1',
      2: <ProjectsAlgorithmsApiClient$Xgafv>'2',
      values(): Array<ProjectsAlgorithmsApiClient$Xgafv> {
        return [
          ProjectsAlgorithmsApiClient$XgafvEnum[1],
          ProjectsAlgorithmsApiClient$XgafvEnum[2]
        ];
      }
    };

export type ProjectsAlgorithmsApiClientAlt = 'json'|'media'|'proto';

export interface IProjectsAlgorithmsApiClientAltEnum {
  readonly JSON: ProjectsAlgorithmsApiClientAlt;
  readonly MEDIA: ProjectsAlgorithmsApiClientAlt;
  readonly PROTO: ProjectsAlgorithmsApiClientAlt;

  values(): Array<ProjectsAlgorithmsApiClientAlt>;
}

export const ProjectsAlgorithmsApiClientAltEnum:
    IProjectsAlgorithmsApiClientAltEnum = {
      JSON: <ProjectsAlgorithmsApiClientAlt>'json',
      MEDIA: <ProjectsAlgorithmsApiClientAlt>'media',
      PROTO: <ProjectsAlgorithmsApiClientAlt>'proto',
      values(): Array<ProjectsAlgorithmsApiClientAlt> {
        return [
          ProjectsAlgorithmsApiClientAltEnum.JSON,
          ProjectsAlgorithmsApiClientAltEnum.MEDIA,
          ProjectsAlgorithmsApiClientAltEnum.PROTO
        ];
      }
    };

export declare interface ProjectsAlgorithmsListNamedParameters {
  access_token?: string;
  alt?: ProjectsAlgorithmsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAlgorithmsApiClient$Xgafv;
}

export class ProjectsAlgorithmsApiClientImpl implements
    ProjectsAlgorithmsApiClient {
  private $apiClient: PromiseApiClient;

  constructor(
      private gapiVersion: string, gapiRequestService: PromiseRequestService,
      apiClientHookFactory: ApiClientHookFactory|null = null) {
    this.$apiClient =
        new PromiseApiClient(gapiRequestService, apiClientHookFactory);
  }

  list(
      project: string,
      namedParameters: ProjectsAlgorithmsListNamedParameters&
      object = {}): Promise<ListAlgorithmsResponse> {
    this.$apiClient.$validateParameter(project, new RegExp('^projects/[^/]+$'));
    let $requestBody = <Serializable|null>null;

    return this.$apiClient.$request<ListAlgorithmsResponse>({
      body: $requestBody,
      httpMethod: 'GET',
      methodId: 'earthengine.projects.algorithms.list',
      path: `/${this.gapiVersion}/${project}/algorithms`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: ListAlgorithmsResponse
    });
  }
}

export abstract class ProjectsAlgorithmsApiClient {
  constructor() {}

  abstract list(
      project: string,
      namedParameters?: ProjectsAlgorithmsListNamedParameters&
      object): Promise<ListAlgorithmsResponse>;
}

export type ProjectsApiClient$Xgafv = '1'|'2';

export interface IProjectsApiClient$XgafvEnum {
  readonly 1: ProjectsApiClient$Xgafv;
  readonly 2: ProjectsApiClient$Xgafv;

  values(): Array<ProjectsApiClient$Xgafv>;
}

export const ProjectsApiClient$XgafvEnum: IProjectsApiClient$XgafvEnum = {
  1: <ProjectsApiClient$Xgafv>'1',
  2: <ProjectsApiClient$Xgafv>'2',
  values(): Array<ProjectsApiClient$Xgafv> {
    return [ProjectsApiClient$XgafvEnum[1], ProjectsApiClient$XgafvEnum[2]];
  }
};

export type ProjectsApiClientAlt = 'json'|'media'|'proto';

export interface IProjectsApiClientAltEnum {
  readonly JSON: ProjectsApiClientAlt;
  readonly MEDIA: ProjectsApiClientAlt;
  readonly PROTO: ProjectsApiClientAlt;

  values(): Array<ProjectsApiClientAlt>;
}

export const ProjectsApiClientAltEnum: IProjectsApiClientAltEnum = {
  JSON: <ProjectsApiClientAlt>'json',
  MEDIA: <ProjectsApiClientAlt>'media',
  PROTO: <ProjectsApiClientAlt>'proto',
  values(): Array<ProjectsApiClientAlt> {
    return [
      ProjectsApiClientAltEnum.JSON, ProjectsApiClientAltEnum.MEDIA,
      ProjectsApiClientAltEnum.PROTO
    ];
  }
};

export declare interface ProjectsGetCapabilitiesNamedParameters {
  access_token?: string;
  alt?: ProjectsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsApiClient$Xgafv;
}

export declare interface ProjectsListAssetsNamedParameters {
  access_token?: string;
  alt?: ProjectsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsApiClient$Xgafv;
  pageSize?: number;
  pageToken?: string;
}

export class ProjectsApiClientImpl implements ProjectsApiClient {
  private $apiClient: PromiseApiClient;

  constructor(
      private gapiVersion: string, gapiRequestService: PromiseRequestService,
      apiClientHookFactory: ApiClientHookFactory|null = null) {
    this.$apiClient =
        new PromiseApiClient(gapiRequestService, apiClientHookFactory);
  }

  getCapabilities(
      parent: string,
      namedParameters: ProjectsGetCapabilitiesNamedParameters&
      object = {}): Promise<Capabilities> {
    this.$apiClient.$validateParameter(parent, new RegExp('^projects/[^/]+$'));
    let $requestBody = <Serializable|null>null;

    return this.$apiClient.$request<Capabilities>({
      body: $requestBody,
      httpMethod: 'GET',
      methodId: 'earthengine.projects.getCapabilities',
      path: `/${this.gapiVersion}/${parent}/capabilities`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: Capabilities
    });
  }

  listAssets(
      parent: string,
      namedParameters: ProjectsListAssetsNamedParameters&
      object = {}): Promise<ListAssetsResponse> {
    this.$apiClient.$validateParameter(parent, new RegExp('^projects/[^/]+$'));
    let $requestBody = <Serializable|null>null;

    return this.$apiClient.$request<ListAssetsResponse>({
      body: $requestBody,
      httpMethod: 'GET',
      methodId: 'earthengine.projects.listAssets',
      path: `/${this.gapiVersion}/${parent}:listAssets`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: ListAssetsResponse
    });
  }
}

export abstract class ProjectsApiClient {
  constructor() {}

  abstract getCapabilities(
      parent: string,
      namedParameters?: ProjectsGetCapabilitiesNamedParameters&
      object): Promise<Capabilities>;

  abstract listAssets(
      parent: string,
      namedParameters?: ProjectsListAssetsNamedParameters&
      object): Promise<ListAssetsResponse>;
}

export type ProjectsAssetsApiClient$Xgafv = '1'|'2';

export interface IProjectsAssetsApiClient$XgafvEnum {
  readonly 1: ProjectsAssetsApiClient$Xgafv;
  readonly 2: ProjectsAssetsApiClient$Xgafv;

  values(): Array<ProjectsAssetsApiClient$Xgafv>;
}

export const ProjectsAssetsApiClient$XgafvEnum:
    IProjectsAssetsApiClient$XgafvEnum = {
      1: <ProjectsAssetsApiClient$Xgafv>'1',
      2: <ProjectsAssetsApiClient$Xgafv>'2',
      values(): Array<ProjectsAssetsApiClient$Xgafv> {
        return [
          ProjectsAssetsApiClient$XgafvEnum[1],
          ProjectsAssetsApiClient$XgafvEnum[2]
        ];
      }
    };

export type ProjectsAssetsApiClientAlt = 'json'|'media'|'proto';

export interface IProjectsAssetsApiClientAltEnum {
  readonly JSON: ProjectsAssetsApiClientAlt;
  readonly MEDIA: ProjectsAssetsApiClientAlt;
  readonly PROTO: ProjectsAssetsApiClientAlt;

  values(): Array<ProjectsAssetsApiClientAlt>;
}

export const ProjectsAssetsApiClientAltEnum: IProjectsAssetsApiClientAltEnum = {
  JSON: <ProjectsAssetsApiClientAlt>'json',
  MEDIA: <ProjectsAssetsApiClientAlt>'media',
  PROTO: <ProjectsAssetsApiClientAlt>'proto',
  values(): Array<ProjectsAssetsApiClientAlt> {
    return [
      ProjectsAssetsApiClientAltEnum.JSON, ProjectsAssetsApiClientAltEnum.MEDIA,
      ProjectsAssetsApiClientAltEnum.PROTO
    ];
  }
};

export type ProjectsAssetsApiClientView =
    'IMAGE_VIEW_UNSPECIFIED'|'FULL'|'BASIC';

export interface IProjectsAssetsApiClientViewEnum {
  readonly IMAGE_VIEW_UNSPECIFIED: ProjectsAssetsApiClientView;
  readonly FULL: ProjectsAssetsApiClientView;
  readonly BASIC: ProjectsAssetsApiClientView;

  values(): Array<ProjectsAssetsApiClientView>;
}

export const ProjectsAssetsApiClientViewEnum:
    IProjectsAssetsApiClientViewEnum = {
      BASIC: <ProjectsAssetsApiClientView>'BASIC',
      FULL: <ProjectsAssetsApiClientView>'FULL',
      IMAGE_VIEW_UNSPECIFIED:
          <ProjectsAssetsApiClientView>'IMAGE_VIEW_UNSPECIFIED',
      values(): Array<ProjectsAssetsApiClientView> {
        return [
          ProjectsAssetsApiClientViewEnum.IMAGE_VIEW_UNSPECIFIED,
          ProjectsAssetsApiClientViewEnum.FULL,
          ProjectsAssetsApiClientViewEnum.BASIC
        ];
      }
    };

export declare interface ProjectsAssetsCopyNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export declare interface ProjectsAssetsCreateNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
  assetId?: string;
  overwrite?: boolean;
}

export declare interface ProjectsAssetsDeleteNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export declare interface ProjectsAssetsGetIamPolicyNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export declare interface ProjectsAssetsGetNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export declare interface ProjectsAssetsGetPixelsNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export declare interface ProjectsAssetsLinkNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export declare interface ProjectsAssetsListAssetsNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
  pageSize?: number;
  pageToken?: string;
}

export declare interface ProjectsAssetsListFeaturesNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
  pageSize?: number;
  pageToken?: string;
  region?: string;
  filter?: string;
}

export declare interface ProjectsAssetsListImagesNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
  pageSize?: number;
  pageToken?: string;
  startTime?: string;
  endTime?: string;
  region?: string;
  filter?: string;
  view?: ProjectsAssetsApiClientView;
}

export declare interface ProjectsAssetsMoveNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export declare interface ProjectsAssetsPatchNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export declare interface ProjectsAssetsSetIamPolicyNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export declare interface ProjectsAssetsTestIamPermissionsNamedParameters {
  access_token?: string;
  alt?: ProjectsAssetsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsAssetsApiClient$Xgafv;
}

export class ProjectsAssetsApiClientImpl implements ProjectsAssetsApiClient {
  private $apiClient: PromiseApiClient;

  constructor(
      private gapiVersion: string, gapiRequestService: PromiseRequestService,
      apiClientHookFactory: ApiClientHookFactory|null = null) {
    this.$apiClient =
        new PromiseApiClient(gapiRequestService, apiClientHookFactory);
  }

  copy(
      sourceName: string, $requestBody: CopyAssetRequest,
      namedParameters: ProjectsAssetsCopyNamedParameters&
      object = {}): Promise<EarthEngineAsset> {
    this.$apiClient.$validateParameter(
        sourceName, new RegExp('^projects/[^/]+/assets/.*$'));

    return this.$apiClient.$request<EarthEngineAsset>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.assets.copy',
      path: `/${this.gapiVersion}/${sourceName}:copy`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: EarthEngineAsset
    });
  }

  create(
      parent: string, $requestBody: EarthEngineAsset,
      namedParameters: ProjectsAssetsCreateNamedParameters&
      object = {}): Promise<EarthEngineAsset> {
    this.$apiClient.$validateParameter(parent, new RegExp('^projects/[^/]+$'));

    return this.$apiClient.$request<EarthEngineAsset>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.assets.create',
      path: `/${this.gapiVersion}/${parent}/assets`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: EarthEngineAsset
    });
  }

  delete(
      name: string,
      namedParameters: ProjectsAssetsDeleteNamedParameters&
      object = {}): Promise<Empty> {
    this.$apiClient.$validateParameter(
        name, new RegExp('^projects/[^/]+/assets/.*$'));
    let $requestBody = <Serializable|null>null;

    return this.$apiClient.$request<Empty>({
      body: $requestBody,
      httpMethod: 'DELETE',
      methodId: 'earthengine.projects.assets.delete',
      path: `/${this.gapiVersion}/${name}`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: Empty
    });
  }

  get(name: string,
      namedParameters: ProjectsAssetsGetNamedParameters&
      object = {}): Promise<EarthEngineAsset> {
    this.$apiClient.$validateParameter(
        name, new RegExp('^projects/[^/]+/assets/.*$'));
    let $requestBody = <Serializable|null>null;

    return this.$apiClient.$request<EarthEngineAsset>({
      body: $requestBody,
      httpMethod: 'GET',
      methodId: 'earthengine.projects.assets.get',
      path: `/${this.gapiVersion}/${name}`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: EarthEngineAsset
    });
  }

  getIamPolicy(
      resource: string, $requestBody: GetIamPolicyRequest,
      namedParameters: ProjectsAssetsGetIamPolicyNamedParameters&
      object = {}): Promise<Policy> {
    this.$apiClient.$validateParameter(
        resource, new RegExp('^projects/[^/]+/assets/.*$'));

    return this.$apiClient.$request<Policy>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.assets.getIamPolicy',
      path: `/${this.gapiVersion}/${resource}:getIamPolicy`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: Policy
    });
  }

  getPixels(
      name: string, $requestBody: GetPixelsRequest,
      namedParameters: ProjectsAssetsGetPixelsNamedParameters&
      object = {}): Promise<HttpBody> {
    this.$apiClient.$validateParameter(
        name, new RegExp('^projects/[^/]+/assets/.*$'));

    return this.$apiClient.$request<HttpBody>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.assets.getPixels',
      path: `/${this.gapiVersion}/${name}:getPixels`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: HttpBody
    });
  }

  link(
      sourceName: string, $requestBody: LinkAssetRequest,
      namedParameters: ProjectsAssetsLinkNamedParameters&
      object = {}): Promise<EarthEngineAsset> {
    this.$apiClient.$validateParameter(
        sourceName, new RegExp('^projects/[^/]+/assets/.*$'));

    return this.$apiClient.$request<EarthEngineAsset>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.assets.link',
      path: `/${this.gapiVersion}/${sourceName}:link`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: EarthEngineAsset
    });
  }

  listAssets(
      parent: string,
      namedParameters: ProjectsAssetsListAssetsNamedParameters&
      object = {}): Promise<ListAssetsResponse> {
    this.$apiClient.$validateParameter(
        parent, new RegExp('^projects/[^/]+/assets/.*$'));
    let $requestBody = <Serializable|null>null;

    return this.$apiClient.$request<ListAssetsResponse>({
      body: $requestBody,
      httpMethod: 'GET',
      methodId: 'earthengine.projects.assets.listAssets',
      path: `/${this.gapiVersion}/${parent}:listAssets`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: ListAssetsResponse
    });
  }

  listFeatures(
      parent: string,
      namedParameters: ProjectsAssetsListFeaturesNamedParameters&
      object = {}): Promise<ListFeaturesResponse> {
    this.$apiClient.$validateParameter(
        parent, new RegExp('^projects/[^/]+/assets/.*$'));
    let $requestBody = <Serializable|null>null;

    return this.$apiClient.$request<ListFeaturesResponse>({
      body: $requestBody,
      httpMethod: 'GET',
      methodId: 'earthengine.projects.assets.listFeatures',
      path: `/${this.gapiVersion}/${parent}:listFeatures`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: ListFeaturesResponse
    });
  }

  listImages(
      parent: string,
      namedParameters: ProjectsAssetsListImagesNamedParameters&
      object = {}): Promise<ListImagesResponse> {
    this.$apiClient.$validateParameter(
        parent, new RegExp('^projects/[^/]+/assets/.*$'));
    let $requestBody = <Serializable|null>null;

    return this.$apiClient.$request<ListImagesResponse>({
      body: $requestBody,
      httpMethod: 'GET',
      methodId: 'earthengine.projects.assets.listImages',
      path: `/${this.gapiVersion}/${parent}:listImages`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: ListImagesResponse
    });
  }

  move(
      sourceName: string, $requestBody: MoveAssetRequest,
      namedParameters: ProjectsAssetsMoveNamedParameters&
      object = {}): Promise<EarthEngineAsset> {
    this.$apiClient.$validateParameter(
        sourceName, new RegExp('^projects/[^/]+/assets/.*$'));

    return this.$apiClient.$request<EarthEngineAsset>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.assets.move',
      path: `/${this.gapiVersion}/${sourceName}:move`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: EarthEngineAsset
    });
  }

  patch(
      name: string, $requestBody: UpdateAssetRequest,
      namedParameters: ProjectsAssetsPatchNamedParameters&
      object = {}): Promise<EarthEngineAsset> {
    this.$apiClient.$validateParameter(
        name, new RegExp('^projects/[^/]+/assets/.*$'));

    return this.$apiClient.$request<EarthEngineAsset>({
      body: $requestBody,
      httpMethod: 'PATCH',
      methodId: 'earthengine.projects.assets.patch',
      path: `/${this.gapiVersion}/${name}`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: EarthEngineAsset
    });
  }

  setIamPolicy(
      resource: string, $requestBody: SetIamPolicyRequest,
      namedParameters: ProjectsAssetsSetIamPolicyNamedParameters&
      object = {}): Promise<Policy> {
    this.$apiClient.$validateParameter(
        resource, new RegExp('^projects/[^/]+/assets/.*$'));

    return this.$apiClient.$request<Policy>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.assets.setIamPolicy',
      path: `/${this.gapiVersion}/${resource}:setIamPolicy`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: Policy
    });
  }

  testIamPermissions(
      resource: string, $requestBody: TestIamPermissionsRequest,
      namedParameters: ProjectsAssetsTestIamPermissionsNamedParameters&
      object = {}): Promise<TestIamPermissionsResponse> {
    this.$apiClient.$validateParameter(
        resource, new RegExp('^projects/[^/]+/assets/.*$'));

    return this.$apiClient.$request<TestIamPermissionsResponse>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.assets.testIamPermissions',
      path: `/${this.gapiVersion}/${resource}:testIamPermissions`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: TestIamPermissionsResponse
    });
  }
}

export abstract class ProjectsAssetsApiClient {
  constructor() {}

  abstract copy(
      sourceName: string, $requestBody: CopyAssetRequest,
      namedParameters?: ProjectsAssetsCopyNamedParameters&
      object): Promise<EarthEngineAsset>;

  abstract create(
      parent: string, $requestBody: EarthEngineAsset,
      namedParameters?: ProjectsAssetsCreateNamedParameters&
      object): Promise<EarthEngineAsset>;

  abstract delete(
      name: string,
      namedParameters?: ProjectsAssetsDeleteNamedParameters&
      object): Promise<Empty>;

  abstract get(
      name: string, namedParameters?: ProjectsAssetsGetNamedParameters&object):
      Promise<EarthEngineAsset>;

  abstract getIamPolicy(
      resource: string, $requestBody: GetIamPolicyRequest,
      namedParameters?: ProjectsAssetsGetIamPolicyNamedParameters&
      object): Promise<Policy>;

  abstract getPixels(
      name: string, $requestBody: GetPixelsRequest,
      namedParameters?: ProjectsAssetsGetPixelsNamedParameters&
      object): Promise<HttpBody>;

  abstract link(
      sourceName: string, $requestBody: LinkAssetRequest,
      namedParameters?: ProjectsAssetsLinkNamedParameters&
      object): Promise<EarthEngineAsset>;

  abstract listAssets(
      parent: string,
      namedParameters?: ProjectsAssetsListAssetsNamedParameters&
      object): Promise<ListAssetsResponse>;

  abstract listFeatures(
      parent: string,
      namedParameters?: ProjectsAssetsListFeaturesNamedParameters&
      object): Promise<ListFeaturesResponse>;

  abstract listImages(
      parent: string,
      namedParameters?: ProjectsAssetsListImagesNamedParameters&
      object): Promise<ListImagesResponse>;

  abstract move(
      sourceName: string, $requestBody: MoveAssetRequest,
      namedParameters?: ProjectsAssetsMoveNamedParameters&
      object): Promise<EarthEngineAsset>;

  abstract patch(
      name: string, $requestBody: UpdateAssetRequest,
      namedParameters?: ProjectsAssetsPatchNamedParameters&
      object): Promise<EarthEngineAsset>;

  abstract setIamPolicy(
      resource: string, $requestBody: SetIamPolicyRequest,
      namedParameters?: ProjectsAssetsSetIamPolicyNamedParameters&
      object): Promise<Policy>;

  abstract testIamPermissions(
      resource: string, $requestBody: TestIamPermissionsRequest,
      namedParameters?: ProjectsAssetsTestIamPermissionsNamedParameters&
      object): Promise<TestIamPermissionsResponse>;
}

export type ProjectsFilmstripThumbnailsApiClient$Xgafv = '1'|'2';

export interface IProjectsFilmstripThumbnailsApiClient$XgafvEnum {
  readonly 1: ProjectsFilmstripThumbnailsApiClient$Xgafv;
  readonly 2: ProjectsFilmstripThumbnailsApiClient$Xgafv;

  values(): Array<ProjectsFilmstripThumbnailsApiClient$Xgafv>;
}

export const ProjectsFilmstripThumbnailsApiClient$XgafvEnum:
    IProjectsFilmstripThumbnailsApiClient$XgafvEnum = {
      1: <ProjectsFilmstripThumbnailsApiClient$Xgafv>'1',
      2: <ProjectsFilmstripThumbnailsApiClient$Xgafv>'2',
      values(): Array<ProjectsFilmstripThumbnailsApiClient$Xgafv> {
        return [
          ProjectsFilmstripThumbnailsApiClient$XgafvEnum[1],
          ProjectsFilmstripThumbnailsApiClient$XgafvEnum[2]
        ];
      }
    };

export type ProjectsFilmstripThumbnailsApiClientAlt = 'json'|'media'|'proto';

export interface IProjectsFilmstripThumbnailsApiClientAltEnum {
  readonly JSON: ProjectsFilmstripThumbnailsApiClientAlt;
  readonly MEDIA: ProjectsFilmstripThumbnailsApiClientAlt;
  readonly PROTO: ProjectsFilmstripThumbnailsApiClientAlt;

  values(): Array<ProjectsFilmstripThumbnailsApiClientAlt>;
}

export const ProjectsFilmstripThumbnailsApiClientAltEnum:
    IProjectsFilmstripThumbnailsApiClientAltEnum = {
      JSON: <ProjectsFilmstripThumbnailsApiClientAlt>'json',
      MEDIA: <ProjectsFilmstripThumbnailsApiClientAlt>'media',
      PROTO: <ProjectsFilmstripThumbnailsApiClientAlt>'proto',
      values(): Array<ProjectsFilmstripThumbnailsApiClientAlt> {
        return [
          ProjectsFilmstripThumbnailsApiClientAltEnum.JSON,
          ProjectsFilmstripThumbnailsApiClientAltEnum.MEDIA,
          ProjectsFilmstripThumbnailsApiClientAltEnum.PROTO
        ];
      }
    };

export declare interface ProjectsFilmstripThumbnailsCreateNamedParameters {
  access_token?: string;
  alt?: ProjectsFilmstripThumbnailsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsFilmstripThumbnailsApiClient$Xgafv;
}

export declare interface ProjectsFilmstripThumbnailsGetPixelsNamedParameters {
  access_token?: string;
  alt?: ProjectsFilmstripThumbnailsApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsFilmstripThumbnailsApiClient$Xgafv;
}

export class ProjectsFilmstripThumbnailsApiClientImpl implements
    ProjectsFilmstripThumbnailsApiClient {
  private $apiClient: PromiseApiClient;

  constructor(
      private gapiVersion: string, gapiRequestService: PromiseRequestService,
      apiClientHookFactory: ApiClientHookFactory|null = null) {
    this.$apiClient =
        new PromiseApiClient(gapiRequestService, apiClientHookFactory);
  }

  create(
      parent: string, $requestBody: FilmstripThumbnail,
      namedParameters: ProjectsFilmstripThumbnailsCreateNamedParameters&
      object = {}): Promise<FilmstripThumbnail> {
    this.$apiClient.$validateParameter(parent, new RegExp('^projects/[^/]+$'));

    return this.$apiClient.$request<FilmstripThumbnail>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.filmstripThumbnails.create',
      path: `/${this.gapiVersion}/${parent}/filmstripThumbnails`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: FilmstripThumbnail
    });
  }

  getPixels(
      name: string,
      namedParameters: ProjectsFilmstripThumbnailsGetPixelsNamedParameters&
      object = {}): Promise<HttpBody> {
    this.$apiClient.$validateParameter(
        name, new RegExp('^projects/[^/]+/filmstripThumbnails/[^/]+$'));
    let $requestBody = <Serializable|null>null;

    return this.$apiClient.$request<HttpBody>({
      body: $requestBody,
      httpMethod: 'GET',
      methodId: 'earthengine.projects.filmstripThumbnails.getPixels',
      path: `/${this.gapiVersion}/${name}:getPixels`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: HttpBody
    });
  }
}

export abstract class ProjectsFilmstripThumbnailsApiClient {
  constructor() {}

  abstract create(
      parent: string, $requestBody: FilmstripThumbnail,
      namedParameters?: ProjectsFilmstripThumbnailsCreateNamedParameters&
      object): Promise<FilmstripThumbnail>;

  abstract getPixels(
      name: string,
      namedParameters?: ProjectsFilmstripThumbnailsGetPixelsNamedParameters&
      object): Promise<HttpBody>;
}

export type ProjectsImageApiClient$Xgafv = '1'|'2';

export interface IProjectsImageApiClient$XgafvEnum {
  readonly 1: ProjectsImageApiClient$Xgafv;
  readonly 2: ProjectsImageApiClient$Xgafv;

  values(): Array<ProjectsImageApiClient$Xgafv>;
}

export const ProjectsImageApiClient$XgafvEnum:
    IProjectsImageApiClient$XgafvEnum = {
      1: <ProjectsImageApiClient$Xgafv>'1',
      2: <ProjectsImageApiClient$Xgafv>'2',
      values(): Array<ProjectsImageApiClient$Xgafv> {
        return [
          ProjectsImageApiClient$XgafvEnum[1],
          ProjectsImageApiClient$XgafvEnum[2]
        ];
      }
    };

export type ProjectsImageApiClientAlt = 'json'|'media'|'proto';

export interface IProjectsImageApiClientAltEnum {
  readonly JSON: ProjectsImageApiClientAlt;
  readonly MEDIA: ProjectsImageApiClientAlt;
  readonly PROTO: ProjectsImageApiClientAlt;

  values(): Array<ProjectsImageApiClientAlt>;
}

export const ProjectsImageApiClientAltEnum: IProjectsImageApiClientAltEnum = {
  JSON: <ProjectsImageApiClientAlt>'json',
  MEDIA: <ProjectsImageApiClientAlt>'media',
  PROTO: <ProjectsImageApiClientAlt>'proto',
  values(): Array<ProjectsImageApiClientAlt> {
    return [
      ProjectsImageApiClientAltEnum.JSON, ProjectsImageApiClientAltEnum.MEDIA,
      ProjectsImageApiClientAltEnum.PROTO
    ];
  }
};

export declare interface ProjectsImageComputePixelsNamedParameters {
  access_token?: string;
  alt?: ProjectsImageApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsImageApiClient$Xgafv;
}

export declare interface ProjectsImageExportNamedParameters {
  access_token?: string;
  alt?: ProjectsImageApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsImageApiClient$Xgafv;
}

export declare interface ProjectsImageImportNamedParameters {
  access_token?: string;
  alt?: ProjectsImageApiClientAlt;
  callback?: string;
  fields?: string;
  key?: string;
  oauth_token?: string;
  prettyPrint?: boolean;
  quotaUser?: string;
  upload_protocol?: string;
  uploadType?: string;
  $Xgafv?: ProjectsImageApiClient$Xgafv;
}

export class ProjectsImageApiClientImpl implements ProjectsImageApiClient {
  private $apiClient: PromiseApiClient;

  constructor(
      private gapiVersion: string, gapiRequestService: PromiseRequestService,
      apiClientHookFactory: ApiClientHookFactory|null = null) {
    this.$apiClient =
        new PromiseApiClient(gapiRequestService, apiClientHookFactory);
  }

  computePixels(
      project: string, $requestBody: ComputePixelsRequest,
      namedParameters: ProjectsImageComputePixelsNamedParameters&
      object = {}): Promise<HttpBody> {
    this.$apiClient.$validateParameter(project, new RegExp('^projects/[^/]+$'));

    return this.$apiClient.$request<HttpBody>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.image.computePixels',
      path: `/${this.gapiVersion}/${project}/image:computePixels`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: HttpBody
    });
  }

  export(
      project: string, $requestBody: ExportImageRequest,
      namedParameters: ProjectsImageExportNamedParameters&
      object = {}): Promise<Operation> {
    this.$apiClient.$validateParameter(project, new RegExp('^projects/[^/]+$'));

    return this.$apiClient.$request<Operation>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.image.export',
      path: `/${this.gapiVersion}/${project}/image:export`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: Operation
    });
  }

  import(
      project: string,
      $requestBody: ImportImageRequest,
      namedParameters: ProjectsImageImportNamedParameters&object = {}): Promise<Operation> {
    this.$apiClient.$validateParameter(project, new RegExp('^projects/[^/]+$'));

    return this.$apiClient.$request<Operation>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.image.import',
      path: `/${this.gapiVersion}/${project}/image:import`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: Operation
    });
  }
}

export abstract class ProjectsImageApiClient {
  constructor() {
  }

  abstract computePixels(
      project: string,
      $requestBody: ComputePixelsRequest,
      namedParameters?: ProjectsImageComputePixelsNamedParameters&object): Promise<HttpBody>;

  abstract export(
      project: string,
      $requestBody: ExportImageRequest,
      namedParameters?: ProjectsImageExportNamedParameters&object): Promise<Operation>;

  abstract import(
      project: string,
      $requestBody: ImportImageRequest,
      namedParameters?: ProjectsImageImportNamedParameters&object): Promise<Operation>;
}

export type ProjectsImageCollectionApiClient$Xgafv = '1' | '2';

  export interface IProjectsImageCollectionApiClient$XgafvEnum {
    readonly 1: ProjectsImageCollectionApiClient$Xgafv;
    readonly 2: ProjectsImageCollectionApiClient$Xgafv;

    values(): Array<ProjectsImageCollectionApiClient$Xgafv>;
  }

  export const ProjectsImageCollectionApiClient$XgafvEnum:
      IProjectsImageCollectionApiClient$XgafvEnum = {
        1: <ProjectsImageCollectionApiClient$Xgafv>'1',
        2: <ProjectsImageCollectionApiClient$Xgafv>'2',
        values():
            Array<ProjectsImageCollectionApiClient$Xgafv> {
              return [
                ProjectsImageCollectionApiClient$XgafvEnum[1],
                ProjectsImageCollectionApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsImageCollectionApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsImageCollectionApiClientAltEnum {
    readonly JSON: ProjectsImageCollectionApiClientAlt;
    readonly MEDIA: ProjectsImageCollectionApiClientAlt;
    readonly PROTO: ProjectsImageCollectionApiClientAlt;

    values(): Array<ProjectsImageCollectionApiClientAlt>;
  }

  export const ProjectsImageCollectionApiClientAltEnum:
      IProjectsImageCollectionApiClientAltEnum = {
        JSON: <ProjectsImageCollectionApiClientAlt>'json',
        MEDIA: <ProjectsImageCollectionApiClientAlt>'media',
        PROTO: <ProjectsImageCollectionApiClientAlt>'proto',
        values():
            Array<ProjectsImageCollectionApiClientAlt> {
              return [
                ProjectsImageCollectionApiClientAltEnum.JSON,
                ProjectsImageCollectionApiClientAltEnum.MEDIA,
                ProjectsImageCollectionApiClientAltEnum.PROTO
              ];
            }
      };

  export declare interface ProjectsImageCollectionComputeImagesNamedParameters {
    access_token?: string;
    alt?: ProjectsImageCollectionApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsImageCollectionApiClient$Xgafv;
  }

  export class ProjectsImageCollectionApiClientImpl implements
      ProjectsImageCollectionApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    computeImages(
        project: string, $requestBody: ComputeImagesRequest,
        namedParameters: ProjectsImageCollectionComputeImagesNamedParameters&
        object = {}): Promise<ComputeImagesResponse> {
      this.$apiClient.$validateParameter(
          project, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<ComputeImagesResponse>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.imageCollection.computeImages',
        path: `/${this.gapiVersion}/${project}/imageCollection:computeImages`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: ComputeImagesResponse
      });
    }
  }

  export abstract class ProjectsImageCollectionApiClient {
    constructor() {}

    abstract computeImages(
        project: string, $requestBody: ComputeImagesRequest,
        namedParameters?: ProjectsImageCollectionComputeImagesNamedParameters&
        object): Promise<ComputeImagesResponse>;
  }

  export type ProjectsMapApiClient$Xgafv = '1'|'2';

  export interface IProjectsMapApiClient$XgafvEnum {
    readonly 1: ProjectsMapApiClient$Xgafv;
    readonly 2: ProjectsMapApiClient$Xgafv;

    values(): Array<ProjectsMapApiClient$Xgafv>;
  }

  export const ProjectsMapApiClient$XgafvEnum:
      IProjectsMapApiClient$XgafvEnum = {
        1: <ProjectsMapApiClient$Xgafv>'1',
        2: <ProjectsMapApiClient$Xgafv>'2',
        values():
            Array<ProjectsMapApiClient$Xgafv> {
              return [
                ProjectsMapApiClient$XgafvEnum[1],
                ProjectsMapApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsMapApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsMapApiClientAltEnum {
    readonly JSON: ProjectsMapApiClientAlt;
    readonly MEDIA: ProjectsMapApiClientAlt;
    readonly PROTO: ProjectsMapApiClientAlt;

    values(): Array<ProjectsMapApiClientAlt>;
  }

  export const ProjectsMapApiClientAltEnum: IProjectsMapApiClientAltEnum = {
    JSON: <ProjectsMapApiClientAlt>'json',
    MEDIA: <ProjectsMapApiClientAlt>'media',
    PROTO: <ProjectsMapApiClientAlt>'proto',
    values():
        Array<ProjectsMapApiClientAlt> {
          return [
            ProjectsMapApiClientAltEnum.JSON, ProjectsMapApiClientAltEnum.MEDIA,
            ProjectsMapApiClientAltEnum.PROTO
          ];
        }
  };

  export declare interface ProjectsMapExportNamedParameters {
    access_token?: string;
    alt?: ProjectsMapApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsMapApiClient$Xgafv;
  }

  export class ProjectsMapApiClientImpl implements ProjectsMapApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    export(
        project: string, $requestBody: ExportMapRequest,
        namedParameters: ProjectsMapExportNamedParameters&
        object = {}): Promise<Operation> {
      this.$apiClient.$validateParameter(
          project, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<Operation>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.map.export',
        path: `/${this.gapiVersion}/${project}/map:export`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Operation
      });
    }
  }

  export abstract class ProjectsMapApiClient {
    constructor() {}

    abstract export(
        project: string, $requestBody: ExportMapRequest,
        namedParameters?: ProjectsMapExportNamedParameters&
        object): Promise<Operation>;
  }

  export type ProjectsMapsApiClient$Xgafv = '1'|'2';

  export interface IProjectsMapsApiClient$XgafvEnum {
    readonly 1: ProjectsMapsApiClient$Xgafv;
    readonly 2: ProjectsMapsApiClient$Xgafv;

    values(): Array<ProjectsMapsApiClient$Xgafv>;
  }

  export const ProjectsMapsApiClient$XgafvEnum:
      IProjectsMapsApiClient$XgafvEnum = {
        1: <ProjectsMapsApiClient$Xgafv>'1',
        2: <ProjectsMapsApiClient$Xgafv>'2',
        values():
            Array<ProjectsMapsApiClient$Xgafv> {
              return [
                ProjectsMapsApiClient$XgafvEnum[1],
                ProjectsMapsApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsMapsApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsMapsApiClientAltEnum {
    readonly JSON: ProjectsMapsApiClientAlt;
    readonly MEDIA: ProjectsMapsApiClientAlt;
    readonly PROTO: ProjectsMapsApiClientAlt;

    values(): Array<ProjectsMapsApiClientAlt>;
  }

  export const ProjectsMapsApiClientAltEnum: IProjectsMapsApiClientAltEnum = {
    JSON: <ProjectsMapsApiClientAlt>'json',
    MEDIA: <ProjectsMapsApiClientAlt>'media',
    PROTO: <ProjectsMapsApiClientAlt>'proto',
    values():
        Array<ProjectsMapsApiClientAlt> {
          return [
            ProjectsMapsApiClientAltEnum.JSON,
            ProjectsMapsApiClientAltEnum.MEDIA,
            ProjectsMapsApiClientAltEnum.PROTO
          ];
        }
  };

  export declare interface ProjectsMapsCreateNamedParameters {
    access_token?: string;
    alt?: ProjectsMapsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsMapsApiClient$Xgafv;
  }

  export class ProjectsMapsApiClientImpl implements ProjectsMapsApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    create(
        parent: string, $requestBody: EarthEngineMap,
        namedParameters: ProjectsMapsCreateNamedParameters&
        object = {}): Promise<EarthEngineMap> {
      this.$apiClient.$validateParameter(
          parent, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<EarthEngineMap>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.maps.create',
        path: `/${this.gapiVersion}/${parent}/maps`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: EarthEngineMap
      });
    }
  }

  export abstract class ProjectsMapsApiClient {
    constructor() {}

    abstract create(
        parent: string, $requestBody: EarthEngineMap,
        namedParameters?: ProjectsMapsCreateNamedParameters&
        object): Promise<EarthEngineMap>;
  }

  export type ProjectsMapsTilesApiClient$Xgafv = '1'|'2';

  export interface IProjectsMapsTilesApiClient$XgafvEnum {
    readonly 1: ProjectsMapsTilesApiClient$Xgafv;
    readonly 2: ProjectsMapsTilesApiClient$Xgafv;

    values(): Array<ProjectsMapsTilesApiClient$Xgafv>;
  }

  export const ProjectsMapsTilesApiClient$XgafvEnum:
      IProjectsMapsTilesApiClient$XgafvEnum = {
        1: <ProjectsMapsTilesApiClient$Xgafv>'1',
        2: <ProjectsMapsTilesApiClient$Xgafv>'2',
        values():
            Array<ProjectsMapsTilesApiClient$Xgafv> {
              return [
                ProjectsMapsTilesApiClient$XgafvEnum[1],
                ProjectsMapsTilesApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsMapsTilesApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsMapsTilesApiClientAltEnum {
    readonly JSON: ProjectsMapsTilesApiClientAlt;
    readonly MEDIA: ProjectsMapsTilesApiClientAlt;
    readonly PROTO: ProjectsMapsTilesApiClientAlt;

    values(): Array<ProjectsMapsTilesApiClientAlt>;
  }

  export const ProjectsMapsTilesApiClientAltEnum:
      IProjectsMapsTilesApiClientAltEnum = {
        JSON: <ProjectsMapsTilesApiClientAlt>'json',
        MEDIA: <ProjectsMapsTilesApiClientAlt>'media',
        PROTO: <ProjectsMapsTilesApiClientAlt>'proto',
        values():
            Array<ProjectsMapsTilesApiClientAlt> {
              return [
                ProjectsMapsTilesApiClientAltEnum.JSON,
                ProjectsMapsTilesApiClientAltEnum.MEDIA,
                ProjectsMapsTilesApiClientAltEnum.PROTO
              ];
            }
      };

  export declare interface ProjectsMapsTilesGetNamedParameters {
    access_token?: string;
    alt?: ProjectsMapsTilesApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsMapsTilesApiClient$Xgafv;
  }

  export class ProjectsMapsTilesApiClientImpl implements
      ProjectsMapsTilesApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    get(parent: string, zoom: number, x: number, y: number,
        namedParameters: ProjectsMapsTilesGetNamedParameters&
        object = {}): Promise<HttpBody> {
      this.$apiClient.$validateParameter(
          parent, new RegExp('^projects/[^/]+/maps/[^/]+$'));
      let $requestBody = <Serializable|null>null;

      return this.$apiClient.$request<HttpBody>({
        body: $requestBody,
        httpMethod: 'GET',
        methodId: 'earthengine.projects.maps.tiles.get',
        path: `/${this.gapiVersion}/${parent}/tiles/${zoom}/${x}/${y}`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: HttpBody
      });
    }
  }

  export abstract class ProjectsMapsTilesApiClient {
    constructor() {}

    abstract get(
        parent: string, zoom: number, x: number, y: number,
        namedParameters?: ProjectsMapsTilesGetNamedParameters&
        object): Promise<HttpBody>;
  }

  export type ProjectsOperationsApiClient$Xgafv = '1'|'2';

  export interface IProjectsOperationsApiClient$XgafvEnum {
    readonly 1: ProjectsOperationsApiClient$Xgafv;
    readonly 2: ProjectsOperationsApiClient$Xgafv;

    values(): Array<ProjectsOperationsApiClient$Xgafv>;
  }

  export const ProjectsOperationsApiClient$XgafvEnum:
      IProjectsOperationsApiClient$XgafvEnum = {
        1: <ProjectsOperationsApiClient$Xgafv>'1',
        2: <ProjectsOperationsApiClient$Xgafv>'2',
        values():
            Array<ProjectsOperationsApiClient$Xgafv> {
              return [
                ProjectsOperationsApiClient$XgafvEnum[1],
                ProjectsOperationsApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsOperationsApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsOperationsApiClientAltEnum {
    readonly JSON: ProjectsOperationsApiClientAlt;
    readonly MEDIA: ProjectsOperationsApiClientAlt;
    readonly PROTO: ProjectsOperationsApiClientAlt;

    values(): Array<ProjectsOperationsApiClientAlt>;
  }

  export const ProjectsOperationsApiClientAltEnum:
      IProjectsOperationsApiClientAltEnum = {
        JSON: <ProjectsOperationsApiClientAlt>'json',
        MEDIA: <ProjectsOperationsApiClientAlt>'media',
        PROTO: <ProjectsOperationsApiClientAlt>'proto',
        values():
            Array<ProjectsOperationsApiClientAlt> {
              return [
                ProjectsOperationsApiClientAltEnum.JSON,
                ProjectsOperationsApiClientAltEnum.MEDIA,
                ProjectsOperationsApiClientAltEnum.PROTO
              ];
            }
      };

  export declare interface ProjectsOperationsCancelNamedParameters {
    access_token?: string;
    alt?: ProjectsOperationsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsOperationsApiClient$Xgafv;
  }

  export declare interface ProjectsOperationsDeleteNamedParameters {
    access_token?: string;
    alt?: ProjectsOperationsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsOperationsApiClient$Xgafv;
  }

  export declare interface ProjectsOperationsGetNamedParameters {
    access_token?: string;
    alt?: ProjectsOperationsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsOperationsApiClient$Xgafv;
  }

  export declare interface ProjectsOperationsListNamedParameters {
    access_token?: string;
    alt?: ProjectsOperationsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsOperationsApiClient$Xgafv;
    filter?: string;
    pageSize?: number;
    pageToken?: string;
  }

  export declare interface ProjectsOperationsWaitNamedParameters {
    access_token?: string;
    alt?: ProjectsOperationsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsOperationsApiClient$Xgafv;
  }

  export class ProjectsOperationsApiClientImpl implements
      ProjectsOperationsApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    cancel(
        name: string, $requestBody: CancelOperationRequest,
        namedParameters: ProjectsOperationsCancelNamedParameters&
        object = {}): Promise<Empty> {
      this.$apiClient.$validateParameter(
          name, new RegExp('^projects/[^/]+/operations/.*$'));

      return this.$apiClient.$request<Empty>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.operations.cancel',
        path: `/${this.gapiVersion}/${name}:cancel`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Empty
      });
    }

    delete(
        name: string,
        namedParameters: ProjectsOperationsDeleteNamedParameters&
        object = {}): Promise<Empty> {
      this.$apiClient.$validateParameter(
          name, new RegExp('^projects/[^/]+/operations/.*$'));
      let $requestBody = <Serializable|null>null;

      return this.$apiClient.$request<Empty>({
        body: $requestBody,
        httpMethod: 'DELETE',
        methodId: 'earthengine.projects.operations.delete',
        path: `/${this.gapiVersion}/${name}`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Empty
      });
    }

    get(name: string,
        namedParameters: ProjectsOperationsGetNamedParameters&
        object = {}): Promise<Operation> {
      this.$apiClient.$validateParameter(
          name, new RegExp('^projects/[^/]+/operations/.*$'));
      let $requestBody = <Serializable|null>null;

      return this.$apiClient.$request<Operation>({
        body: $requestBody,
        httpMethod: 'GET',
        methodId: 'earthengine.projects.operations.get',
        path: `/${this.gapiVersion}/${name}`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Operation
      });
    }

    list(
        name: string,
        namedParameters: ProjectsOperationsListNamedParameters&
        object = {}): Promise<ListOperationsResponse> {
      this.$apiClient.$validateParameter(name, new RegExp('^projects/[^/]+$'));
      let $requestBody = <Serializable|null>null;

      return this.$apiClient.$request<ListOperationsResponse>({
        body: $requestBody,
        httpMethod: 'GET',
        methodId: 'earthengine.projects.operations.list',
        path: `/${this.gapiVersion}/${name}/operations`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: ListOperationsResponse
      });
    }

    wait(
        name: string, $requestBody: WaitOperationRequest,
        namedParameters: ProjectsOperationsWaitNamedParameters&
        object = {}): Promise<Operation> {
      this.$apiClient.$validateParameter(
          name, new RegExp('^projects/[^/]+/operations/.*$'));

      return this.$apiClient.$request<Operation>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.operations.wait',
        path: `/${this.gapiVersion}/${name}:wait`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Operation
      });
    }
  }

  export abstract class ProjectsOperationsApiClient {
    constructor() {}

    abstract cancel(
        name: string, $requestBody: CancelOperationRequest,
        namedParameters?: ProjectsOperationsCancelNamedParameters&
        object): Promise<Empty>;

    abstract delete(
        name: string,
        namedParameters?: ProjectsOperationsDeleteNamedParameters&
        object): Promise<Empty>;

    abstract get(
        name: string,
        namedParameters?: ProjectsOperationsGetNamedParameters&
        object): Promise<Operation>;

    abstract list(
        name: string,
        namedParameters?: ProjectsOperationsListNamedParameters&
        object): Promise<ListOperationsResponse>;

    abstract wait(
        name: string, $requestBody: WaitOperationRequest,
        namedParameters?: ProjectsOperationsWaitNamedParameters&
        object): Promise<Operation>;
  }

  export type ProjectsTableApiClient$Xgafv = '1'|'2';

  export interface IProjectsTableApiClient$XgafvEnum {
    readonly 1: ProjectsTableApiClient$Xgafv;
    readonly 2: ProjectsTableApiClient$Xgafv;

    values(): Array<ProjectsTableApiClient$Xgafv>;
  }

  export const ProjectsTableApiClient$XgafvEnum:
      IProjectsTableApiClient$XgafvEnum = {
        1: <ProjectsTableApiClient$Xgafv>'1',
        2: <ProjectsTableApiClient$Xgafv>'2',
        values():
            Array<ProjectsTableApiClient$Xgafv> {
              return [
                ProjectsTableApiClient$XgafvEnum[1],
                ProjectsTableApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsTableApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsTableApiClientAltEnum {
    readonly JSON: ProjectsTableApiClientAlt;
    readonly MEDIA: ProjectsTableApiClientAlt;
    readonly PROTO: ProjectsTableApiClientAlt;

    values(): Array<ProjectsTableApiClientAlt>;
  }

  export const ProjectsTableApiClientAltEnum: IProjectsTableApiClientAltEnum = {
    JSON: <ProjectsTableApiClientAlt>'json',
    MEDIA: <ProjectsTableApiClientAlt>'media',
    PROTO: <ProjectsTableApiClientAlt>'proto',
    values():
        Array<ProjectsTableApiClientAlt> {
          return [
            ProjectsTableApiClientAltEnum.JSON,
            ProjectsTableApiClientAltEnum.MEDIA,
            ProjectsTableApiClientAltEnum.PROTO
          ];
        }
  };

  export declare interface ProjectsTableComputeFeaturesNamedParameters {
    access_token?: string;
    alt?: ProjectsTableApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsTableApiClient$Xgafv;
  }

  export declare interface ProjectsTableExportNamedParameters {
    access_token?: string;
    alt?: ProjectsTableApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsTableApiClient$Xgafv;
  }

  export declare interface ProjectsTableImportNamedParameters {
    access_token?: string;
    alt?: ProjectsTableApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsTableApiClient$Xgafv;
  }

  export class ProjectsTableApiClientImpl implements ProjectsTableApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    computeFeatures(
        project: string, $requestBody: ComputeFeaturesRequest,
        namedParameters: ProjectsTableComputeFeaturesNamedParameters&
        object = {}): Promise<ComputeFeaturesResponse> {
      this.$apiClient.$validateParameter(
          project, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<ComputeFeaturesResponse>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.table.computeFeatures',
        path: `/${this.gapiVersion}/${project}/table:computeFeatures`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: ComputeFeaturesResponse
      });
    }

    export(
        project: string, $requestBody: ExportTableRequest,
        namedParameters: ProjectsTableExportNamedParameters&
        object = {}): Promise<Operation> {
      this.$apiClient.$validateParameter(
          project, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<Operation>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.table.export',
        path: `/${this.gapiVersion}/${project}/table:export`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Operation
      });
    }

  import(
      project: string,
      $requestBody: ImportTableRequest,
      namedParameters: ProjectsTableImportNamedParameters&object = {}): Promise<Operation> {
    this.$apiClient.$validateParameter(project, new RegExp('^projects/[^/]+$'));

    return this.$apiClient.$request<Operation>({
      body: $requestBody,
      httpMethod: 'POST',
      methodId: 'earthengine.projects.table.import',
      path: `/${this.gapiVersion}/${project}/table:import`,
      queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
      responseCtor: Operation
    });
  }
}

export abstract class ProjectsTableApiClient {
  constructor() {
  }

  abstract computeFeatures(
      project: string,
      $requestBody: ComputeFeaturesRequest,
      namedParameters?: ProjectsTableComputeFeaturesNamedParameters&object): Promise<ComputeFeaturesResponse>;

  abstract export(
      project: string,
      $requestBody: ExportTableRequest,
      namedParameters?: ProjectsTableExportNamedParameters&object): Promise<Operation>;

  abstract import(
      project: string,
      $requestBody: ImportTableRequest,
      namedParameters?: ProjectsTableImportNamedParameters&object): Promise<Operation>;
}

export type ProjectsTablesApiClient$Xgafv = '1' | '2';

  export interface IProjectsTablesApiClient$XgafvEnum {
    readonly 1: ProjectsTablesApiClient$Xgafv;
    readonly 2: ProjectsTablesApiClient$Xgafv;

    values(): Array<ProjectsTablesApiClient$Xgafv>;
  }

  export const ProjectsTablesApiClient$XgafvEnum:
      IProjectsTablesApiClient$XgafvEnum = {
        1: <ProjectsTablesApiClient$Xgafv>'1',
        2: <ProjectsTablesApiClient$Xgafv>'2',
        values():
            Array<ProjectsTablesApiClient$Xgafv> {
              return [
                ProjectsTablesApiClient$XgafvEnum[1],
                ProjectsTablesApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsTablesApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsTablesApiClientAltEnum {
    readonly JSON: ProjectsTablesApiClientAlt;
    readonly MEDIA: ProjectsTablesApiClientAlt;
    readonly PROTO: ProjectsTablesApiClientAlt;

    values(): Array<ProjectsTablesApiClientAlt>;
  }

  export const ProjectsTablesApiClientAltEnum:
      IProjectsTablesApiClientAltEnum = {
        JSON: <ProjectsTablesApiClientAlt>'json',
        MEDIA: <ProjectsTablesApiClientAlt>'media',
        PROTO: <ProjectsTablesApiClientAlt>'proto',
        values():
            Array<ProjectsTablesApiClientAlt> {
              return [
                ProjectsTablesApiClientAltEnum.JSON,
                ProjectsTablesApiClientAltEnum.MEDIA,
                ProjectsTablesApiClientAltEnum.PROTO
              ];
            }
      };

  export declare interface ProjectsTablesCreateNamedParameters {
    access_token?: string;
    alt?: ProjectsTablesApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsTablesApiClient$Xgafv;
  }

  export declare interface ProjectsTablesGetFeaturesNamedParameters {
    access_token?: string;
    alt?: ProjectsTablesApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsTablesApiClient$Xgafv;
  }

  export class ProjectsTablesApiClientImpl implements ProjectsTablesApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    create(
        parent: string, $requestBody: Table,
        namedParameters: ProjectsTablesCreateNamedParameters&
        object = {}): Promise<Table> {
      this.$apiClient.$validateParameter(
          parent, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<Table>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.tables.create',
        path: `/${this.gapiVersion}/${parent}/tables`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Table
      });
    }

    getFeatures(
        name: string,
        namedParameters: ProjectsTablesGetFeaturesNamedParameters&
        object = {}): Promise<HttpBody> {
      this.$apiClient.$validateParameter(
          name, new RegExp('^projects/[^/]+/tables/[^/]+$'));
      let $requestBody = <Serializable|null>null;

      return this.$apiClient.$request<HttpBody>({
        body: $requestBody,
        httpMethod: 'GET',
        methodId: 'earthengine.projects.tables.getFeatures',
        path: `/${this.gapiVersion}/${name}:getFeatures`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: HttpBody
      });
    }
  }

  export abstract class ProjectsTablesApiClient {
    constructor() {}

    abstract create(
        parent: string, $requestBody: Table,
        namedParameters?: ProjectsTablesCreateNamedParameters&
        object): Promise<Table>;

    abstract getFeatures(
        name: string,
        namedParameters?: ProjectsTablesGetFeaturesNamedParameters&
        object): Promise<HttpBody>;
  }

  export type ProjectsThumbnailsApiClient$Xgafv = '1'|'2';

  export interface IProjectsThumbnailsApiClient$XgafvEnum {
    readonly 1: ProjectsThumbnailsApiClient$Xgafv;
    readonly 2: ProjectsThumbnailsApiClient$Xgafv;

    values(): Array<ProjectsThumbnailsApiClient$Xgafv>;
  }

  export const ProjectsThumbnailsApiClient$XgafvEnum:
      IProjectsThumbnailsApiClient$XgafvEnum = {
        1: <ProjectsThumbnailsApiClient$Xgafv>'1',
        2: <ProjectsThumbnailsApiClient$Xgafv>'2',
        values():
            Array<ProjectsThumbnailsApiClient$Xgafv> {
              return [
                ProjectsThumbnailsApiClient$XgafvEnum[1],
                ProjectsThumbnailsApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsThumbnailsApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsThumbnailsApiClientAltEnum {
    readonly JSON: ProjectsThumbnailsApiClientAlt;
    readonly MEDIA: ProjectsThumbnailsApiClientAlt;
    readonly PROTO: ProjectsThumbnailsApiClientAlt;

    values(): Array<ProjectsThumbnailsApiClientAlt>;
  }

  export const ProjectsThumbnailsApiClientAltEnum:
      IProjectsThumbnailsApiClientAltEnum = {
        JSON: <ProjectsThumbnailsApiClientAlt>'json',
        MEDIA: <ProjectsThumbnailsApiClientAlt>'media',
        PROTO: <ProjectsThumbnailsApiClientAlt>'proto',
        values():
            Array<ProjectsThumbnailsApiClientAlt> {
              return [
                ProjectsThumbnailsApiClientAltEnum.JSON,
                ProjectsThumbnailsApiClientAltEnum.MEDIA,
                ProjectsThumbnailsApiClientAltEnum.PROTO
              ];
            }
      };

  export declare interface ProjectsThumbnailsCreateNamedParameters {
    access_token?: string;
    alt?: ProjectsThumbnailsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsThumbnailsApiClient$Xgafv;
  }

  export declare interface ProjectsThumbnailsGetPixelsNamedParameters {
    access_token?: string;
    alt?: ProjectsThumbnailsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsThumbnailsApiClient$Xgafv;
  }

  export class ProjectsThumbnailsApiClientImpl implements
      ProjectsThumbnailsApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    create(
        parent: string, $requestBody: Thumbnail,
        namedParameters: ProjectsThumbnailsCreateNamedParameters&
        object = {}): Promise<Thumbnail> {
      this.$apiClient.$validateParameter(
          parent, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<Thumbnail>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.thumbnails.create',
        path: `/${this.gapiVersion}/${parent}/thumbnails`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Thumbnail
      });
    }

    getPixels(
        name: string,
        namedParameters: ProjectsThumbnailsGetPixelsNamedParameters&
        object = {}): Promise<HttpBody> {
      this.$apiClient.$validateParameter(
          name, new RegExp('^projects/[^/]+/thumbnails/[^/]+$'));
      let $requestBody = <Serializable|null>null;

      return this.$apiClient.$request<HttpBody>({
        body: $requestBody,
        httpMethod: 'GET',
        methodId: 'earthengine.projects.thumbnails.getPixels',
        path: `/${this.gapiVersion}/${name}:getPixels`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: HttpBody
      });
    }
  }

  export abstract class ProjectsThumbnailsApiClient {
    constructor() {}

    abstract create(
        parent: string, $requestBody: Thumbnail,
        namedParameters?: ProjectsThumbnailsCreateNamedParameters&
        object): Promise<Thumbnail>;

    abstract getPixels(
        name: string,
        namedParameters?: ProjectsThumbnailsGetPixelsNamedParameters&
        object): Promise<HttpBody>;
  }

  export type ProjectsValueApiClient$Xgafv = '1'|'2';

  export interface IProjectsValueApiClient$XgafvEnum {
    readonly 1: ProjectsValueApiClient$Xgafv;
    readonly 2: ProjectsValueApiClient$Xgafv;

    values(): Array<ProjectsValueApiClient$Xgafv>;
  }

  export const ProjectsValueApiClient$XgafvEnum:
      IProjectsValueApiClient$XgafvEnum = {
        1: <ProjectsValueApiClient$Xgafv>'1',
        2: <ProjectsValueApiClient$Xgafv>'2',
        values():
            Array<ProjectsValueApiClient$Xgafv> {
              return [
                ProjectsValueApiClient$XgafvEnum[1],
                ProjectsValueApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsValueApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsValueApiClientAltEnum {
    readonly JSON: ProjectsValueApiClientAlt;
    readonly MEDIA: ProjectsValueApiClientAlt;
    readonly PROTO: ProjectsValueApiClientAlt;

    values(): Array<ProjectsValueApiClientAlt>;
  }

  export const ProjectsValueApiClientAltEnum: IProjectsValueApiClientAltEnum = {
    JSON: <ProjectsValueApiClientAlt>'json',
    MEDIA: <ProjectsValueApiClientAlt>'media',
    PROTO: <ProjectsValueApiClientAlt>'proto',
    values():
        Array<ProjectsValueApiClientAlt> {
          return [
            ProjectsValueApiClientAltEnum.JSON,
            ProjectsValueApiClientAltEnum.MEDIA,
            ProjectsValueApiClientAltEnum.PROTO
          ];
        }
  };

  export declare interface ProjectsValueComputeNamedParameters {
    access_token?: string;
    alt?: ProjectsValueApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsValueApiClient$Xgafv;
  }

  export class ProjectsValueApiClientImpl implements ProjectsValueApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    compute(
        project: string, $requestBody: ComputeValueRequest,
        namedParameters: ProjectsValueComputeNamedParameters&
        object = {}): Promise<ComputeValueResponse> {
      this.$apiClient.$validateParameter(
          project, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<ComputeValueResponse>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.value.compute',
        path: `/${this.gapiVersion}/${project}/value:compute`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: ComputeValueResponse
      });
    }
  }

  export abstract class ProjectsValueApiClient {
    constructor() {}

    abstract compute(
        project: string, $requestBody: ComputeValueRequest,
        namedParameters?: ProjectsValueComputeNamedParameters&
        object): Promise<ComputeValueResponse>;
  }

  export type ProjectsVideoApiClient$Xgafv = '1'|'2';

  export interface IProjectsVideoApiClient$XgafvEnum {
    readonly 1: ProjectsVideoApiClient$Xgafv;
    readonly 2: ProjectsVideoApiClient$Xgafv;

    values(): Array<ProjectsVideoApiClient$Xgafv>;
  }

  export const ProjectsVideoApiClient$XgafvEnum:
      IProjectsVideoApiClient$XgafvEnum = {
        1: <ProjectsVideoApiClient$Xgafv>'1',
        2: <ProjectsVideoApiClient$Xgafv>'2',
        values():
            Array<ProjectsVideoApiClient$Xgafv> {
              return [
                ProjectsVideoApiClient$XgafvEnum[1],
                ProjectsVideoApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsVideoApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsVideoApiClientAltEnum {
    readonly JSON: ProjectsVideoApiClientAlt;
    readonly MEDIA: ProjectsVideoApiClientAlt;
    readonly PROTO: ProjectsVideoApiClientAlt;

    values(): Array<ProjectsVideoApiClientAlt>;
  }

  export const ProjectsVideoApiClientAltEnum: IProjectsVideoApiClientAltEnum = {
    JSON: <ProjectsVideoApiClientAlt>'json',
    MEDIA: <ProjectsVideoApiClientAlt>'media',
    PROTO: <ProjectsVideoApiClientAlt>'proto',
    values():
        Array<ProjectsVideoApiClientAlt> {
          return [
            ProjectsVideoApiClientAltEnum.JSON,
            ProjectsVideoApiClientAltEnum.MEDIA,
            ProjectsVideoApiClientAltEnum.PROTO
          ];
        }
  };

  export declare interface ProjectsVideoExportNamedParameters {
    access_token?: string;
    alt?: ProjectsVideoApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsVideoApiClient$Xgafv;
  }

  export class ProjectsVideoApiClientImpl implements ProjectsVideoApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    export(
        project: string, $requestBody: ExportVideoRequest,
        namedParameters: ProjectsVideoExportNamedParameters&
        object = {}): Promise<Operation> {
      this.$apiClient.$validateParameter(
          project, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<Operation>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.video.export',
        path: `/${this.gapiVersion}/${project}/video:export`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Operation
      });
    }
  }

  export abstract class ProjectsVideoApiClient {
    constructor() {}

    abstract export(
        project: string, $requestBody: ExportVideoRequest,
        namedParameters?: ProjectsVideoExportNamedParameters&
        object): Promise<Operation>;
  }

  export type ProjectsVideoMapApiClient$Xgafv = '1'|'2';

  export interface IProjectsVideoMapApiClient$XgafvEnum {
    readonly 1: ProjectsVideoMapApiClient$Xgafv;
    readonly 2: ProjectsVideoMapApiClient$Xgafv;

    values(): Array<ProjectsVideoMapApiClient$Xgafv>;
  }

  export const ProjectsVideoMapApiClient$XgafvEnum:
      IProjectsVideoMapApiClient$XgafvEnum = {
        1: <ProjectsVideoMapApiClient$Xgafv>'1',
        2: <ProjectsVideoMapApiClient$Xgafv>'2',
        values():
            Array<ProjectsVideoMapApiClient$Xgafv> {
              return [
                ProjectsVideoMapApiClient$XgafvEnum[1],
                ProjectsVideoMapApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsVideoMapApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsVideoMapApiClientAltEnum {
    readonly JSON: ProjectsVideoMapApiClientAlt;
    readonly MEDIA: ProjectsVideoMapApiClientAlt;
    readonly PROTO: ProjectsVideoMapApiClientAlt;

    values(): Array<ProjectsVideoMapApiClientAlt>;
  }

  export const ProjectsVideoMapApiClientAltEnum:
      IProjectsVideoMapApiClientAltEnum = {
        JSON: <ProjectsVideoMapApiClientAlt>'json',
        MEDIA: <ProjectsVideoMapApiClientAlt>'media',
        PROTO: <ProjectsVideoMapApiClientAlt>'proto',
        values():
            Array<ProjectsVideoMapApiClientAlt> {
              return [
                ProjectsVideoMapApiClientAltEnum.JSON,
                ProjectsVideoMapApiClientAltEnum.MEDIA,
                ProjectsVideoMapApiClientAltEnum.PROTO
              ];
            }
      };

  export declare interface ProjectsVideoMapExportNamedParameters {
    access_token?: string;
    alt?: ProjectsVideoMapApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsVideoMapApiClient$Xgafv;
  }

  export class ProjectsVideoMapApiClientImpl implements
      ProjectsVideoMapApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    export(
        project: string, $requestBody: ExportVideoMapRequest,
        namedParameters: ProjectsVideoMapExportNamedParameters&
        object = {}): Promise<Operation> {
      this.$apiClient.$validateParameter(
          project, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<Operation>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.videoMap.export',
        path: `/${this.gapiVersion}/${project}/videoMap:export`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: Operation
      });
    }
  }

  export abstract class ProjectsVideoMapApiClient {
    constructor() {}

    abstract export(
        project: string, $requestBody: ExportVideoMapRequest,
        namedParameters?: ProjectsVideoMapExportNamedParameters&
        object): Promise<Operation>;
  }

  export type ProjectsVideoThumbnailsApiClient$Xgafv = '1'|'2';

  export interface IProjectsVideoThumbnailsApiClient$XgafvEnum {
    readonly 1: ProjectsVideoThumbnailsApiClient$Xgafv;
    readonly 2: ProjectsVideoThumbnailsApiClient$Xgafv;

    values(): Array<ProjectsVideoThumbnailsApiClient$Xgafv>;
  }

  export const ProjectsVideoThumbnailsApiClient$XgafvEnum:
      IProjectsVideoThumbnailsApiClient$XgafvEnum = {
        1: <ProjectsVideoThumbnailsApiClient$Xgafv>'1',
        2: <ProjectsVideoThumbnailsApiClient$Xgafv>'2',
        values():
            Array<ProjectsVideoThumbnailsApiClient$Xgafv> {
              return [
                ProjectsVideoThumbnailsApiClient$XgafvEnum[1],
                ProjectsVideoThumbnailsApiClient$XgafvEnum[2]
              ];
            }
      };

  export type ProjectsVideoThumbnailsApiClientAlt = 'json'|'media'|'proto';

  export interface IProjectsVideoThumbnailsApiClientAltEnum {
    readonly JSON: ProjectsVideoThumbnailsApiClientAlt;
    readonly MEDIA: ProjectsVideoThumbnailsApiClientAlt;
    readonly PROTO: ProjectsVideoThumbnailsApiClientAlt;

    values(): Array<ProjectsVideoThumbnailsApiClientAlt>;
  }

  export const ProjectsVideoThumbnailsApiClientAltEnum:
      IProjectsVideoThumbnailsApiClientAltEnum = {
        JSON: <ProjectsVideoThumbnailsApiClientAlt>'json',
        MEDIA: <ProjectsVideoThumbnailsApiClientAlt>'media',
        PROTO: <ProjectsVideoThumbnailsApiClientAlt>'proto',
        values():
            Array<ProjectsVideoThumbnailsApiClientAlt> {
              return [
                ProjectsVideoThumbnailsApiClientAltEnum.JSON,
                ProjectsVideoThumbnailsApiClientAltEnum.MEDIA,
                ProjectsVideoThumbnailsApiClientAltEnum.PROTO
              ];
            }
      };

  export declare interface ProjectsVideoThumbnailsCreateNamedParameters {
    access_token?: string;
    alt?: ProjectsVideoThumbnailsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsVideoThumbnailsApiClient$Xgafv;
  }

  export declare interface ProjectsVideoThumbnailsGetPixelsNamedParameters {
    access_token?: string;
    alt?: ProjectsVideoThumbnailsApiClientAlt;
    callback?: string;
    fields?: string;
    key?: string;
    oauth_token?: string;
    prettyPrint?: boolean;
    quotaUser?: string;
    upload_protocol?: string;
    uploadType?: string;
    $Xgafv?: ProjectsVideoThumbnailsApiClient$Xgafv;
  }

  export class ProjectsVideoThumbnailsApiClientImpl implements
      ProjectsVideoThumbnailsApiClient {
    private $apiClient: PromiseApiClient;

    constructor(
        private gapiVersion: string, gapiRequestService: PromiseRequestService,
        apiClientHookFactory: ApiClientHookFactory|null = null) {
      this.$apiClient =
          new PromiseApiClient(gapiRequestService, apiClientHookFactory);
    }

    create(
        parent: string, $requestBody: VideoThumbnail,
        namedParameters: ProjectsVideoThumbnailsCreateNamedParameters&
        object = {}): Promise<VideoThumbnail> {
      this.$apiClient.$validateParameter(
          parent, new RegExp('^projects/[^/]+$'));

      return this.$apiClient.$request<VideoThumbnail>({
        body: $requestBody,
        httpMethod: 'POST',
        methodId: 'earthengine.projects.videoThumbnails.create',
        path: `/${this.gapiVersion}/${parent}/videoThumbnails`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: VideoThumbnail
      });
    }

    getPixels(
        name: string,
        namedParameters: ProjectsVideoThumbnailsGetPixelsNamedParameters&
        object = {}): Promise<HttpBody> {
      this.$apiClient.$validateParameter(
          name, new RegExp('^projects/[^/]+/videoThumbnails/[^/]+$'));
      let $requestBody = <Serializable|null>null;

      return this.$apiClient.$request<HttpBody>({
        body: $requestBody,
        httpMethod: 'GET',
        methodId: 'earthengine.projects.videoThumbnails.getPixels',
        path: `/${this.gapiVersion}/${name}:getPixels`,
        queryParams: buildQueryParams(namedParameters, PARAM_MAP_0),
        responseCtor: HttpBody
      });
    }
  }

  export abstract class ProjectsVideoThumbnailsApiClient {
    constructor() {}

    abstract create(
        parent: string, $requestBody: VideoThumbnail,
        namedParameters?: ProjectsVideoThumbnailsCreateNamedParameters&
        object): Promise<VideoThumbnail>;

    abstract getPixels(
        name: string,
        namedParameters?: ProjectsVideoThumbnailsGetPixelsNamedParameters&
        object): Promise<HttpBody>;
  }
