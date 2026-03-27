import QRCode from "qrcode";

export interface QRCodeData {
  type: "attendance";
  classId: string;
  courseId: string;
  subjectName: string;
  className: string;
  date: string;
  sessionId: string;
  expiresAt: string;
}

export const generateQRCodeData = (
  classId: string,
  courseId: string,
  subjectName: string,
  className: string
): QRCodeData => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000); // Expire dans 30 minutes

  return {
    type: "attendance",
    classId,
    courseId,
    subjectName,
    className,
    date: now.toISOString().split("T")[0],
    sessionId: `${courseId}-${now.getTime()}`,
    expiresAt: expiresAt.toISOString(),
  };
};

export const generateQRCodeImage = async (data: QRCodeData): Promise<string> => {
  try {
    const qrDataString = JSON.stringify(data);
    const qrCodeDataUrl = await QRCode.toDataURL(qrDataString, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Erreur génération QR Code:", error);
    throw error;
  }
};

export const parseQRCodeData = (qrString: string): QRCodeData | null => {
  try {
    const data = JSON.parse(qrString) as QRCodeData;
    if (data.type !== "attendance") return null;
    return data;
  } catch {
    return null;
  }
};

export const isQRCodeValid = (data: QRCodeData): boolean => {
  const now = new Date();
  const expiresAt = new Date(data.expiresAt);
  return now < expiresAt;
};

export const downloadQRCode = async (data: QRCodeData, filename: string): Promise<void> => {
  try {
    const qrCodeDataUrl = await generateQRCodeImage(data);
    const link = document.createElement("a");
    link.href = qrCodeDataUrl;
    link.download = `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error("Erreur téléchargement QR Code:", error);
    throw error;
  }
};
