/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { QrCode, Download, RefreshCw, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateQRCodeData, generateQRCodeImage, downloadQRCode } from "@/lib/qrcode";
import { apiGetAllClasses } from "@/services/api/classes.api";
import { apiGetAllSubjects } from "@/services/api/subjects.api";
import { Class, Subject } from "@/types";

const recentScans: any[] = [];

export default function QRScanner() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [qrData, setQrData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [classesData, subjectsData] = await Promise.all([
          apiGetAllClasses(),
          apiGetAllSubjects()
        ]);
        setClasses(classesData);
        setSubjects(subjectsData);
      } catch (err) {
        console.error("Failed to load QR scanner data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateQR = async () => {
    if (!selectedClass || !selectedCourse) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une classe et un cours.",
        variant: "destructive",
      });
      return;
    }

    const classInfo = classes.find(c => c.id === selectedClass);
    const subjectInfo = subjects.find(s => s.id === selectedCourse);

    if (!classInfo || !subjectInfo) return;

    const data = generateQRCodeData(
      selectedClass,
      `${selectedClass}-${selectedCourse}`,
      subjectInfo.name,
      classInfo.name
    );

    try {
      const imageUrl = await generateQRCodeImage(data);
      setQrCodeImage(imageUrl);
      setQrData(data);
      toast({
        title: "QR Code généré",
        description: `QR Code pour ${subjectInfo.name} - ${classInfo.name}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le QR Code.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!qrData) return;
    try {
      await downloadQRCode(qrData, `QRCode_${qrData.className}_${qrData.subjectName}`);
      toast({ title: "Téléchargement", description: "Le QR Code a été téléchargé." });
    } catch {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Scanner QR Code</h1>
        <p className="text-muted-foreground">Générez et scannez des QR codes pour le pointage</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Générer un QR Code</CardTitle>
            <CardDescription>Créez un QR code unique pour l'appel du cours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Classe</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une classe" /></SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Matière</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une matière" /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleGenerateQR} className="w-full gap-2">
              <QrCode className="h-4 w-4" />
              Générer le QR Code
            </Button>

            {qrCodeImage && (
              <div className="mt-6 flex flex-col items-center space-y-4">
                <img src={qrCodeImage} alt="QR Code" className="rounded-lg border border-border" />
                <p className="text-sm text-muted-foreground">
                  {qrData?.subjectName} - {qrData?.className}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expire: {new Date(qrData?.expiresAt).toLocaleTimeString("fr-FR")}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />Télécharger
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleGenerateQR}>
                    <RefreshCw className="mr-2 h-4 w-4" />Régénérer
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scans récents</CardTitle>
            <CardDescription>Derniers pointages effectués</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${scan.status === "success" ? "bg-green-100" : "bg-yellow-100"}`}>
                      <CheckCircle className={`h-5 w-5 ${scan.status === "success" ? "text-green-600" : "text-yellow-600"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{scan.name}</p>
                      <p className="text-sm text-muted-foreground">{scan.status === "success" ? "Présent" : "En retard"}</p>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{scan.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pointage manuel</CardTitle>
          <CardDescription>Entrez le matricule de l'élève pour un pointage manuel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input placeholder="Entrez le matricule de l'élève" className="max-w-sm" />
            <Button>Pointer</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}