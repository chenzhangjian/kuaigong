import express, { type Request, type Response } from 'express';
import { query, validationResult } from 'express-validator';
import amapService from '../services/amap';

const router = express.Router();

/**
 * 逆地理编码 - 坐标转地址
 * GET /api/v1/location/reverse-geocode
 * Query: lat, lng
 */
router.get('/reverse-geocode', [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('纬度无效'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('经度无效'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng } = req.query;
    const latNum = parseFloat(lat as string);
    const lngNum = parseFloat(lng as string);

    const result = await amapService.reverseGeocode(latNum, lngNum);
    res.json(result);
  } catch (error: any) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({ error: error.message || '获取地址失败' });
  }
});

/**
 * 地理编码 - 地址转坐标
 * GET /api/v1/location/geocode
 * Query: address, city?
 */
router.get('/geocode', [
  query('address').notEmpty().withMessage('地址不能为空'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { address, city } = req.query;
    const result = await amapService.geocode(address as string, city as string);
    res.json(result);
  } catch (error: any) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: error.message || '获取坐标失败' });
  }
});

/**
 * 关键词搜索地点
 * GET /api/v1/location/search
 * Query: keyword, city?, lat?, lng?, radius?
 */
router.get('/search', [
  query('keyword').notEmpty().withMessage('关键词不能为空'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { keyword, city, lat, lng, radius } = req.query;

    const result = await amapService.searchPois(keyword as string, {
      city: city as string,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
      radius: radius ? parseInt(radius as string) : undefined,
    });

    res.json({ pois: result });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message || '搜索失败' });
  }
});

/**
 * 周边搜索
 * GET /api/v1/location/nearby
 * Query: lat, lng, keyword, radius?
 */
router.get('/nearby', [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('纬度无效'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('经度无效'),
  query('keyword').notEmpty().withMessage('关键词不能为空'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { lat, lng, keyword, radius } = req.query;

    const result = await amapService.searchNearby(
      parseFloat(lat as string),
      parseFloat(lng as string),
      keyword as string,
      radius ? parseInt(radius as string) : 3000
    );

    res.json({ pois: result });
  } catch (error: any) {
    console.error('Nearby search error:', error);
    res.status(500).json({ error: error.message || '周边搜索失败' });
  }
});

/**
 * IP定位
 * GET /api/v1/location/ip
 * Query: ip?
 */
router.get('/ip', async (req: Request, res: Response) => {
  try {
    const { ip } = req.query;
    const result = await amapService.locateByIp(ip as string);
    res.json(result);
  } catch (error: any) {
    console.error('IP location error:', error);
    res.status(500).json({ error: error.message || 'IP定位失败' });
  }
});

export default router;
