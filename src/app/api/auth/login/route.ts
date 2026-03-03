import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import bcrypt from "bcrypt";
import { signToken } from "@/lib/auth/jwt";
import * as z from "zod";

const loginSchema = z.object({
    email: z.string().email("E-mail inválido."),
    password: z.string().min(1, "A senha é obrigatória."),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = loginSchema.parse(body);

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Credenciais inválidas." },
                { status: 401 }
            );
        }

        const passwordMatch = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatch) {
            return NextResponse.json(
                { error: "Credenciais inválidas." },
                { status: 401 }
            );
        }

        const token = await signToken({
            id: user.id,
            email: user.email,
            role: user.role,
        }, "7d");

        const response = NextResponse.json(
            {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    image: user.image,
                },
            },
            { status: 200 }
        );

        // Set cookie
        response.cookies.set({
            name: "accessToken",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: "/",
        });

        return response;
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Erro interno do servidor." },
            { status: 500 }
        );
    }
}
