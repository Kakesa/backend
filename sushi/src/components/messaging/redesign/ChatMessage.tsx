import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Download, MoreHorizontal, Smile, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
    message: any;
    isOwn: boolean;
    senderAvatar?: string;
    senderName: string;
}

export function ChatMessage({ message, isOwn, senderAvatar, senderName }: ChatMessageProps) {
    const renderContent = () => {
        switch (message.type) {
            case "image":
                return (
                    <div className="grid grid-cols-2 gap-2 mt-2 rounded-2xl overflow-hidden max-w-sm">
                        {message.metadata?.images?.map((img: string, i: number) => (
                            <img key={i} src={img} alt="attachment" className="w-full h-32 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                        ))}
                    </div>
                );
            case "audio":
                return (
                    <div className="flex items-center gap-3 bg-blue-600/10 dark:bg-blue-600/20 p-3 rounded-2xl min-w-[200px]">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                            <Play className="w-5 h-5 text-white fill-current" />
                        </div>
                        <div className="flex-1">
                            <div className="h-1.5 bg-blue-600/20 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 w-1/3" />
                            </div>
                            <span className="text-[10px] mt-1 block font-medium opacity-60">0:05</span>
                        </div>
                    </div>
                );
            case "file":
                return (
                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-2xl border min-w-[200px]">
                        <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                            <div className="w-6 h-8 bg-blue-100 rounded border-2 border-blue-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{message.metadata?.fileName || "Document.pdf"}</p>
                            <p className="text-[10px] text-muted-foreground">{message.metadata?.fileSize || "80 Bytes"} • <button className="text-primary font-bold">Download</button></p>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className={cn(
                        "p-4 rounded-3xl text-sm leading-relaxed shadow-sm",
                        isOwn ? "bg-blue-600 text-white rounded-tr-none" : "bg-white dark:bg-muted/50 rounded-tl-none border"
                    )}>
                        {message.content}
                    </div>
                );
        }
    };

    return (
        <div className={cn("flex gap-3 max-w-[85%]", isOwn ? "ml-auto flex-row-reverse" : "mr-auto")}>
            <Avatar className="h-10 w-10 mt-1 flex-shrink-0">
                <AvatarImage src={senderAvatar} />
                <AvatarFallback>{senderName?.[0]}</AvatarFallback>
            </Avatar>

            <div className={cn("flex flex-col gap-1", isOwn ? "items-end" : "items-start")}>
                <div className="flex items-center gap-2 mb-0.5 px-1">
                    <span className="text-xs font-bold">{senderName}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {!isOwn && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground cursor-pointer opacity-0 group-hover:opacity-100" />
                </div>

                {renderContent()}

                {message.reactions?.length > 0 && (
                    <div className="flex gap-1 mt-1">
                        {message.reactions.map((r: any, i: number) => (
                            <div key={i} className="bg-muted px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border border-background shadow-sm">
                                {r.emoji} <span className="font-bold">{r.count || 1}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
