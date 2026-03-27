import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Filter } from "lucide-react";
import { apiGetFinanceJournal } from "@/services/api/finance.api";
import type { FinanceJournalEntry } from "@/types/finance.types";

export default function FinanceJournal() {
  const [entries, setEntries] = useState<FinanceJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "INCOME" | "EXPENSE">(
    "all"
  );

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiGetFinanceJournal();
        setEntries(data);
      } catch (e) {
        console.error("Failed to load finance journal:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = entries.filter((e) => {
    const matchesType =
      typeFilter === "all" ? true : e.type === typeFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      e.description.toLowerCase().includes(term) ||
      e.performedBy?.name?.toLowerCase().includes(term) ||
      `${e.performedBy?.firstName ?? ""} ${e.performedBy?.lastName ?? ""}`
        .toLowerCase()
        .includes(term) ||
      e.student?.name?.toLowerCase().includes(term);
    return matchesType && matchesSearch;
  });

  const formatDate = (value: string | Date) =>
    new Date(value).toLocaleString();

  const formatAmount = (amount: number) =>
    `${amount.toLocaleString()} $`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Journal des Écritures Comptables
        </h1>
        <p className="text-muted-foreground">
          Suivi détaillé de toutes les opérations financières (qui a fait quoi,
          quand et pour quel élève).
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Écritures récentes</CardTitle>
              <CardDescription>
                Paiements, frais, dépenses et autres mouvements comptables.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-60">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher (élève, agent, libellé...)"
                  className="pl-9"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(v: "all" | "INCOME" | "EXPENSE") =>
                  setTypeFilter(v)
                }
              >
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="INCOME">Recettes</SelectItem>
                  <SelectItem value="EXPENSE">Dépenses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Élève / Tiers</TableHead>
                  <TableHead>Effectué par</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Chargement du journal...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      Aucune écriture trouvée.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(entry.date || entry.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            entry.type === "INCOME"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {entry.type === "INCOME" ? "Recette" : "Dépense"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[260px] truncate">
                        {entry.description}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatAmount(entry.amount)}
                      </TableCell>
                      <TableCell>
                        {entry.student?.name ||
                          entry.thirdParty ||
                          "—"}
                      </TableCell>
                      <TableCell>
                        {entry.recordedByName ?? (
                          entry.performedBy?.name ||
                          `${entry.performedBy?.firstName ?? ""} ${entry.performedBy?.lastName ?? ""}`.trim() ||
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
