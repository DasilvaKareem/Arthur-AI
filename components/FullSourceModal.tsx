import React from "react";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

// Define RAGSource interface directly
interface RAGSource {
  id: string;
  fileName: string;
  snippet: string;
  score: number;
  timestamp?: string;
}

interface FullSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: RAGSource | null;
}

const FullSourceModal: React.FC<FullSourceModalProps> = ({
  isOpen,
  onClose,
  source,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{source?.fileName || "Full Source"}</DialogTitle>
        </DialogHeader>
        {source ? (
          <>
            <div className="mb-4">
              <span className="font-bold">Score: </span>
              {(source.score * 100).toFixed(2)}%
            </div>
            <ReactMarkdown className="max-h-[60vh] overflow-y-auto mb-4">
              {source.snippet}
            </ReactMarkdown>
          </>
        ) : (
          <p>No source selected</p>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogContent>
    </Dialog>
  );
};

export default FullSourceModal;
