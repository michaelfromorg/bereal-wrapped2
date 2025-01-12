// lib/bereal.ts
interface BeRealMemory {
  memoryDay: string;
  mainPostPrimaryMedia: { url: string; width: number; height: number };
  mainPostSecondaryMedia: { url: string; width: number; height: number };
}

export class BeRealClient {
  private static BASE_URL = "https://berealapi.fly.dev";
  private token: string | null = null;

  constructor(token?: string) {
    this.token = token ?? null;
  }

  // TODO(michaelfromyeg): do I need this?
  setToken(token: string) {
    this.token = token;
  }

  async requestCode(phone: string): Promise<string> {
    const response = await fetch(`${BeRealClient.BASE_URL}/login/send-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    if (!response.ok) {
      throw new Error("Failed to send verification code");
    }

    const data = await response.json();
    return data.data.otpSession.sessionInfo;
  }

  async verifyCode(sessionInfo: string, code: string): Promise<string> {
    const response = await fetch(`${BeRealClient.BASE_URL}/login/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        otpSession: sessionInfo,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to verify code");
    }

    const data = await response.json();
    this.token = data.data.token;
    return this.token ?? "";
  }

  async getMemories(): Promise<BeRealMemory[]> {
    if (!this.token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${BeRealClient.BASE_URL}/friends/mem-feed`, {
      headers: { token: this.token },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch memories");
    }

    const data = await response.json();
    return data.data.data;
  }
}

export const berealClient = new BeRealClient();
