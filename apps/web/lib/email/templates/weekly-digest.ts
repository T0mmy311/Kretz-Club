export function weeklyDigestHtml(data: {
  memberFirstName: string;
  newMessages: number;
  newInvestments: Array<{ title: string; location: string | null; targetAmount: number; id: string }>;
  upcomingEvents: Array<{ title: string; startsAt: Date; location: string | null; id: string }>;
  appUrl: string;
}) {
  const formatDate = (d: Date) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const formatAmount = (a: number) => Number(a).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Kretz Club - Récap hebdomadaire</title></head>
    <body style="font-family: -apple-system, sans-serif; background: #080808; color: #fff; margin: 0; padding: 40px 20px;">
      <div style="max-width: 580px; margin: 0 auto; background: #0f0f0f; border: 1px solid #1f1f1f; border-radius: 12px; padding: 32px;">
        <h1 style="font-size: 22px; margin: 0 0 8px;">Kretz Club</h1>
        <p style="color: #888; margin: 0 0 32px;">Bonjour ${data.memberFirstName}, voici votre récap de la semaine.</p>

        <div style="border-top: 1px solid #1f1f1f; padding-top: 24px; margin-bottom: 24px;">
          <h2 style="font-size: 14px; color: #d4af37; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">💬 Activité</h2>
          <p style="margin: 0; font-size: 15px;">${data.newMessages} nouveaux messages dans vos channels</p>
        </div>

        ${data.newInvestments.length > 0 ? `
          <div style="border-top: 1px solid #1f1f1f; padding-top: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 14px; color: #d4af37; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px;">💼 Nouveaux deals</h2>
            ${data.newInvestments.map(i => `
              <a href="${data.appUrl}/investissements/${i.id}" style="display: block; padding: 16px; background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 8px; margin-bottom: 12px; color: #fff; text-decoration: none;">
                <div style="font-weight: 600; margin-bottom: 4px;">${i.title}</div>
                <div style="color: #888; font-size: 13px;">${i.location ?? ''} · ${formatAmount(i.targetAmount)}</div>
              </a>
            `).join('')}
          </div>
        ` : ''}

        ${data.upcomingEvents.length > 0 ? `
          <div style="border-top: 1px solid #1f1f1f; padding-top: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 14px; color: #d4af37; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 16px;">📅 Événements à venir</h2>
            ${data.upcomingEvents.map(e => `
              <a href="${data.appUrl}/evenements/${e.id}" style="display: block; padding: 16px; background: #0a0a0a; border: 1px solid #1f1f1f; border-radius: 8px; margin-bottom: 12px; color: #fff; text-decoration: none;">
                <div style="font-weight: 600; margin-bottom: 4px;">${e.title}</div>
                <div style="color: #888; font-size: 13px;">${formatDate(e.startsAt)} · ${e.location ?? ''}</div>
              </a>
            `).join('')}
          </div>
        ` : ''}

        <a href="${data.appUrl}/messagerie" style="display: inline-block; margin-top: 16px; padding: 12px 24px; background: #fff; color: #000; border-radius: 8px; text-decoration: none; font-weight: 600;">Ouvrir Kretz Club</a>

        <p style="color: #555; font-size: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #1f1f1f;">
          Vous recevez cet email car vous êtes membre du Kretz Club. <a href="${data.appUrl}/profil" style="color: #888;">Préférences email</a>
        </p>
      </div>
    </body>
    </html>
  `;
}
