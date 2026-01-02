"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { Resend as ResendComponent } from "@convex-dev/resend";
import { Resend } from "resend";
import { render } from "@react-email/render";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Hr,
  Preview,
} from "@react-email/components";
import {
  Document,
  Page,
  Text as PDFText,
  View,
  Image as PDFImage,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import QRCode from "qrcode";

export const resendComponent = new ResendComponent(components.resend, {
  testMode: false,
});

const resendSdk = new Resend(process.env.RESEND_API_KEY);

const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 15,
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    color: "#484848",
  },
  card: {
    border: "2px solid #e5e5e5",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
  },
  label: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    color: "#000000",
    marginBottom: 12,
  },
  qrContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  qrCode: {
    width: 150,
    height: 150,
  },
  ticketCode: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Courier",
  },
  footer: {
    marginTop: 15,
    textAlign: "center",
  },
  footerText: {
    fontSize: 10,
    color: "#898989",
  },
});

function TicketPDF({
  passengerName,
  operatorName,
  qrCodeDataUrl,
  qrCodeValue,
}: {
  passengerName: string;
  operatorName: string;
  qrCodeDataUrl: string;
  qrCodeValue: string;
}) {
  return (
    <Document>
      <Page size="A5" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <PDFText style={pdfStyles.title}>Boarding Pass</PDFText>
        </View>

        <View style={pdfStyles.card}>
          <PDFText style={pdfStyles.label}>PASSENGER</PDFText>
          <PDFText style={pdfStyles.value}>{passengerName}</PDFText>

          <PDFText style={pdfStyles.label}>OPERATOR</PDFText>
          <PDFText style={pdfStyles.value}>{operatorName}</PDFText>

          <View style={pdfStyles.qrContainer}>
            <PDFImage style={pdfStyles.qrCode} src={qrCodeDataUrl} />
            <PDFText style={pdfStyles.ticketCode}>{qrCodeValue}</PDFText>
          </View>
        </View>

        <View style={pdfStyles.footer}>
          <PDFText style={pdfStyles.footerText}>
            Show this QR code to the driver when boarding.
          </PDFText>
          <PDFText style={pdfStyles.footerText}>
            Keep this pass for your journey.
          </PDFText>
        </View>
      </Page>
    </Document>
  );
}

function InviteEmail({
  operatorName,
  role,
  inviteUrl,
}: {
  operatorName: string;
  role: string;
  inviteUrl: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>You&apos;ve been invited to join {operatorName} on Savari</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Text style={logo}>Savari</Text>
            <Text style={heading}>You&apos;re Invited!</Text>
            <Text style={paragraph}>
              You have been invited to join <strong>{operatorName}</strong> as a{" "}
              <strong>{role}</strong>.
            </Text>
            <Button style={button} href={inviteUrl}>
              Accept Invitation
            </Button>
            <Hr style={hr} />
            <Text style={footer}>
              This invitation will expire in 7 days. If you didn&apos;t expect this
              invitation, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function TicketEmail({
  passengerName,
  operatorName,
  qrCodeDataUrl,
  qrCodeValue,
}: {
  passengerName: string;
  operatorName: string;
  qrCodeDataUrl: string;
  qrCodeValue: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Your Savari ticket for {operatorName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={section}>
            <Text style={logo}>Savari</Text>
            <Text style={heading}>Your Ticket is Ready!</Text>
            <Text style={paragraph}>
              Hello <strong>{passengerName}</strong>,
            </Text>
            <Text style={paragraph}>
              Your ticket for <strong>{operatorName}</strong> has been created.
              Show this QR code to the driver when boarding.
            </Text>
            <Section style={qrContainer}>
              <Img
                src={qrCodeDataUrl}
                width="200"
                height="200"
                alt="QR Code Ticket"
                style={qrCode}
              />
            </Section>
            <Text style={ticketCode}>{qrCodeValue}</Text>
            <Hr style={hr} />
            <Text style={footer}>
              Keep this email handy for your journey. You can also screenshot the
              QR code for offline access.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const section = {
  padding: "0 48px",
};

const logo = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#000",
  textAlign: "center" as const,
  margin: "20px 0",
};

const heading = {
  fontSize: "24px",
  letterSpacing: "-0.5px",
  lineHeight: "1.3",
  fontWeight: "400",
  color: "#484848",
  padding: "17px 0 0",
  textAlign: "center" as const,
};

const paragraph = {
  margin: "0 0 15px",
  fontSize: "15px",
  lineHeight: "1.4",
  color: "#3c4149",
};

const button = {
  backgroundColor: "#000",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "15px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "block",
  padding: "12px 20px",
  margin: "20px 0",
};

const hr = {
  borderColor: "#dfe1e4",
  margin: "42px 0 26px",
};

const footer = {
  fontSize: "13px",
  lineHeight: "1.4",
  color: "#898989",
};

const qrContainer = {
  textAlign: "center" as const,
  margin: "30px 0",
};

const qrCode = {
  margin: "0 auto",
  border: "1px solid #eee",
  borderRadius: "8px",
};

const ticketCode = {
  fontSize: "14px",
  fontFamily: "monospace",
  textAlign: "center" as const,
  color: "#666",
  backgroundColor: "#f4f4f4",
  padding: "8px 16px",
  borderRadius: "4px",
  margin: "0 auto",
  display: "inline-block",
};

export const sendInviteEmail = action({
  args: {
    email: v.string(),
    operatorName: v.string(),
    role: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const siteUrl = process.env.SITE_URL ?? "https://savari.io";
    const inviteUrl = `${siteUrl}/sign-up?invite=${args.token}`;

    const html = await render(
      <InviteEmail
        operatorName={args.operatorName}
        role={args.role}
        inviteUrl={inviteUrl}
      />
    );

    await resendComponent.sendEmail(ctx, {
      from: "Savari <noreply@savari.io>",
      to: args.email,
      subject: `You're invited to join ${args.operatorName} on Savari`,
      html,
    });
  },
});

export const sendTicketEmail = action({
  args: {
    email: v.string(),
    passengerName: v.string(),
    operatorName: v.string(),
    qrCodeValue: v.string(),
  },
  handler: async (ctx, args) => {
    const qrCodeDataUrl = await QRCode.toDataURL(args.qrCodeValue, {
      width: 400,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    const html = await render(
      <TicketEmail
        passengerName={args.passengerName}
        operatorName={args.operatorName}
        qrCodeDataUrl={qrCodeDataUrl}
        qrCodeValue={args.qrCodeValue}
      />
    );

    const pdfBuffer = await renderToBuffer(
      <TicketPDF
        passengerName={args.passengerName}
        operatorName={args.operatorName}
        qrCodeDataUrl={qrCodeDataUrl}
        qrCodeValue={args.qrCodeValue}
      />
    );

    await resendSdk.emails.send({
      from: "Savari <noreply@savari.io>",
      to: args.email,
      subject: `Your Savari Ticket for ${args.operatorName}`,
      html,
      attachments: [
        {
          filename: `savari-ticket-${args.qrCodeValue}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
  },
});
