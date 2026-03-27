import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Download,
    Search,
    Calendar,
    Users,
    TrendingDown,
    TrendingUp,
    FileSpreadsheet,
    Printer,
    ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const REPORT_TYPES = [
    { id: "monthly", title: "Rapport Mensuel", description: "Résumé des entrées et sorties pour le mois en cours.", icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
    { id: "annual", title: "Rapport Annuel", description: "Bilan financier complet de l'année scolaire.", icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
    { id: "debtors", title: "Liste des Débiteurs", description: "Liste détaillée des élèves avec des impayés.", icon: Users, color: "text-orange-600", bg: "bg-orange-100" },
    { id: "expenses", title: "Analyse des Dépenses", description: "Répartition des coûts par catégorie.", icon: TrendingDown, color: "text-red-600", bg: "bg-red-100" },
];

export default function Reports() {
    const [loading, setLoading] = useState(false);

    const handleGenerate = (type: string) => {
        setLoading(true);
        // Simuler génération
        setTimeout(() => {
            setLoading(false);
            alert(`Rapport "${type}" généré ! (Fonctionnalité export PDF en attente d'intégration)`);
        }, 1500);
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Rapports Financiers</h1>
                <p className="text-muted-foreground">Générez et exportez des analyses détaillées de votre comptabilité.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {REPORT_TYPES.map((report) => (
                    <Card key={report.id} className="group hover:shadow-md transition-all cursor-pointer overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-2xl ${report.bg} ${report.color}`}>
                                        <report.icon className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg">{report.title}</h3>
                                        <p className="text-sm text-muted-foreground max-w-[280px]">{report.description}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <Button variant="ghost" size="icon" onClick={() => handleGenerate(report.id)}>
                                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center gap-3 border-t pt-4">
                                <Button variant="outline" size="sm" className="gap-2" onClick={() => handleGenerate(report.id)}>
                                    <Download className="h-4 w-4" />
                                    PDF
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    Excel
                                </Button>
                                <Button variant="ghost" size="sm" className="gap-2 ml-auto">
                                    <Printer className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Récents Rapports Générés</CardTitle>
                    <CardDescription>Téléchargez les derniers audits effectués.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { name: "Audit Fevrier 2026.pdf", date: "Il y a 2 jours", size: "1.2 MB" },
                            { name: "Liste_Impayes_P6_Mars.xlsx", date: "Aujourd'hui", size: "850 KB" }
                        ].map((file, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-sm font-medium">{file.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{file.date} • {file.size}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon"><Download className="h-4 w-4" /></Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
