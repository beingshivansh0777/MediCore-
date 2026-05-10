import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendAppointmentConfirmationEmail = async ({
  to, patientName, doctorName, speciality, date, time, fees, appointmentId
}) => {
  if (!to) return;

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    subject: `Appointment Confirmed – ${doctorName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#0f766e,#0ea5e9);border-radius:16px 16px 0 0;padding:40px 32px 32px;">
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#059669;letter-spacing:1px;">MediCore</h1>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);letter-spacing:2px;text-transform:uppercase;">HealthCare Solutions</p>
              <div style="width:48px;height:2px;background:rgba(255,255,255,0.4);margin:20px auto;border-radius:2px;"></div>
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:999px;padding:6px 20px;">
                <span style="font-size:13px;color:#ffffff;font-weight:500;">✅ Appointment Confirmed</span>
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:15px;color:#64748b;">Hello,</p>
              <h2 style="margin:0 0 20px;font-size:22px;font-weight:600;color:#0f172a;">Hi ${patientName} 👋</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                Your appointment has been successfully booked and confirmed. Here are your appointment details:
              </p>

              <!-- Appointment Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:16px 20px;width:40%;background:#f8fafc;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Doctor</span>
                  </td>
                  <td style="padding:16px 20px;">
                    <span style="font-size:15px;font-weight:600;color:#0f172a;">${doctorName}</span><br/>
                    <span style="font-size:13px;color:#0ea5e9;">${speciality}</span>
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:16px 20px;background:#ffffff;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">📅 Date</span>
                  </td>
                  <td style="padding:16px 20px;background:#ffffff;">
                    <span style="font-size:15px;font-weight:500;color:#0f172a;">${formattedDate}</span>
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:16px 20px;background:#f8fafc;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">🕐 Time</span>
                  </td>
                  <td style="padding:16px 20px;background:#f8fafc;">
                    <span style="font-size:15px;font-weight:500;color:#0f172a;">${time}</span>
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:16px 20px;background:#ffffff;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">💳 Amount Paid</span>
                  </td>
                  <td style="padding:16px 20px;background:#ffffff;">
                    <span style="font-size:16px;font-weight:700;color:#0f766e;">₹${fees}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;background:#f8fafc;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">🔖 Booking ID</span>
                  </td>
                  <td style="padding:16px 20px;background:#f8fafc;">
                    <span style="font-size:12px;font-weight:500;color:#64748b;font-family:monospace;">${appointmentId}</span>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#eff6ff;border-left:4px solid #0ea5e9;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#1e40af;line-height:1.6;">
                      <strong>📌 Important Reminders:</strong><br/>
                      • Please arrive <strong>10 minutes early</strong> for your appointment<br/>
                      • Carry a valid ID and any previous medical records<br/>
                      • To cancel or reschedule, contact us at least 24 hours in advance
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">
                If you have any questions, feel free to reach out. We look forward to seeing you!
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#059669;">MediCore</p>
              <p style="margin:0 0 16px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;">HealthCare Solutions</p>
              <div style="width:32px;height:1px;background:#334155;margin:0 auto 16px;"></div>
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                This is an automated email. Please do not reply to this message.<br/>
                © ${new Date().getFullYear()} MediCore. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  });
};



//Service Confirmational Email 

export const sendServiceConfirmationEmail = async ({
  to, patientName, serviceName, date, time, fees, appointmentId
}) => {
  if (!to) return;

  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL,
    to,
    subject: `Service Booking Confirmed – ${serviceName}`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#7c3aed,#0ea5e9);border-radius:16px 16px 0 0;padding:40px 32px 32px;">
              <div style="width:64px;height:64px;background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🩺</span>
              </div>
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#059669;letter-spacing:1px;">MediCore</h1>
              <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.75);letter-spacing:2px;text-transform:uppercase;">HealthCare Solutions</p>
              <div style="width:48px;height:2px;background:rgba(255,255,255,0.4);margin:20px auto;border-radius:2px;"></div>
              <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:999px;padding:6px 20px;">
                <span style="font-size:13px;color:#ffffff;font-weight:500;">✅ Service Booking Confirmed</span>
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px;">
              <p style="margin:0 0 8px;font-size:15px;color:#64748b;">Hello,</p>
              <h2 style="margin:0 0 20px;font-size:22px;font-weight:600;color:#0f172a;">Hi ${patientName} 👋</h2>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                Your service booking has been successfully confirmed. Here are your booking details:
              </p>

              <!-- Booking Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:16px 20px;width:40%;background:#f8fafc;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">Service</span>
                  </td>
                  <td style="padding:16px 20px;">
                    <span style="font-size:15px;font-weight:600;color:#0f172a;">${serviceName}</span>
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:16px 20px;background:#ffffff;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">📅 Date</span>
                  </td>
                  <td style="padding:16px 20px;background:#ffffff;">
                    <span style="font-size:15px;font-weight:500;color:#0f172a;">${formattedDate}</span>
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:16px 20px;background:#f8fafc;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">🕐 Time</span>
                  </td>
                  <td style="padding:16px 20px;background:#f8fafc;">
                    <span style="font-size:15px;font-weight:500;color:#0f172a;">${time}</span>
                  </td>
                </tr>
                <tr style="border-bottom:1px solid #e2e8f0;">
                  <td style="padding:16px 20px;background:#ffffff;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">💳 Amount Paid</span>
                  </td>
                  <td style="padding:16px 20px;background:#ffffff;">
                    <span style="font-size:16px;font-weight:700;color:#7c3aed;">₹${fees}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;background:#f8fafc;">
                    <span style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;">🔖 Booking ID</span>
                  </td>
                  <td style="padding:16px 20px;background:#f8fafc;">
                    <span style="font-size:12px;font-weight:500;color:#64748b;font-family:monospace;">${appointmentId}</span>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;border-left:4px solid #7c3aed;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;color:#5b21b6;line-height:1.6;">
                      <strong>📌 Important Reminders:</strong><br/>
                      • Please arrive <strong>10 minutes early</strong> for your service<br/>
                      • Carry a valid ID and any relevant medical documents<br/>
                      • To cancel or reschedule, contact us at least 24 hours in advance
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:15px;color:#475569;line-height:1.7;">
                If you have any questions, feel free to reach out. We look forward to serving you!
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#0f172a;border-radius:0 0 16px 16px;padding:28px 40px;text-align:center;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#ffffff;">MediCore</p>
              <p style="margin:0 0 16px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1.5px;">HealthCare Solutions</p>
              <div style="width:32px;height:1px;background:#334155;margin:0 auto 16px;"></div>
              <p style="margin:0;font-size:12px;color:#475569;line-height:1.6;">
                This is an automated email. Please do not reply to this message.<br/>
                © ${new Date().getFullYear()} MediCore. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `,
  });
};