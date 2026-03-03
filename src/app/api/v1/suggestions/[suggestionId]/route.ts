import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import * as z from "zod";

const resolveSuggestionSchema = z.object({
    status: z.enum(["APPROVED", "REJECTED"]),
    adminNotes: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ suggestionId: string }> }) {
    const { suggestionId } = await params;
    try {
        const role = req.headers.get("x-user-role");
        const adminId = req.headers.get("x-user-id");

        if (role !== "ADMIN" || !adminId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const data = resolveSuggestionSchema.parse(body);

        // Using transaction for atomic flow
        const resolvedSuggestion = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

            const suggestion = await tx.suggestion.findUnique({
                where: { id: suggestionId },
                include: { trip: true }
            });

            if (!suggestion) throw new Error("Suggestion not found");
            if (suggestion.status !== "PENDING") throw new Error("Suggestion already processed");

            // Se aprovada as flags alteram a arquitetura da viagem
            if (data.status === "APPROVED") {
                if (suggestion.type === "REMOVAL" && suggestion.itemId) {
                    await tx.itineraryItem.delete({ where: { id: suggestion.itemId } });
                }
                else if (suggestion.type === "NEW_POINT" && suggestion.proposedData) {
                    const proposedJSON = typeof suggestion.proposedData === 'string' ? JSON.parse(suggestion.proposedData) : suggestion.proposedData;
                    const targetDay = await tx.itineraryDay.findFirst({ where: { tripId: suggestion.tripId } }); // fallback fallback only

                    if (targetDay && proposedJSON.title) {
                        // creating new valid marker point
                        const lastItem = await tx.itineraryItem.findFirst({
                            where: { dayId: targetDay.id },
                            orderBy: { orderIndex: 'desc' },
                        });
                        const nextOrder = lastItem ? lastItem.orderIndex + 1 : 0;

                        await tx.itineraryItem.create({
                            data: {
                                title: proposedJSON.title,
                                description: proposedJSON.description || suggestion.content,
                                locationName: proposedJSON.locationName || "Localização a definir",
                                latitude: proposedJSON.latitude || 0,
                                longitude: proposedJSON.longitude || 0,
                                startTime: new Date(),
                                endTime: new Date(),
                                orderIndex: nextOrder,
                                dayId: proposedJSON.dayId || targetDay.id,
                            }
                        })
                    }
                }
            }

            // Update Suggestion details
            const updatedSuggestion = await tx.suggestion.update({
                where: { id: suggestion.id },
                data: {
                    status: data.status,
                    adminNotes: data.adminNotes,
                    reviewedAt: new Date(),
                    reviewedBy: adminId
                }
            });

            // Insert Audit Log action
            await tx.auditLog.create({
                data: {
                    action: `SUGGESTION_${data.status}`,
                    entityType: 'SUGGESTION',
                    entityId: suggestion.id,
                    userId: adminId,
                    tripId: suggestion.tripId,
                    suggestionId: suggestion.id,
                    metadata: data.adminNotes ? JSON.stringify({ notes: data.adminNotes }) : undefined,
                }
            });

            // Recalculating trip total costs would be done here via helper...

            return updatedSuggestion;
        });

        return NextResponse.json({ suggestion: resolvedSuggestion }, { status: 200 });

    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
