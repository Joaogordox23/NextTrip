import { SignJWT, jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET || "fallback_secret_for_development_only_123"
);

export type TokenPayload = {
    id: string;
    email: string;
    role: "ADMIN" | "CLIENT";
};

export async function signToken(payload: TokenPayload, expiresIn: string = "15m") {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresIn)
        .sign(SECRET_KEY);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, SECRET_KEY);
        return payload as TokenPayload;
    } catch (error) {
        return null;
    }
}
