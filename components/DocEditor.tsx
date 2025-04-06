"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Bold from "@tiptap/extension-bold";
import Italic from "@tiptap/extension-italic";
import Underline from "@tiptap/extension-underline";
import Strike from "@tiptap/extension-strike";
import Heading from "@tiptap/extension-heading";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import Blockquote from "@tiptap/extension-blockquote";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/utils";
import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough as StrikethroughIcon,
  Heading1 as Heading1Icon,
  Heading2 as Heading2Icon,
  List as BulletListIcon,
  ListOrdered as OrderedListIcon,
  Quote as BlockquoteIcon,
  Link as LinkIcon,
  WandSparkles as WandSparklesIcon,
  Code as CodeIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface DocEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

const DocEditor = ({ initialContent, onChange, readOnly = false }: DocEditorProps) => {
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [linkDialogOpen, setLinkDialogOpen] = useState<boolean>(false);
  const [aiDialogOpen, setAiDialogOpen] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isMarkdownView, setIsMarkdownView] = useState<boolean>(false);
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [aiIsLoading, setAiIsLoading] = useState<boolean>(false);
  const markdownRef = useRef<HTMLTextAreaElement>(null);

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      Strike,
      Heading.configure({
        levels: [1, 2],
      }),
      BulletList,
      OrderedList,
      Blockquote,
      Link.configure({
        openOnClick: true,
      }),
      Placeholder.configure({
        placeholder: "Start typing or use / commands...",
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      // Update markdown content if in markdown view
      if (isMarkdownView) {
        // This is a simplified conversion, you might want to use a proper HTML-to-Markdown library
        setMarkdownContent(htmlToMarkdown(html));
      }
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        // Handle slash commands
        if (event.key === "/" && !event.shiftKey) {
          // We'd detect this and show a floating menu with AI options
          // For now, we'll just open the AI dialog on slash
          setTimeout(() => {
            setAiDialogOpen(true);
          }, 100);
          return false;
        }
        return false;
      },
    },
  });

  // Simple HTML to Markdown converter (this is very simplified)
  const htmlToMarkdown = (html: string) => {
    let markdown = html
      .replace(/<h1>/g, "# ")
      .replace(/<\/h1>/g, "\n\n")
      .replace(/<h2>/g, "## ")
      .replace(/<\/h2>/g, "\n\n")
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "\n\n")
      .replace(/<strong>/g, "**")
      .replace(/<\/strong>/g, "**")
      .replace(/<em>/g, "*")
      .replace(/<\/em>/g, "*")
      .replace(/<u>/g, "__")
      .replace(/<\/u>/g, "__")
      .replace(/<s>/g, "~~")
      .replace(/<\/s>/g, "~~")
      .replace(/<blockquote>/g, "> ")
      .replace(/<\/blockquote>/g, "\n\n")
      .replace(/<ul>/g, "")
      .replace(/<\/ul>/g, "")
      .replace(/<ol>/g, "")
      .replace(/<\/ol>/g, "")
      .replace(/<li>/g, "- ")
      .replace(/<\/li>/g, "\n")
      .replace(/<a href="([^"]+)">[^<]+<\/a>/g, "[$2]($1)");
    
    return markdown;
  };

  // Simple Markdown to HTML converter (this is very simplified)
  const markdownToHtml = (markdown: string) => {
    let html = markdown
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/__(.*?)__/g, "<u>$1</u>")
      .replace(/~~(.*?)~~/g, "<s>$1</s>")
      .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>")
      .replace(/^- (.*$)/gm, "<li>$1</li>")
      .replace(/\[(.*?)\]\((.*?)\)/g, "<a href=\"$2\">$1</a>");
    
    // Wrap paragraphs
    html = html.split("\n\n").map(para => {
      if (!para.trim().startsWith("<h") && 
          !para.trim().startsWith("<blockquote") && 
          !para.trim().startsWith("<li")) {
        return `<p>${para}</p>`;
      }
      return para;
    }).join("");
    
    // Wrap lists
    html = html.replace(/<li>.*?<\/li>/g, match => {
      return `<ul>${match}</ul>`;
    });
    
    return html;
  };

  // Toggle between WYSIWYG and Markdown view
  const toggleMarkdownView = () => {
    if (!isMarkdownView) {
      // Switching to markdown view
      setMarkdownContent(htmlToMarkdown(editor?.getHTML() || ""));
    } else {
      // Switching to WYSIWYG view
      if (editor && markdownContent) {
        editor.commands.setContent(markdownToHtml(markdownContent));
      }
    }
    setIsMarkdownView(!isMarkdownView);
  };

  // Update markdown content when it changes in the textarea
  const handleMarkdownChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMarkdownContent(e.target.value);
    // We don't update the editor content in real-time to avoid cursor jumping
    // It will be updated when toggling back to WYSIWYG
  };

  // Add a link
  const addLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      
      setLinkUrl("");
      setLinkDialogOpen(false);
    }
  }, [editor, linkUrl]);

  // Handle AI generation
  const handleAiGenerate = async () => {
    if (!editor || !aiPrompt) return;
    
    setAiIsLoading(true);
    
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: aiPrompt
            }
          ],
          model: "gemini-pro" // Using the model from ChatArea component
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate content");
      }
      
      const data = await response.json();
      const generatedContent = data.response || "";
      
      // Insert the generated content at cursor position
      editor.commands.insertContent(generatedContent);
      
      setAiPrompt("");
      setAiDialogOpen(false);
    } catch (error) {
      console.error("Error generating AI content:", error);
    } finally {
      setAiIsLoading(false);
    }
  };

  useEffect(() => {
    // Focus the markdown textarea when switching to markdown view
    if (isMarkdownView && markdownRef.current) {
      markdownRef.current.focus();
    }
  }, [isMarkdownView]);

  if (!editor && isMarkdownView) {
    return (
      <div className="border rounded-md">
        <div className="border-b p-2 flex justify-between items-center bg-muted/50">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleMarkdownView}
              className="text-xs"
            >
              <CodeIcon className="h-4 w-4 mr-1" />
              WYSIWYG
            </Button>
          </div>
        </div>
        <textarea
          ref={markdownRef}
          value={markdownContent}
          onChange={handleMarkdownChange}
          className="w-full p-4 min-h-[200px] focus:outline-none resize-y"
          placeholder="Enter markdown..."
          disabled={readOnly}
        />
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      {!isMarkdownView ? (
        <>
          <div className="border-b p-2 flex flex-wrap justify-between items-center bg-muted/50">
            <div className="flex items-center space-x-1 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className={cn(
                  "h-8 w-8 p-0", 
                  editor?.isActive("bold") && "bg-muted"
                )}
                disabled={readOnly}
              >
                <BoldIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className={cn(
                  "h-8 w-8 p-0", 
                  editor?.isActive("italic") && "bg-muted"
                )}
                disabled={readOnly}
              >
                <ItalicIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
                className={cn(
                  "h-8 w-8 p-0", 
                  editor?.isActive("underline") && "bg-muted"
                )}
                disabled={readOnly}
              >
                <UnderlineIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleStrike().run()}
                className={cn(
                  "h-8 w-8 p-0", 
                  editor?.isActive("strike") && "bg-muted"
                )}
                disabled={readOnly}
              >
                <StrikethroughIcon className="h-4 w-4" />
              </Button>
              <span className="w-[1px] h-6 bg-border mx-1"></span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                className={cn(
                  "h-8 w-8 p-0", 
                  editor?.isActive("heading", { level: 1 }) && "bg-muted"
                )}
                disabled={readOnly}
              >
                <Heading1Icon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                className={cn(
                  "h-8 w-8 p-0", 
                  editor?.isActive("heading", { level: 2 }) && "bg-muted"
                )}
                disabled={readOnly}
              >
                <Heading2Icon className="h-4 w-4" />
              </Button>
              <span className="w-[1px] h-6 bg-border mx-1"></span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className={cn(
                  "h-8 w-8 p-0", 
                  editor?.isActive("bulletList") && "bg-muted"
                )}
                disabled={readOnly}
              >
                <BulletListIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className={cn(
                  "h-8 w-8 p-0", 
                  editor?.isActive("orderedList") && "bg-muted"
                )}
                disabled={readOnly}
              >
                <OrderedListIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                className={cn(
                  "h-8 w-8 p-0", 
                  editor?.isActive("blockquote") && "bg-muted"
                )}
                disabled={readOnly}
              >
                <BlockquoteIcon className="h-4 w-4" />
              </Button>
              <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0", 
                      editor?.isActive("link") && "bg-muted"
                    )}
                    disabled={readOnly}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Link</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <Input
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      className="col-span-3"
                    />
                    <Button onClick={addLink}>Add Link</Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 ml-1"
                    disabled={readOnly}
                  >
                    <WandSparklesIcon className="h-4 w-4 mr-1" />
                    AI Assist
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>AI Assistance</DialogTitle>
                  </DialogHeader>
                  <div className="flex flex-col gap-4 py-4">
                    <Input
                      placeholder="Enter prompt for AI to generate content..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="col-span-3"
                    />
                    <Button onClick={handleAiGenerate} disabled={aiIsLoading}>
                      {aiIsLoading ? "Generating..." : "Generate"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleMarkdownView}
              className="text-xs"
              disabled={readOnly}
            >
              <CodeIcon className="h-4 w-4 mr-1" />
              Markdown
            </Button>
          </div>
          
          <EditorContent 
            editor={editor} 
            className="p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none"
          />
        </>
      ) : (
        <>
          <div className="border-b p-2 flex justify-between items-center bg-muted/50">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleMarkdownView}
                className="text-xs"
                disabled={readOnly}
              >
                <CodeIcon className="h-4 w-4 mr-1" />
                WYSIWYG
              </Button>
            </div>
          </div>
          <textarea
            ref={markdownRef}
            value={markdownContent}
            onChange={handleMarkdownChange}
            className="w-full p-4 min-h-[200px] focus:outline-none resize-y"
            placeholder="Enter markdown..."
            disabled={readOnly}
          />
        </>
      )}
    </div>
  );
};

export default DocEditor; 