/**
 * 高德地图服务模块
 * 提供地理编码、逆地理编码、地点搜索等功能
 */

// 高德地图配置
const AMAP_KEY = process.env.AMAP_KEY || '';
const AMAP_API_BASE = 'https://restapi.amap.com/v3';

// 是否启用真实API（需要配置AMAP_KEY）
const useRealApi = AMAP_KEY.length > 0;

// 逆地理编码结果
export interface ReverseGeocodeResult {
  formattedAddress: string;
  province: string;
  city: string;
  district: string;
  street?: string;
  streetNumber?: string;
  pois: Array<{
    id: string;
    name: string;
    address: string;
    distance: string;
    type?: string;
  }>;
  location: {
    lat: number;
    lng: number;
  };
}

// 地理编码结果
export interface GeocodeResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  province: string;
  city: string;
  district: string;
}

// POI搜索结果
export interface PoiResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance?: string;
  type?: string;
}

/**
 * 逆地理编码 - 坐标转地址
 * @param lat 纬度
 * @param lng 经度
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  if (useRealApi) {
    try {
      const response = await fetch(
        `${AMAP_API_BASE}/geocode/regeo?key=${AMAP_KEY}&location=${lng},${lat}&extensions=all`
      );
      const data = await response.json() as any;

      if (data.status === '1') {
        const regeocode = data.regeocode;
        const addressComponent = regeocode.addressComponent;

        return {
          formattedAddress: regeocode.formatted_address,
          province: addressComponent.province || '',
          city: addressComponent.city || addressComponent.province || '',
          district: addressComponent.district || '',
          street: addressComponent.streetNumber?.street || '',
          streetNumber: addressComponent.streetNumber?.number || '',
          pois: (regeocode.pois || []).slice(0, 5).map((poi: any) => ({
            id: poi.id,
            name: poi.name,
            address: poi.address,
            distance: poi.distance,
            type: poi.type,
          })),
          location: { lat, lng },
        };
      }

      throw new Error(data.info || '逆地理编码失败');
    } catch (error) {
      console.error('[高德地图] 逆地理编码失败:', error);
      throw error;
    }
  }

  // 模拟返回（开发环境）
  return {
    formattedAddress: `北京市海淀区中关村大街${Math.floor(Math.random() * 100) + 1}号`,
    province: '北京市',
    city: '北京市',
    district: '海淀区',
    street: '中关村大街',
    streetNumber: `${Math.floor(Math.random() * 200) + 1}`,
    pois: [
      { id: '1', name: '中关村广场', address: '北京市海淀区中关村大街', distance: '100' },
      { id: '2', name: '海淀黄庄', address: '北京市海淀区中关村大街', distance: '300' },
      { id: '3', name: '中国人民大学', address: '北京市海淀区中关村大街59号', distance: '500' },
    ],
    location: { lat, lng },
  };
}

/**
 * 地理编码 - 地址转坐标
 * @param address 地址
 * @param city 城市（可选）
 */
export async function geocode(address: string, city?: string): Promise<GeocodeResult> {
  if (useRealApi) {
    try {
      const params = new URLSearchParams({
        key: AMAP_KEY,
        address,
        city: city || '',
      });

      const response = await fetch(`${AMAP_API_BASE}/geocode/geo?${params}`);
      const data = await response.json() as any;

      if (data.status === '1' && data.geocodes.length > 0) {
        const geocode = data.geocodes[0];
        const [lng, latStr] = geocode.location.split(',');
        const lat = parseFloat(latStr);

        return {
          formattedAddress: geocode.formatted_address,
          lat,
          lng: parseFloat(lng),
          province: geocode.province || '',
          city: geocode.city || '',
          district: geocode.district || '',
        };
      }

      throw new Error(data.info || '地理编码失败');
    } catch (error) {
      console.error('[高德地图] 地理编码失败:', error);
      throw error;
    }
  }

  // 模拟返回（开发环境）
  return {
    formattedAddress: address,
    lat: 39.9042 + (Math.random() - 0.5) * 0.1,
    lng: 116.4074 + (Math.random() - 0.5) * 0.1,
    province: '北京市',
    city: city || '北京市',
    district: '海淀区',
  };
}

/**
 * 关键词搜索地点
 * @param keyword 关键词
 * @param options 可选参数
 */
export async function searchPois(
  keyword: string,
  options?: {
    city?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }
): Promise<PoiResult[]> {
  if (useRealApi) {
    try {
      const params = new URLSearchParams({
        key: AMAP_KEY,
        keywords: keyword,
        city: options?.city || '北京',
        citylimit: 'true',
        offset: '20',
        page: '1',
        extensions: 'all',
      });

      // 如果提供了位置，按距离排序
      if (options?.lat && options?.lng) {
        params.set('location', `${options.lng},${options.lat}`);
        params.set('radius', String(options.radius || 5000));
        params.set('sortrule', 'distance');
      }

      const response = await fetch(`${AMAP_API_BASE}/place/text?${params}`);
      const data = await response.json() as any;

      if (data.status === '1') {
        return (data.pois || []).map((poi: any) => {
          const [lng, lat] = poi.location.split(',');
          return {
            id: poi.id,
            name: poi.name,
            address: poi.address || poi.pname + poi.cityname + poi.adname,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            distance: poi.distance,
            type: poi.type,
          };
        });
      }

      throw new Error(data.info || '搜索失败');
    } catch (error) {
      console.error('[高德地图] POI搜索失败:', error);
      throw error;
    }
  }

  // 模拟返回（开发环境）
  return [
    {
      id: '1',
      name: `${keyword}（中关村店）`,
      address: '北京市海淀区中关村大街1号',
      lat: 39.9042,
      lng: 116.4074,
      distance: '500',
    },
    {
      id: '2',
      name: `${keyword}（海淀黄庄店）`,
      address: '北京市海淀区海淀黄庄',
      lat: 39.9062,
      lng: 116.4094,
      distance: '800',
    },
    {
      id: '3',
      name: `${keyword}（五道口店）`,
      address: '北京市海淀区五道口',
      lat: 39.9082,
      lng: 116.4114,
      distance: '1200',
    },
  ];
}

/**
 * 周边搜索
 * @param lat 纬度
 * @param lng 经度
 * @param keyword 关键词
 * @param radius 半径（米）
 */
export async function searchNearby(
  lat: number,
  lng: number,
  keyword: string,
  radius: number = 3000
): Promise<PoiResult[]> {
  if (useRealApi) {
    try {
      const params = new URLSearchParams({
        key: AMAP_KEY,
        location: `${lng},${lat}`,
        keywords: keyword,
        radius: String(radius),
        offset: '20',
        page: '1',
        extensions: 'all',
      });

      const response = await fetch(`${AMAP_API_BASE}/place/around?${params}`);
      const data = await response.json() as any;

      if (data.status === '1') {
        return (data.pois || []).map((poi: any) => {
          const [lngStr, latStr] = poi.location.split(',');
          return {
            id: poi.id,
            name: poi.name,
            address: poi.address || poi.pname + poi.cityname + poi.adname,
            lat: parseFloat(latStr),
            lng: parseFloat(lngStr),
            distance: poi.distance,
            type: poi.type,
          };
        });
      }

      throw new Error(data.info || '周边搜索失败');
    } catch (error) {
      console.error('[高德地图] 周边搜索失败:', error);
      throw error;
    }
  }

  // 模拟返回
  return searchPois(keyword, { lat, lng, radius });
}

/**
 * IP定位
 * 根据IP地址获取位置
 */
export async function locateByIp(ip?: string): Promise<{ lat: number; lng: number; province: string; city: string }> {
  if (useRealApi) {
    try {
      const params = new URLSearchParams({
        key: AMAP_KEY,
        ip: ip || '',
      });

      const response = await fetch(`${AMAP_API_BASE}/ip?${params}`);
      const data = await response.json() as any;

      if (data.status === '1') {
        const [lng, lat] = data.rectangle.split(';')[0].split(',');
        return {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          province: data.province,
          city: data.city,
        };
      }

      throw new Error(data.info || 'IP定位失败');
    } catch (error) {
      console.error('[高德地图] IP定位失败:', error);
      throw error;
    }
  }

  // 模拟返回
  return {
    lat: 39.9042,
    lng: 116.4074,
    province: '北京市',
    city: '北京市',
  };
}

export default {
  reverseGeocode,
  geocode,
  searchPois,
  searchNearby,
  locateByIp,
};
