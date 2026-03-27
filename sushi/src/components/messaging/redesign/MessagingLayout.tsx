import React from "react";
import { ChatSidebar } from "./ChatSidebar";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Video, MoreHorizontal, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MessagingLayoutProps {
    currentUserId: string;
    selectedContact: any;
    contacts: any[];
    messages: any[];
    onSendMessage: (content: string) => void;
    onSelectContact: (contact: any) => void;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    isLoading: boolean;
}

export function MessagingLayout({
    currentUserId,
    selectedContact,
    contacts,
    messages,
    onSendMessage,
    onSelectContact,
    searchTerm,
    onSearchChange,
    isLoading,
}: MessagingLayoutProps) {
    // Mock data for groups (Online/Pinned) for the demonstration
    const onlineUsers = contacts.filter((c, i) => i % 2 === 0).slice(0, 5);
    const pinnedContacts = contacts.slice(0, 2);
    const recentContacts = contacts.slice(2);

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-background rounded-3xl border shadow-xl overflow-hidden">
            <ChatSidebar
                contacts={recentContacts}
                onlineUsers={onlineUsers}
                pinnedContacts={pinnedContacts}
                selectedContactId={selectedContact?.id}
                onSelectContact={onSelectContact}
                searchTerm={searchTerm}
                onSearchChange={onSearchChange}
            />

            <div className="flex-1 flex flex-col bg-muted/5">
                {selectedContact ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b bg-background flex items-center justify-between px-6 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedContact.avatar} />
                                        <AvatarFallback>{selectedContact.name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    {selectedContact.isOnline && (
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-background rounded-full" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold flex items-center gap-1.5">
                                        {selectedContact.name}
                                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                                    </h2>
                                    <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                        {selectedContact.isOnline ? "Online Now" : "Last seen recently"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="text-muted-foreground"><Phone className="w-5 h-5" /></Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground"><Video className="w-5 h-5" /></Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground"><MoreHorizontal className="w-5 h-5" /></Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-hidden relative">
                            <ScrollArea className="h-full">
                                <div className="p-6 space-y-8 max-w-5xl mx-auto">
                                    {messages.map((msg) => (
                                        <ChatMessage
                                            key={msg.id}
                                            message={msg}
                                            isOwn={msg.senderId === currentUserId}
                                            senderName={msg.senderId === currentUserId ? "You" : selectedContact.name}
                                            senderAvatar={msg.senderId === currentUserId ? undefined : selectedContact.avatar}
                                        />
                                    ))}
                                    {isLoading && (
                                        <div className="text-center text-xs text-muted-foreground animate-pulse">
                                            Loading messages...
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Input Area */}
                        <ChatInput onSendMessage={onSendMessage} />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-40">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                            <Star className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <p className="font-semibold text-lg">Select a chat to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}
