"use client";

import { Sidebar } from "@/components/sidebar";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Bot,
  User,
  Paperclip,
  Mic,
  MoreHorizontal,
  Calendar,
  FileText,
  CheckSquare,
  Crown,
  Home,
  MessageCircle,
  Bell,
  Menu as MenuIcon,
} from "lucide-react";

export default function ConciergeChatPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "Hello! I'm Bruce, your AI concierge. How can I assist you today?",
      timestamp: "03:00 PM",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickActions = [
    { label: "@TaskCreate", icon: CheckSquare },
    { label: "@DocumentUpload", icon: FileText },
    { label: "@Curator", icon: Crown },
    { label: "@MySchedule", icon: Calendar },
  ];

  const suggestedPrompts = [
    "Repeat Friday's dinner order?",
    "Book a massage for tomorrow?",
    "Check flight status for AA123?",
  ];

  const bottomNavItems = [
    { label: "Home", icon: Home, href: "/" },
    {
      label: "Chat",
      icon: MessageCircle,
      href: "/concierge-chat",
      active: true,
    },
    { label: "Tasks", icon: CheckSquare, href: "/my-tasks" },
    { label: "Schedule", icon: Calendar, href: "/schedule" },
    { label: "Alerts", icon: Bell, href: "/notifications" },
    { label: "Menu", icon: MenuIcon, href: "#" },
  ];

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        type: "bot",
        content:
          "Thank you for your message. I'm processing your request and will get back to you shortly with the information you need.",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleQuickAction = (action) => {
    setInputMessage(action);
  };

  const handleSuggestedPrompt = (prompt) => {
    setInputMessage(prompt);
  };

  return (
    <Sidebar>
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border bg-background px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    Bruce
                  </h1>
                  <p className="text-sm text-muted-foreground">AI Concierge</p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              >
                Online
              </Badge>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-hidden">
          <div className="mx-auto max-w-4xl h-full flex flex-col px-4 sm:px-6 lg:px-8">
            <div className="flex-1 overflow-y-auto py-6 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.type === "bot" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col max-w-xs sm:max-w-md lg:max-w-lg">
                    <div
                      className={`px-4 py-3 rounded-2xl ${
                        message.type === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">
                        {message.content}
                      </p>
                    </div>
                    <p
                      className={`text-xs mt-1 text-muted-foreground ${
                        message.type === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>

                  {message.type === "user" && (
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="bg-muted text-foreground max-w-xs sm:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {quickActions.map((action, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action.label)}
                        className="text-xs"
                      >
                        <action.icon className="w-3 h-3 mr-1" />
                        {action.label}
                      </Button>
                    ))}
                  </div>

                  {/* Suggested Prompts */}
                  <div className="space-y-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedPrompt(prompt)}
                        className="block w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-sm text-foreground"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-border py-4 bg-background">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-2"
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                <div className="flex-1 relative">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="pr-12 rounded-full border-muted"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !inputMessage.trim()}
                  className="flex-shrink-0 rounded-full w-10 h-10 p-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="lg:hidden border-t border-border bg-background">
          <div className="flex items-center justify-around py-2">
            {bottomNavItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                  item.active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
