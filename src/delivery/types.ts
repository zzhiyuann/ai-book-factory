export interface DeliveryPayload {
  filePath: string;
  title: string;
  caption?: string;
  mimeType?: string;
}

export interface DeliveryPlugin {
  name: string;
  isConfigured(): boolean;
  configure?(): Promise<void>;
  deliver(payload: DeliveryPayload): Promise<boolean>;
}
