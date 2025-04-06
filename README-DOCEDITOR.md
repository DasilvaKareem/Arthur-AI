# DocEditor Component

A reusable rich text editor component for Next.js applications that provides a clean, WYSIWYG editing experience with Markdown support.

## Features

- Rich text editing (bold, italic, underline, strikethrough)
- Lists (bullet and ordered)
- Headers (H1, H2)
- Block quotes
- Link insertion
- Toggle between WYSIWYG and Markdown views
- AI integration with `/` command and AI Assist button
- Auto-save behavior with real-time `onChange` updates
- Read-only mode support

## Installation

Make sure you have the following dependencies installed:

```bash
npm install @tiptap/react @tiptap/extension-bold @tiptap/extension-italic @tiptap/extension-underline @tiptap/extension-strike @tiptap/extension-heading @tiptap/extension-bullet-list @tiptap/extension-ordered-list @tiptap/extension-blockquote @tiptap/extension-link @tiptap/extension-document @tiptap/extension-paragraph @tiptap/extension-text @tiptap/extension-placeholder
```

## Usage

```tsx
import DocEditor from "@/components/DocEditor";

function MyComponent() {
  const [content, setContent] = useState("<p>Initial content</p>");
  
  return (
    <DocEditor
      initialContent={content}
      onChange={(newContent) => setContent(newContent)}
      readOnly={false} // Optional. Default is false
    />
  );
}
```

## Props

| Prop           | Type                         | Description                                   |
|----------------|------------------------------|-----------------------------------------------|
| initialContent | string                       | Initial HTML content for the editor           |
| onChange       | (content: string) => void    | Callback fired when content changes           |
| readOnly       | boolean (optional)           | If true, makes the editor read-only           |

## AI Integration

The component includes AI assistance through:

1. The `/` command - Type `/` in the editor to trigger the AI dialog
2. The "AI Assist" button in the toolbar

The AI integration uses the existing `/api/chat` endpoint with the Gemini Pro model.

## Demo

To see the component in action, visit `/editor-demo` in your application.

## Customization

The component uses Tailwind CSS and ShadCN UI components. You can customize the appearance by modifying the component's classes or extending the component itself. 