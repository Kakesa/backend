import React from "react";
import { Search, MoreVertical, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
    contacts: any[];
    onlineUsers: any[];
    pinnedContacts: any[];
    selectedContactId?: string;
    onSelectContact: (contact: any) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
}

export function ChatSidebar({
    contacts,
    onlineUsers,
    pinnedContacts,
    selectedContactId,
    onSelectContact,
    searchTerm,
    onSearchChange,
}: ChatSidebarProps) {
    const getInitials = (name: string) => {
        return name?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";
    };

    return (
        <div className="w-80 border-r bg-background flex flex-col h-full">
            <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-bold">All Chats</h1>
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-muted-foreground cursor-pointer" />
                        <MoreVertical className="w-5 h-5 text-muted-foreground cursor-pointer" />
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="pl-9 bg-muted/50 border-none rounded-xl"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="px-4 pb-4 space-y-6">
                    {/* Online Now Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Online Now</h2>
                            <button className="text-xs font-semibold text-primary">View All</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {onlineUsers.map((user) => (
                                <div key={user.id} className="flex flex-col items-center gap-1 min-w-[50px] cursor-pointer" onClick={() => onSelectContact(user)}>
                                    <div className="relative">
                                        <Avatar className="h-12 w-12 border-2 border-background">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                        </Avatar>
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pinned Chat Section */}
                    {pinnedContacts.length > 0 && (
                        <div className="space-y-2">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pinned Chat</h2>
                            <div className="space-y-1">
                                {pinnedContacts.map((contact) => (
                                    <ContactItem
                                        key={contact.id}
                                        contact={contact}
                                        isActive={selectedContactId === contact.id}
                                        onClick={() => onSelectContact(contact)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Chat Section */}
                    <div className="space-y-2">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Chat</h2>
                        <div className="space-y-1">
                            {contacts.map((contact) => (
                                <ContactItem
                                    key={contact.id}
                                    contact={contact}
                                    isActive={selectedContactId === contact.id}
                                    onClick={() => onSelectContact(contact)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}

function ContactItem({ contact, isActive, onClick }: { contact: any; isActive: boolean; onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors",
                isActive ? "bg-accent shadow-sm" : "hover:bg-accent/50"
            )}
        >
            <div className="relative">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={contact.avatar} />
                    <AvatarFallback>{contact.name?.split(" ").map((n: string) => n[0]).join("")}</AvatarFallback>
                </Avatar>
                {contact.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <h3 className="font-semibold text-sm truncate">{contact.name}</h3>
                    <span className="text-[10px] text-muted-foreground">{contact.lastMessageTime || "10:20 PM"}</span>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                        {contact.isTyping ? <span className="text-green-500 italic">Typing...</span> : contact.lastMessage || "Have you called them?"}
                    </p>
                    {contact.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 rounded-full px-1 flex items-center justify-center text-[10px] bg-blue-600">
                            {contact.unreadCount}
                        </Badge>
                    )}
                </div>
            </div>
        </div>
    );
}
