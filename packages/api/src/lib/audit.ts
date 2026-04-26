/**
 * Audit log helper.
 *
 * Records admin actions for security and accountability.
 * Failures are swallowed so they never break the underlying mutation.
 */
export async function logAction(
  prisma: any,
  params: {
    actorId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    metadata?: any;
  }
) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: params.metadata,
      },
    });
  } catch (err) {
    // Don't let audit failures break the action.
    // eslint-disable-next-line no-console
    console.error("[audit] Failed to write audit log", err);
  }
}
