const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  errors?: Array<{ msg: string }>;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 合并传入的 headers
    if (options.headers) {
      Object.assign(headers, options.headers as Record<string, string>);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(data.error || '请求失败') as any;
      error.code = data.code;
      throw error;
    }

    return data;
  }

  // 认证相关
  async register(phone: string, password: string, userType: 'worker' | 'employer', nickname?: string) {
    return this.request<{ user: any; token: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ phone, password, userType, nickname }),
    });
  }

  async login(phone: string, password: string) {
    return this.request<{ user: any; token: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    });
  }

  async getCurrentUser() {
    return this.request<any>('/api/v1/auth/me');
  }

  async updateProfile(data: { nickname?: string; bio?: string; skills?: string[]; avatarUrl?: string }) {
    return this.request<any>('/api/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // 验证码相关
  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：POST /api/v1/auth/send-code
   * Body 参数：phone: string, type: 'login' | 'register' | 'reset_password'
   */
  async sendVerificationCode(phone: string, type: 'login' | 'register' | 'reset_password') {
    return this.request<{ success: boolean; message: string; code?: string }>('/api/v1/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone, type }),
    });
  }

  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：POST /api/v1/auth/login-with-code
   * Body 参数：phone: string, code: string
   */
  async loginWithCode(phone: string, code: string) {
    return this.request<{ user: any; token: string }>('/api/v1/auth/login-with-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：POST /api/v1/auth/register-with-code
   * Body 参数：phone: string, code: string, password: string, userType: string, nickname?: string
   */
  async registerWithCode(phone: string, code: string, password: string, userType: 'worker' | 'employer', nickname?: string) {
    return this.request<{ user: any; token: string }>('/api/v1/auth/register-with-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code, password, userType, nickname }),
    });
  }

  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：POST /api/v1/auth/reset-password
   * Body 参数：phone: string, code: string, newPassword: string
   */
  async resetPassword(phone: string, code: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ phone, code, newPassword }),
    });
  }

  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：POST /api/v1/auth/verify-reset-code
   * Body 参数：phone: string, code: string
   */
  async verifyResetCode(phone: string, code: string) {
    return this.request<{ success: boolean; message: string }>('/api/v1/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
  }

  // 任务相关
  async getTaskCategories() {
    return this.request<any[]>('/api/v1/tasks/categories');
  }

  async getTasks(params?: {
    categoryId?: string;
    status?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    minBudget?: number;
    maxBudget?: number;
    keyword?: string;
    page?: number;
    limit?: number;
  }) {
    const queryString = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value.toString());
        }
      });
    }
    return this.request<{ tasks: any[]; page: number; limit: number }>(
      `/api/v1/tasks?${queryString.toString()}`
    );
  }

  async getTaskDetail(id: string) {
    return this.request<any>(`/api/v1/tasks/${id}`);
  }

  async createTask(data: {
    title: string;
    description?: string;
    categoryId: string;
    address: string;
    latitude?: number;
    longitude?: number;
    budgetType?: 'fixed' | 'range' | 'negotiable';
    budgetMin?: number;
    budgetMax?: number;
    budgetFixed?: number;
    urgency?: 'normal' | 'urgent' | 'very_urgent';
    workTime?: string;
    estimatedDuration?: number;
    images?: string[];
    requirements?: string;
  }) {
    return this.request<any>('/api/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async applyTask(taskId: string, message?: string, proposedAmount?: number) {
    return this.request<any>(`/api/v1/tasks/${taskId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ message, proposedAmount }),
    });
  }

  async getTaskApplications(taskId: string) {
    return this.request<any[]>(`/api/v1/tasks/${taskId}/applications`);
  }

  // 订单相关
  async getOrders(params?: { status?: string; role?: 'worker' | 'employer'; page?: number; limit?: number }) {
    const queryString = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value.toString());
        }
      });
    }
    return this.request<{ orders: any[]; page: number; limit: number }>(
      `/api/v1/orders?${queryString.toString()}`
    );
  }

  async getOrderDetail(id: string) {
    return this.request<any>(`/api/v1/orders/${id}`);
  }

  async acceptApplication(applicationId: string, agreedAmount?: number) {
    return this.request<any>(`/api/v1/orders/accept-application/${applicationId}`, {
      method: 'POST',
      body: JSON.stringify({ agreedAmount }),
    });
  }

  async startWork(orderId: string) {
    return this.request<any>(`/api/v1/orders/${orderId}/start`, {
      method: 'POST',
    });
  }

  async completeWork(orderId: string, completionPhotos?: string[]) {
    return this.request<any>(`/api/v1/orders/${orderId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ completionPhotos }),
    });
  }

  async confirmOrder(orderId: string) {
    return this.request<{ message: string }>(`/api/v1/orders/${orderId}/confirm`, {
      method: 'POST',
    });
  }

  async cancelOrder(orderId: string, reason?: string) {
    return this.request<{ message: string }>(`/api/v1/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async submitReview(orderId: string, rating: number, comment?: string) {
    return this.request<{ message: string }>(`/api/v1/orders/${orderId}/review`, {
      method: 'POST',
      body: JSON.stringify({ rating, comment }),
    });
  }

  /**
   * 服务端文件：server/src/routes/orders.ts
   * 接口：GET /api/v1/orders/my-workers
   * 无参数
   */
  async getMyWorkers() {
    return this.request<Array<{
      id: string;
      name: string;
      avatar: string;
      rating: number;
      skills: string[];
      totalOrders: number;
      completedOrders: number;
      cooperationCount: number;
      lastOrderDate: string;
    }>>('/api/v1/orders/my-workers');
  }

  // 支付相关
  /**
   * 服务端文件：server/src/routes/payments.ts
   * 接口：GET /api/v1/payments/wallet
   */
  async getWallet() {
    return this.request<{
      balance: number;
      frozenAmount: number;
      transactions: Array<{
        id: number;
        transactionNo: string;
        type: string;
        amount: number;
        balanceAfter: number;
        status: string;
        paymentMethod: string | null;
        description: string | null;
        createdAt: string;
      }>;
    }>('/api/v1/payments/wallet');
  }

  /**
   * 服务端文件：server/src/routes/payments.ts
   * 接口：POST /api/v1/payments/recharge
   * Body 参数：amount: number, paymentMethod: 'wechat' | 'alipay'
   */
  async createRechargeOrder(amount: number, paymentMethod: 'wechat' | 'alipay') {
    return this.request<{
      orderId: number;
      orderNo: string;
      amount: number;
      paymentMethod: string;
      status: string;
      expireAt: string;
      mockPayment: boolean;
      qrCodeUrl: string;
    }>('/api/v1/payments/recharge', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  }

  /**
   * 服务端文件：server/src/routes/payments.ts
   * 接口：POST /api/v1/payments/mock-pay
   * Body 参数：orderNo: string
   */
  async mockPay(orderNo: string) {
    return this.request<{
      success: boolean;
      message: string;
      balance: number;
    }>('/api/v1/payments/mock-pay', {
      method: 'POST',
      body: JSON.stringify({ orderNo }),
    });
  }

  /**
   * 服务端文件：server/src/routes/payments.ts
   * 接口：GET /api/v1/payments/order/:orderNo
   * Path 参数：orderNo: string
   */
  async getPaymentOrder(orderNo: string) {
    return this.request<{
      id: number;
      orderNo: string;
      amount: number;
      paymentMethod: string;
      status: string;
      transactionId: string | null;
      paidAt: string | null;
      createdAt: string;
    }>(`/api/v1/payments/order/${orderNo}`);
  }

  /**
   * 服务端文件：server/src/routes/payments.ts
   * 接口：GET /api/v1/payments/transactions
   * Query 参数：type?: string, page?: number, limit?: number
   */
  async getTransactions(params?: { type?: string; page?: number; limit?: number }) {
    const queryString = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value.toString());
        }
      });
    }
    return this.request<{
      transactions: Array<{
        id: number;
        transactionNo: string;
        type: string;
        amount: number;
        balanceAfter: number;
        status: string;
        paymentMethod: string | null;
        description: string | null;
        createdAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/v1/payments/transactions?${queryString.toString()}`);
  }

  // 地图定位相关
  /**
   * 服务端文件：server/src/routes/location.ts
   * 接口：GET /api/v1/location/reverse-geocode
   * Query 参数：lat: number, lng: number
   */
  async reverseGeocode(lat: number, lng: number) {
    return this.request<{
      formattedAddress: string;
      province: string;
      city: string;
      district: string;
      street: string;
      streetNumber: string;
      pois: Array<{
        name: string;
        distance: string;
        address: string;
      }>;
      location: {
        lat: number;
        lng: number;
      };
    }>(`/api/v1/location/reverse-geocode?lat=${lat}&lng=${lng}`);
  }

  /**
   * 服务端文件：server/src/routes/location.ts
   * 接口：GET /api/v1/location/geocode
   * Query 参数：address: string, city?: string
   */
  async geocode(address: string, city?: string) {
    const queryString = new URLSearchParams({ address });
    if (city) queryString.append('city', city);
    return this.request<{
      formattedAddress: string;
      lat: number;
      lng: number;
      province: string;
      city: string;
      district: string;
    }>(`/api/v1/location/geocode?${queryString.toString()}`);
  }

  /**
   * 服务端文件：server/src/routes/location.ts
   * 接口：GET /api/v1/location/search
   * Query 参数：keyword: string, city?: string, lat?: number, lng?: number, radius?: number
   */
  async searchLocation(params: { keyword: string; city?: string; lat?: number; lng?: number; radius?: number }) {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });
    return this.request<{
      pois: Array<{
        id: string;
        name: string;
        address: string;
        lat: number;
        lng: number;
        distance: string;
        type: string;
      }>;
    }>(`/api/v1/location/search?${queryString.toString()}`);
  }

  /**
   * 服务端文件：server/src/routes/location.ts
   * 接口：GET /api/v1/location/nearby-tasks
   * Query 参数：lat: number, lng: number, radius?: number, limit?: number
   */
  async getNearbyTasks(params: { lat: number; lng: number; radius?: number; limit?: number }) {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryString.append(key, value.toString());
      }
    });
    return this.request<{
      tasks: Array<{
        id: string;
        title: string;
        address: string;
        latitude: number;
        longitude: number;
        budgetMin: number;
        budgetMax: number;
        budgetFixed: number;
        urgency: string;
        status: string;
        distance: number;
        createdAt: string;
      }>;
    }>(`/api/v1/location/nearby-tasks?${queryString.toString()}`);
  }

  // 实名认证相关
  /**
   * 服务端文件：server/src/routes/verification.ts
   * 接口：GET /api/v1/verification/status
   */
  async getVerificationStatus() {
    return this.request<{
      hasSubmitted: boolean;
      status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
      realName?: string;
      idCardNumber?: string;
      rejectReason?: string;
      submittedAt?: string;
      reviewedAt?: string;
    }>('/api/v1/verification/status');
  }

  /**
   * 服务端文件：server/src/routes/verification.ts
   * 接口：POST /api/v1/verification/submit
   * Body 参数：realName: string, idCardNumber: string, idCardFrontKey: string, idCardBackKey: string
   */
  async submitVerification(realName: string, idCardNumber: string, idCardFrontKey: string, idCardBackKey: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/api/v1/verification/submit', {
      method: 'POST',
      body: JSON.stringify({ realName, idCardNumber, idCardFrontKey, idCardBackKey }),
    });
  }

  /**
   * 服务端文件：server/src/routes/verification.ts
   * 接口：POST /api/v1/verification/upload
   * Body 参数：FormData (file)
   */
  async uploadVerificationImage(formData: FormData) {
    const url = `${BASE_URL}/api/v1/verification/upload`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    // 注意：不设置 Content-Type，让浏览器/RN 自动处理

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '上传失败');
    }
    return data;
  }

  /**
   * 服务端文件：server/src/routes/verification.ts
   * 接口：POST /api/v1/verification/sign-disclaimer
   * Body 参数：version: string
   */
  async signDisclaimer(version: string) {
    return this.request<{
      success: boolean;
      message: string;
      signedAt: string;
      version: string;
    }>('/api/v1/verification/sign-disclaimer', {
      method: 'POST',
      body: JSON.stringify({ version }),
    });
  }

  /**
   * 服务端文件：server/src/routes/verification.ts
   * 接口：GET /api/v1/verification/check-completion
   */
  async checkVerificationCompletion() {
    return this.request<{
      isVerified: boolean;
      hasSignedDisclaimer: boolean;
      canOperate: boolean;
      userType: string | null;
      message: string;
    }>('/api/v1/verification/check-completion');
  }

  // 用户设置相关
  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：GET /api/v1/auth/settings
   */
  async getSettings() {
    return this.request<{
      notificationEnabled: boolean;
      pushEnabled: boolean;
      language: string;
      theme: string;
    }>('/api/v1/auth/settings');
  }

  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：PUT /api/v1/auth/settings
   * Body 参数：notificationEnabled?: boolean, pushEnabled?: boolean, language?: string, theme?: string
   */
  async updateSettings(settings: {
    notificationEnabled?: boolean;
    pushEnabled?: boolean;
    language?: string;
    theme?: string;
  }) {
    return this.request<{ success: boolean; message: string }>('/api/v1/auth/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：POST /api/v1/auth/avatar
   * Body 参数：FormData (file)
   */
  async uploadAvatar(formData: FormData) {
    const url = `${BASE_URL}/api/v1/auth/avatar`;
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '上传失败');
    }
    return data;
  }

  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：POST /api/v1/auth/change-password
   * Body 参数：oldPassword: string, newPassword: string
   */
  async changePassword(oldPassword: string, newPassword: string) {
    return this.request<{ success: boolean; message: string }>('/api/v1/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  /**
   * 服务端文件：server/src/routes/auth.ts
   * 接口：POST /api/v1/auth/deactivate
   * Body 参数：reason?: string
   */
  async deactivateAccount(reason: string) {
    return this.request<{ success: boolean; message: string }>('/api/v1/auth/deactivate', {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // 银行卡相关
  /**
   * 服务端文件：server/src/routes/bank-cards.ts
   * 接口：GET /api/v1/bank-cards/banks
   * 获取支持的银行列表
   */
  async getBankList() {
    return this.request<Array<{ code: string; name: string; icon: string }>>('/api/v1/bank-cards/banks');
  }

  /**
   * 服务端文件：server/src/routes/bank-cards.ts
   * 接口：GET /api/v1/bank-cards
   * 获取当前用户的银行卡列表
   */
  async getBankCards() {
    return this.request<{
      cards: Array<{
        id: string;
        bankName: string;
        bankCode: string;
        cardNumber: string;
        cardNumberLast4: string;
        cardHolder: string;
        cardType: string;
        isDefault: boolean;
        status: string;
        createdAt: string;
      }>;
    }>('/api/v1/bank-cards');
  }

  /**
   * 服务端文件：server/src/routes/bank-cards.ts
   * 接口：POST /api/v1/bank-cards
   * Body 参数：cardNumber: string, cardHolder: string, bankCode?: string, bankName?: string
   */
  async addBankCard(cardNumber: string, cardHolder: string, bankCode?: string, bankName?: string) {
    return this.request<{
      success: boolean;
      message: string;
      card: {
        id: string;
        bankName: string;
        bankCode: string;
        cardNumber: string;
        cardNumberLast4: string;
        cardHolder: string;
        isDefault: boolean;
      };
    }>('/api/v1/bank-cards', {
      method: 'POST',
      body: JSON.stringify({ cardNumber, cardHolder, bankCode, bankName }),
    });
  }

  /**
   * 服务端文件：server/src/routes/bank-cards.ts
   * 接口：PUT /api/v1/bank-cards/:id/default
   * Path 参数：id: string
   */
  async setDefaultBankCard(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/v1/bank-cards/${id}/default`, {
      method: 'PUT',
    });
  }

  /**
   * 服务端文件：server/src/routes/bank-cards.ts
   * 接口：DELETE /api/v1/bank-cards/:id
   * Path 参数：id: string
   */
  async deleteBankCard(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/v1/bank-cards/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * 服务端文件：server/src/routes/bank-cards.ts
   * 接口：POST /api/v1/bank-cards/identify
   * Body 参数：cardNumber: string
   */
  async identifyBank(cardNumber: string) {
    return this.request<{
      success: boolean;
      bank: { code: string; name: string } | null;
    }>('/api/v1/bank-cards/identify', {
      method: 'POST',
      body: JSON.stringify({ cardNumber }),
    });
  }

  // 提现相关
  /**
   * 服务端文件：server/src/routes/withdraw.ts
   * 接口：POST /api/v1/withdraw/apply
   * Body 参数：amount: number, bankCardId: number
   */
  async applyWithdraw(amount: number, bankCardId: number) {
    return this.request<{
      success: boolean;
      message: string;
      withdrawal: {
        id: number;
        withdrawNo: string;
        amount: number;
        fee: number;
        actualAmount: number;
        status: string;
      };
    }>('/api/v1/withdraw/apply', {
      method: 'POST',
      body: JSON.stringify({ amount, bankCardId }),
    });
  }

  /**
   * 服务端文件：server/src/routes/withdraw.ts
   * 接口：GET /api/v1/withdraw/list
   * Query 参数：status?: string, page?: number, limit?: number
   */
  async getWithdrawals(params?: { status?: string; page?: number; limit?: number }) {
    const queryString = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryString.append(key, value.toString());
        }
      });
    }
    return this.request<{
      withdrawals: Array<{
        id: number;
        withdrawNo: string;
        amount: number;
        fee: number;
        actualAmount: number;
        status: string;
        bankName: string;
        cardNumberLast4: string;
        cardHolder: string;
        rejectReason: string | null;
        processedAt: string | null;
        createdAt: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`/api/v1/withdraw/list?${queryString.toString()}`);
  }

  /**
   * 服务端文件：server/src/routes/withdraw.ts
   * 接口：POST /api/v1/withdraw/cancel/:id
   * Path 参数：id: number
   */
  async cancelWithdraw(id: number) {
    return this.request<{ success: boolean; message: string }>(`/api/v1/withdraw/cancel/${id}`, {
      method: 'POST',
    });
  }

  /**
   * 服务端文件：server/src/routes/withdraw.ts
   * 接口：GET /api/v1/withdraw/:id
   * Path 参数：id: number
   */
  async getWithdrawDetail(id: number) {
    return this.request<{
      id: number;
      withdrawNo: string;
      amount: number;
      fee: number;
      actualAmount: number;
      status: string;
      bankName: string;
      cardNumberLast4: string;
      cardHolder: string;
      rejectReason: string | null;
      processedAt: string | null;
      createdAt: string;
    }>(`/api/v1/withdraw/${id}`);
  }
}

export default new ApiService();
