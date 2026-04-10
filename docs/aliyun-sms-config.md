# 阿里云短信配置指南

## 一、获取阿里云配置信息

### 1. 访问阿里云控制台
登录 https://www.aliyun.com

### 2. 获取 AccessKey
- 进入 **AccessKey 管理**
- 创建或使用已有的 AccessKey
- 复制 **AccessKey ID** 和 **AccessKey Secret**

### 3. 创建短信签名
- 进入 **短信服务控制台**
- 选择 **国内消息** → **签名管理**
- 点击 **添加签名**
- 签名名称：`徐州昊呈电子商务`
- 签名来源：选择 `公司` 或 `个人`
- 签名用途：选择 `自用`
- 等待审核通过

### 4. 创建短信模板
- 选择 **模板管理** → **添加模板**
- 模板类型：选择 `验证码`
- 模板名称：`快工验证码`
- 模板内容：`您的验证码是${code}，5分钟内有效，请勿泄露于他人。`
- 等待审核通过
- 复制模板CODE（如：`SMS_xxxxxxxxx`）

## 二、配置环境变量

### 需要配置以下环境变量：

```bash
# 短信服务提供商：aliyun 或 mock（开发环境模拟）
SMS_PROVIDER=aliyun

# 阿里云 AccessKey ID
ALIYUN_ACCESS_KEY_ID=你的AccessKeyID

# 阿里云 AccessKey Secret
ALIYUN_ACCESS_KEY_SECRET=你的AccessKeySecret

# 短信签名名称（必须与阿里云审核通过的签名一致）
ALIYUN_SMS_SIGN_NAME=徐州昊呈电子商务

# 验证码模板CODE
ALIYUN_SMS_TEMPLATE_CODE=SMS_你的模板CODE
```

## 三、配置方式

### 方式1：环境变量文件
在 `/workspace/projects/server/src/.env` 文件中添加：

```
SMS_PROVIDER=aliyun
ALIYUN_ACCESS_KEY_ID=LTAIxxxxxxxxxxxxx
ALIYUN_ACCESS_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
ALIYUN_SMS_SIGN_NAME=徐州昊呈电子商务
ALIYUN_SMS_TEMPLATE_CODE=SMS_xxxxxxxxx
```

### 方式2：系统环境变量
```bash
export SMS_PROVIDER=aliyun
export ALIYUN_ACCESS_KEY_ID=你的AccessKeyID
export ALIYUN_ACCESS_KEY_SECRET=你的AccessKeySecret
export ALIYUN_SMS_SIGN_NAME=徐州昊呈电子商务
export ALIYUN_SMS_TEMPLATE_CODE=SMS_你的模板CODE
```

## 四、验证配置

配置完成后，重启后端服务：

```bash
cd /workspace/projects/server
pnpm run dev
```

然后测试发送验证码：

```bash
curl -X POST http://localhost:9091/api/v1/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","type":"login"}'
```

## 五、常见问题

### Q: 短信发送失败
1. 检查 AccessKey 是否有效
2. 检查签名是否审核通过
3. 检查模板是否审核通过
4. 检查模板CODE是否正确
5. **检查账户余额是否充足**

### Q: 短信签名名称不匹配
确保 `ALIYUN_SMS_SIGN_NAME` 与阿里云审核通过的签名完全一致

### Q: 账户余额不足
在阿里云短信控制台充值足够的短信套餐

### Q: 开发环境测试
可以使用 `SMS_PROVIDER=mock` 模式，验证码会在日志中打印

### Q: 短信发送有频率限制
- 每手机号：1分钟1次，1小时5次，1天10次
- 每IP：1分钟10次

## 六、安全建议

1. **不要将 AccessKey 提交到 Git**
   - 已在 `.gitignore` 中排除 `.env` 文件
   - 生产环境使用环境变量或密钥管理服务

2. **定期轮换 AccessKey**
   - 建议每3-6个月更换一次
   - 更换后及时更新配置并重启服务

3. **设置短信额度**
   - 在阿里云控制台设置日发送上限
   - 避免异常消耗
