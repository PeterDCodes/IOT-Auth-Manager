import axios from "axios";

const REQUIRED_DEVICE_FIELDS = ["name", "serial", "mac_addr", "device_ip"];

export const createMemoryStorage = () => {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
};

const readTokenExpiry = (token) => {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)).exp ?? null;
  } catch {
    return null;
  }
};

export class AuthClient {
  constructor({
    baseURL,
    authBaseURL = baseURL,
    apiBaseURL = baseURL ?? authBaseURL,
    cdDevice = null,
    storage = createMemoryStorage(),
    storageKeyPrefix = "authClient",
    registerPath = "/auth/register",
    refreshPath = "/auth/refresh",
    refreshLeewaySeconds = 30,
    axiosOptions = {}
  } = {}) {
    if (!authBaseURL) {
      throw new TypeError("AuthClient requires baseURL or authBaseURL");
    }

    if (!apiBaseURL) {
      throw new TypeError("AuthClient requires baseURL or apiBaseURL");
    }

    if (!storage?.getItem || !storage?.setItem || !storage?.removeItem) {
      throw new TypeError("storage must implement getItem, setItem, and removeItem");
    }

    this.cdDevice = cdDevice;
    this.secret = null;
    this.accessToken = null;
    this.refreshPromise = null;
    this.storage = storage;
    this.storageKeys = {
      cdDevice: `${storageKeyPrefix}.cdDevice`,
      secret: `${storageKeyPrefix}.secret`
    };
    this.registerPath = registerPath;
    this.refreshPath = refreshPath;
    this.refreshLeewaySeconds = refreshLeewaySeconds;

    this.authHttp = axios.create({ ...axiosOptions, baseURL: authBaseURL });
    this.http = axios.create({ ...axiosOptions, baseURL: apiBaseURL });

    this.http.interceptors.request.use(async (config) => {
      if (config.skipAuth === true) {
        return config;
      }

      const token = await this.getAccessToken();
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.http.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || !originalRequest || originalRequest._authRetry || originalRequest.skipAuth === true) {
          throw error;
        }

        originalRequest._authRetry = true;
        this.accessToken = null;
        const token = await this.getAccessToken();
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${token}`;

        return this.http.request(originalRequest);
      }
    );
  }

  async register(device, { registrationCode } = {}) {
    const missingFields = REQUIRED_DEVICE_FIELDS.filter((field) => device?.[field] == null);
    if (missingFields.length > 0) {
      throw new TypeError(`Missing required device fields: ${missingFields.join(", ")}`);
    }

    const config = registrationCode
      ? { headers: { "x-registration-code": registrationCode } }
      : undefined;
    const registration = Object.fromEntries(
      REQUIRED_DEVICE_FIELDS.map((field) => [field, device[field]])
    );
    const response = await this.authHttp.post(this.registerPath, registration, config);
    const cdDevice = response.data?.cd_device;
    const secret = response.data?.secret;

    if (cdDevice == null) {
      throw new Error("Registration response did not include cd_device");
    }

    if (!secret) {
      throw new Error("Registration response did not include a secret");
    }

    this.cdDevice = cdDevice;
    this.secret = secret;
    this.accessToken = null;
    await this.storage.setItem(this.storageKeys.cdDevice, cdDevice);
    await this.storage.setItem(this.storageKeys.secret, secret);

    return response.data;
  }

  async requestRegistration(device, options) {
    return this.register(device, options);
  }

  async refresh() {
    const { cdDevice, secret } = await this.getDeviceCredentials();
    if (cdDevice == null || !secret) {
      throw new Error("Device registration is required before requesting an access token");
    }

    const response = await this.authHttp.post(this.refreshPath, {
      cd_device: cdDevice,
      secret
    });
    const credential = response.data;

    if (!credential?.access_token) {
      throw new Error("Refresh response did not include an access token");
    }

    this.accessToken = credential.access_token;
    return credential;
  }

  async requestRefresh() {
    return this.refresh();
  }

  async getAccessToken() {
    if (this.isAccessTokenUsable()) {
      return this.accessToken;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.refresh().finally(() => {
        this.refreshPromise = null;
      });
    }

    const credential = await this.refreshPromise;
    return credential.access_token;
  }

  async getDeviceCredentials() {
    const storedCdDevice = await this.storage.getItem(this.storageKeys.cdDevice);
    const storedSecret = await this.storage.getItem(this.storageKeys.secret);

    return {
      cdDevice: this.cdDevice ?? storedCdDevice,
      secret: this.secret ?? storedSecret
    };
  }

  isAccessTokenUsable() {
    if (!this.accessToken) {
      return false;
    }

    const expiresAt = readTokenExpiry(this.accessToken);
    if (expiresAt == null) {
      return false;
    }

    return expiresAt > Math.floor(Date.now() / 1000) + this.refreshLeewaySeconds;
  }

  async clear() {
    this.cdDevice = null;
    this.secret = null;
    this.accessToken = null;
    this.refreshPromise = null;
    await this.storage.removeItem(this.storageKeys.cdDevice);
    await this.storage.removeItem(this.storageKeys.secret);
  }
}

export default AuthClient;
