import { logger } from "@/common/logger";

export interface JWTPayload {
	accountId: string;
	taxId: string;
	name: string;
	iat: number;
	exp: number;
}

export class JWTService {
	private readonly secret =
		Bun.env.JWT_SECRET || "dev-secret-key-change-in-production";
	private readonly expiresIn = 60 * 60 * 24 * 7; // 7 days

	// Constructor left empty as secret has a default

	async sign(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
		const now = Math.floor(Date.now() / 1000);
		const exp = now + this.expiresIn;

		const header = { alg: "HS256", typ: "JWT" };
		const claims = { ...payload, iat: now, exp };

		const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
		const payloadB64 = Buffer.from(JSON.stringify(claims)).toString(
			"base64url",
		);
		const message = `${headerB64}.${payloadB64}`;

		const signature = await this.createSignature(message);
		return `${message}.${signature}`;
	}

	async verify(token: string): Promise<JWTPayload | null> {
		try {
			const [headerB64, payloadB64, signatureB64] = token.split(".");

			if (!headerB64 || !payloadB64 || !signatureB64) {
				return null;
			}

			const message = `${headerB64}.${payloadB64}`;
			const expectedSignature = await this.createSignature(message);

			if (signatureB64 !== expectedSignature) {
				logger.warn("Invalid JWT signature");
				return null;
			}

			const payloadStr = Buffer.from(payloadB64, "base64url").toString();
			const payload = JSON.parse(payloadStr) as JWTPayload;

			const now = Math.floor(Date.now() / 1000);
			if (payload.exp < now) {
				logger.warn("JWT token expired");
				return null;
			}

			return payload;
		} catch (error) {
			logger.error("JWT verification error", { error });
			return null;
		}
	}

	private async createSignature(message: string): Promise<string> {
		const encoder = new TextEncoder();
		const keyData = encoder.encode(this.secret);
		const messageData = encoder.encode(message);

		const key = await crypto.subtle.importKey(
			"raw",
			keyData,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const signature = await crypto.subtle.sign("HMAC", key, messageData);
		return Buffer.from(signature).toString("base64url");
	}
}
