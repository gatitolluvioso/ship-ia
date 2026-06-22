import nodemailer from "nodemailer";

export type SendReportEmailInput = {
  to: string;
  projectName: string;
  pdfBuffer: Buffer;
  fileName: string;
};

export async function sendReportEmail({
  fileName,
  pdfBuffer,
  projectName,
  to,
}: SendReportEmailInput) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const fromAddress = process.env.SMTP_FROM || user;

  if (!host || !user || !pass || !fromAddress) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.sendMail({
    from: fromAddress,
    to,
    subject: `Reporte SHIP IA - ${projectName}`,
    text: `Hola,\n\nAdjuntamos el reporte tecnico generado por SHIP IA para el proyecto "${projectName}".\n\nSaludos,\nSHIP IA`,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  });
}
