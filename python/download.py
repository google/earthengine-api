// MethaneSAT 데이터셋 불러오기
var dataset = ee.ImageCollection("EDF/MethaneSAT/MethaneAIR/L3concentration");

// 예시로 첫 번째 이미지를 선택 (필요시 특정 날짜나 기간을 필터링 가능)
var image = dataset.first();

// 내보내고자 하는 관심 영역 정의 (여기서는 예시 영역입니다; 원하는 영역으로 수정)
var region = ee.Geometry.Rectangle([-103, 31, -102, 33]);

// 관심 영역 내에서 이미지를 샘플링하여 포인트 데이터를 생성 (scale 값은 해상도에 맞게 조정)
var samples = image.sample({
  region: region,
  scale: 30,
  geometries: true  // 포인트의 지리정보(geometry)를 포함시킴
});

// 각 포인트에 경도(lon)와 위도(lat) 속성을 추가하는 함수
var addLatLon = function(feature) {
  var coords = feature.geometry().coordinates();
  return feature.set('lon', coords.get(0), 'lat', coords.get(1));
};

// 경도와 위도 속성이 추가된 데이터셋 생성
var samplesWithLatLon = samples.map(addLatLon);

// CSV 파일로 내보내기 (Google Drive에 저장됨)
Export.table.toDrive({
  collection: samplesWithLatLon,
  description: 'MethaneSAT_lon_lat_concentration',
  fileFormat: 'CSV'
});
