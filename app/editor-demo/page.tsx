"use client";

import { useState } from "react";
import DocEditor from "@/components/DocEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function EditorDemo() {
  const [content, setContent] = useState("<p>Hello, this is a test document. Try editing me!</p>");
  const [savedContent, setSavedContent] = useState("");
  const [readOnly, setReadOnly] = useState(false);

  const handleSave = () => {
    setSavedContent(content);
    console.log("Saved content:", content);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">DocEditor Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="readonly" 
                  checked={readOnly}
                  onCheckedChange={(checked: boolean) => setReadOnly(checked)} 
                />
                <Label htmlFor="readonly">Read-only mode</Label>
              </div>
            </CardHeader>
            <CardContent>
              <DocEditor
                initialContent={content}
                onChange={(newContent: string) => setContent(newContent)}
                readOnly={readOnly}
              />
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSave}>Save Content</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Saved Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-md bg-muted/20 min-h-[200px]">
                {savedContent ? (
                  <div dangerouslySetInnerHTML={{ __html: savedContent }} />
                ) : (
                  <p className="text-muted-foreground">No content saved yet. Click the Save button to see content here.</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>HTML Output</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="p-4 border rounded-md bg-muted/20 overflow-auto text-xs">
                {content}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 