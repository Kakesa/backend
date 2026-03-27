import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Pencil, 
  Highlighter, 
  Type, 
  Eraser, 
  Undo, 
  Redo, 
  Download, 
  Trash2,
  Circle,
  Square,
  ArrowRight,
  Check,
  X,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Annotation {
  id: string;
  type: "draw" | "highlight" | "text" | "shape" | "check" | "cross";
  color: string;
  points?: { x: number; y: number }[];
  text?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  shape?: "circle" | "rectangle" | "arrow";
}

interface AnnotationCanvasProps {
  documentUrl?: string;
  documentType?: "pdf" | "image";
  onSave?: (annotations: Annotation[]) => void;
  initialAnnotations?: Annotation[];
  readOnly?: boolean;
}

const COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#000000", // black
];

type Tool = "draw" | "highlight" | "text" | "eraser" | "check" | "cross" | "shape";

export function AnnotationCanvas({
  documentUrl,
  documentType = "image",
  onSave,
  initialAnnotations = [],
  readOnly = false,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations);
  const [currentTool, setCurrentTool] = useState<Tool>("draw");
  const [currentColor, setCurrentColor] = useState("#ef4444");
  const [brushSize, setBrushSize] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [history, setHistory] = useState<Annotation[][]>([initialAnnotations]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);

  // Dessiner toutes les annotations
  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner chaque annotation
    annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;

      switch (annotation.type) {
        case "draw":
          if (annotation.points && annotation.points.length > 0) {
            ctx.lineWidth = brushSize;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
          }
          break;

        case "highlight":
          if (annotation.points && annotation.points.length > 0) {
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 20;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.beginPath();
            ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach((point) => {
              ctx.lineTo(point.x, point.y);
            });
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
          break;

        case "text":
          if (annotation.text && annotation.x !== undefined && annotation.y !== undefined) {
            ctx.font = "16px sans-serif";
            ctx.fillText(annotation.text, annotation.x, annotation.y);
          }
          break;

        case "check":
          if (annotation.x !== undefined && annotation.y !== undefined) {
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(annotation.x, annotation.y);
            ctx.lineTo(annotation.x + 10, annotation.y + 10);
            ctx.lineTo(annotation.x + 25, annotation.y - 10);
            ctx.stroke();
          }
          break;

        case "cross":
          if (annotation.x !== undefined && annotation.y !== undefined) {
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(annotation.x, annotation.y);
            ctx.lineTo(annotation.x + 20, annotation.y + 20);
            ctx.moveTo(annotation.x + 20, annotation.y);
            ctx.lineTo(annotation.x, annotation.y + 20);
            ctx.stroke();
          }
          break;
      }
    });

    // Dessiner le tracé en cours
    if (currentPath.length > 0) {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentTool === "highlight" ? 20 : brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (currentTool === "highlight") {
        ctx.globalAlpha = 0.3;
      }
      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      currentPath.forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, [annotations, currentPath, currentColor, currentTool, brushSize]);

  useEffect(() => {
    drawAnnotations();
  }, [drawAnnotations]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly) return;

    const coords = getCanvasCoordinates(e);

    if (currentTool === "text") {
      setTextPosition(coords);
      return;
    }

    if (currentTool === "check" || currentTool === "cross") {
      const newAnnotation: Annotation = {
        id: `ann_${Date.now()}`,
        type: currentTool,
        color: currentTool === "check" ? "#22c55e" : "#ef4444",
        x: coords.x,
        y: coords.y,
      };
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
      return;
    }

    if (currentTool === "eraser") {
      // Trouver et supprimer l'annotation la plus proche
      const threshold = 20;
      const annotationToRemove = annotations.find((ann) => {
        if (ann.points) {
          return ann.points.some(
            (point) =>
              Math.abs(point.x - coords.x) < threshold &&
              Math.abs(point.y - coords.y) < threshold
          );
        }
        if (ann.x !== undefined && ann.y !== undefined) {
          return (
            Math.abs(ann.x - coords.x) < threshold &&
            Math.abs(ann.y - coords.y) < threshold
          );
        }
        return false;
      });

      if (annotationToRemove) {
        const newAnnotations = annotations.filter((a) => a.id !== annotationToRemove.id);
        setAnnotations(newAnnotations);
        addToHistory(newAnnotations);
      }
      return;
    }

    setIsDrawing(true);
    setCurrentPath([coords]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return;

    const coords = getCanvasCoordinates(e);
    setCurrentPath((prev) => [...prev, coords]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || readOnly) return;

    if (currentPath.length > 0) {
      const newAnnotation: Annotation = {
        id: `ann_${Date.now()}`,
        type: currentTool === "highlight" ? "highlight" : "draw",
        color: currentColor,
        points: currentPath,
      };
      const newAnnotations = [...annotations, newAnnotation];
      setAnnotations(newAnnotations);
      addToHistory(newAnnotations);
    }

    setIsDrawing(false);
    setCurrentPath([]);
  };

  const handleTextSubmit = () => {
    if (!textPosition || !textInput) return;

    const newAnnotation: Annotation = {
      id: `ann_${Date.now()}`,
      type: "text",
      color: currentColor,
      text: textInput,
      x: textPosition.x,
      y: textPosition.y,
    };
    const newAnnotations = [...annotations, newAnnotation];
    setAnnotations(newAnnotations);
    addToHistory(newAnnotations);
    setTextInput("");
    setTextPosition(null);
  };

  const addToHistory = (newAnnotations: Annotation[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newAnnotations);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setAnnotations(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setAnnotations(history[historyIndex + 1]);
    }
  };

  const clearAll = () => {
    setAnnotations([]);
    addToHistory([]);
  };

  const handleSave = () => {
    onSave?.(annotations);
  };

  const tools: { id: Tool; icon: React.ReactNode; label: string }[] = [
    { id: "draw", icon: <Pencil className="h-4 w-4" />, label: "Crayon" },
    { id: "highlight", icon: <Highlighter className="h-4 w-4" />, label: "Surligneur" },
    { id: "text", icon: <Type className="h-4 w-4" />, label: "Texte" },
    { id: "check", icon: <Check className="h-4 w-4" />, label: "Correct" },
    { id: "cross", icon: <X className="h-4 w-4" />, label: "Incorrect" },
    { id: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Gomme" },
  ];

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-muted rounded-lg">
          {/* Outils */}
          <div className="flex items-center gap-1 border-r pr-2">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={currentTool === tool.id ? "default" : "ghost"}
                size="icon"
                onClick={() => setCurrentTool(tool.id)}
                title={tool.label}
              >
                {tool.icon}
              </Button>
            ))}
          </div>

          {/* Couleurs */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" title="Couleur">
                <div
                  className="w-5 h-5 rounded-full border-2 border-background"
                  style={{ backgroundColor: currentColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="flex gap-1">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                      currentColor === color ? "border-primary" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setCurrentColor(color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Taille du pinceau */}
          <div className="flex items-center gap-2 px-2 border-r pr-4">
            <span className="text-xs text-muted-foreground">Taille:</span>
            <Slider
              value={[brushSize]}
              onValueChange={(v) => setBrushSize(v[0])}
              min={1}
              max={10}
              step={1}
              className="w-20"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={historyIndex === 0}
              title="Annuler"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              title="Rétablir"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearAll}
              title="Tout effacer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              className="ml-2"
            >
              <Download className="h-4 w-4 mr-1" />
              Sauvegarder
            </Button>
          </div>
        </div>
      )}

      {/* Zone de dessin */}
      <div
        ref={containerRef}
        className="relative border rounded-lg overflow-hidden bg-background"
      >
        {/* Image de fond (document) */}
        {documentUrl && (
          <img
            src={documentUrl}
            alt="Document à annoter"
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          />
        )}

        {/* Canvas d'annotation */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={cn(
            "w-full h-[600px]",
            !readOnly && currentTool === "draw" && "cursor-crosshair",
            !readOnly && currentTool === "text" && "cursor-text",
            !readOnly && currentTool === "eraser" && "cursor-cell"
          )}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Input de texte */}
        {textPosition && (
          <div
            className="absolute bg-background border rounded p-1 shadow-lg"
            style={{ left: textPosition.x, top: textPosition.y }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleTextSubmit()}
              onBlur={() => setTextPosition(null)}
              autoFocus
              className="outline-none text-sm w-40"
              placeholder="Tapez votre texte..."
            />
          </div>
        )}
      </div>

      {/* Placeholder si pas de document */}
      {!documentUrl && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucun document à annoter</p>
          <p className="text-sm">Le fichier soumis par l'élève apparaîtra ici</p>
        </div>
      )}
    </div>
  );
}
