import ImageGenerator from "@/components/ImageGenerator";

export default function ImageGeneratorPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Luma AI Image Generator</h1>
      <div className="w-full max-w-3xl">
        <ImageGenerator />
      </div>
    </div>
  );
} 