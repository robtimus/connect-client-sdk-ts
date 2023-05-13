import { Device } from "../ext";
import { HttpResponse } from "../ext/http";
import { sdkIdentifier } from "../util/metadata";
import * as api from "./model";

interface Metadata {
  readonly screenSize: string;
  readonly platformIdentifier: string;
  readonly sdkIdentifier: string;
  readonly sdkCreator: string;
}

export interface CommunicatorConfiguration {
  clientSessionId: string;
  customerId: string;
  clientApiUrl: string;
  assetUrl: string;
}

function createURL(config: CommunicatorConfiguration, apiVersion: string, path: string): string {
  const baseUrl = config.clientApiUrl.endsWith("/") ? config.clientApiUrl : config.clientApiUrl + "/";
  return `${baseUrl}${apiVersion}/${config.customerId}/${path}`;
}

function createClientMetaInfo(device: Device): string {
  const deviceInformation = device.getDeviceInformation();
  const metadata: Metadata = {
    screenSize: `${deviceInformation.innerWidth}x${deviceInformation.innerHeight}`,
    platformIdentifier: deviceInformation.platformIdentifier,
    sdkIdentifier: sdkIdentifier,
    sdkCreator: "robtimus",
  };
  return btoa(JSON.stringify(metadata));
}

function createAuthorization(config: CommunicatorConfiguration): string {
  return "GCS v1Client:" + config.clientSessionId;
}

function processResponse<T>(response: HttpResponse): Promise<T> {
  if (response.statusCode / 100 === 2) {
    return Promise.resolve(response.body as T);
  }
  return Promise.reject(response);
}

export class Communicator {
  constructor(private readonly config: CommunicatorConfiguration, private readonly device: Device) {}

  async getPublicKey(): Promise<api.PublicKey> {
    const url = createURL(this.config, "v1", "crypto/publickey");
    return this.device
      .getHttpClient()
      .get(url)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getThirdPartyStatus(paymentId: string): Promise<api.ThirdPartyStatusResponse> {
    const url = createURL(this.config, "v1", `payments/${paymentId}/thirdpartystatus`);
    return this.device
      .getHttpClient()
      .get(url)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getPaymentProductGroups(params: api.PaymentProductGroupsParams): Promise<api.PaymentProductGroups> {
    const url = createURL(this.config, "v1", "productgroups");
    return this.device
      .getHttpClient()
      .get(url)
      .queryParam("countryCode", params.countryCode)
      .queryParam("currencyCode", params.currencyCode)
      .queryParam("locale", params.locale)
      .queryParam("amount", params.amount)
      .queryParam("isRecurring", params.isRecurring)
      .queryParams("hide", params.hide)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getPaymentProductGroup(paymentProductGroupId: string, params: api.PaymentProductGroupParams): Promise<api.PaymentProductGroup> {
    const url = createURL(this.config, "v1", `productgroups/${paymentProductGroupId}`);
    return this.device
      .getHttpClient()
      .get(url)
      .queryParam("countryCode", params.countryCode)
      .queryParam("currencyCode", params.currencyCode)
      .queryParam("locale", params.locale)
      .queryParam("amount", params.amount)
      .queryParam("isRecurring", params.isRecurring)
      .queryParams("hide", params.hide)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getPaymentProductGroupDeviceFingerprint(
    paymentProductGroupId: string,
    request: api.DeviceFingerprintRequest
  ): Promise<api.DeviceFingerprintResponse> {
    const url = createURL(this.config, "v1", `productgroups/${paymentProductGroupId}/deviceFingerprint`);
    return this.device
      .getHttpClient()
      .post(url, request)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getPaymentProducts(params: api.PaymentProductsParams): Promise<api.PaymentProducts> {
    const url = createURL(this.config, "v1", "products");
    return this.device
      .getHttpClient()
      .get(url)
      .queryParam("countryCode", params.countryCode)
      .queryParam("currencyCode", params.currencyCode)
      .queryParam("locale", params.locale)
      .queryParam("amount", params.amount)
      .queryParam("isRecurring", params.isRecurring)
      .queryParams("hide", params.hide)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getPaymentProduct(paymentProductId: number, params: api.PaymentProductParams): Promise<api.PaymentProduct> {
    const url = createURL(this.config, "v1", `products/${paymentProductId}`);
    return this.device
      .getHttpClient()
      .get(url)
      .queryParam("countryCode", params.countryCode)
      .queryParam("currencyCode", params.currencyCode)
      .queryParam("locale", params.locale)
      .queryParam("amount", params.amount)
      .queryParam("isRecurring", params.isRecurring)
      .queryParams("hide", params.hide)
      .queryParam("forceBasicFlow", params.forceBasicFlow)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getPaymentProductDirectory(paymentProductId: number, params: api.DirectoryParams): Promise<api.Directory> {
    const url = createURL(this.config, "v1", `products/${paymentProductId}/directory`);
    return this.device
      .getHttpClient()
      .get(url)
      .queryParam("countryCode", params.countryCode)
      .queryParam("currencyCode", params.currencyCode)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getCustomerDetails(paymentProductId: number, request: api.GetCustomerDetailsRequest): Promise<api.GetCustomerDetailsResponse> {
    const url = createURL(this.config, "v1", `products/${paymentProductId}/customerDetails`);
    return this.device
      .getHttpClient()
      .post(url, request)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getPaymentProductDeviceFingerprint(paymentProductId: number, request: api.DeviceFingerprintRequest): Promise<api.DeviceFingerprintResponse> {
    const url = createURL(this.config, "v1", `products/${paymentProductId}/deviceFingerprint`);
    return this.device
      .getHttpClient()
      .post(url, request)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getPaymentProductNetworks(paymentProductId: number, params: api.PaymentProductNetworksParams): Promise<api.PaymentProductNetworksResponse> {
    const url = createURL(this.config, "v1", `products/${paymentProductId}/networks`);
    return this.device
      .getHttpClient()
      .get(url)
      .queryParam("countryCode", params.countryCode)
      .queryParam("currencyCode", params.currencyCode)
      .queryParam("amount", params.amount)
      .queryParam("isRecurring", params.isRecurring)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async createPaymentProductSession(
    paymentProductId: number,
    request: api.CreatePaymentProductSessionRequest
  ): Promise<api.CreatePaymentProductSessionResponse> {
    const url = createURL(this.config, "v1", `products/${paymentProductId}/sessions`);
    return this.device
      .getHttpClient()
      .post(url, request)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async convertAmount(params: api.ConvertAmountParams): Promise<api.ConvertAmountResponse> {
    const url = createURL(this.config, "v1", `services/convert/amount`);
    return this.device
      .getHttpClient()
      .get(url)
      .queryParam("source", params.source)
      .queryParam("target", params.target)
      .queryParam("amount", params.amount)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }

  async getIINDetails(request: api.GetIINDetailsRequest): Promise<api.GetIINDetailsResult> {
    const url = createURL(this.config, "v1", `services/getIINdetails`);
    return this.device
      .getHttpClient()
      .post(url, request)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => {
        if (response.statusCode / 100 === 2) {
          const status: api.GetIINDetailsSuccessStatus = "KNOWN";
          const json = response.body as api.GetIINDetailsResponse;
          return Object.assign({ status }, json);
        }
        if (response.statusCode === 404) {
          const status: api.GetIINDetailsErrorStatus = "UNKNOWN";
          const json = response.body as api.ErrorResponse;
          return Promise.resolve(Object.assign({ status }, json));
        }
        return Promise.reject(response);
      });
  }

  async getPrivacyPolicy(params: api.GetPrivacyPolicyParams): Promise<api.GetPrivacyPolicyResponse> {
    const url = createURL(this.config, "v1", `services/privacypolicy`);
    return this.device
      .getHttpClient()
      .get(url)
      .queryParam("locale", params.locale)
      .queryParam("paymentProductId", params.paymentProductId)
      .header("X-GCS-ClientMetaInfo", createClientMetaInfo(this.device))
      .header("Authorization", createAuthorization(this.config))
      .send()
      .then((response) => processResponse(response));
  }
}

Object.freeze(Communicator.prototype);
