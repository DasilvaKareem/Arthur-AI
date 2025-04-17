"use client";

import { GlobeIcon } from "@radix-ui/react-icons";
import { 
  Sparkles,
  Code,
  Rocket,
  PenTool,
  Film,
  Palette
} from "lucide-react";
import { BentoCard, BentoGrid } from "./bento-grid";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Define background animations for FAQ cards
const createBackgrounds = () => {
  return [
    // Background 1
    (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-[0.15]">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ 
            scale: [0.8, 1, 0.8],
            rotate: [0, 10, 0]
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-96 h-96 rounded-full bg-gradient-to-r from-blue-500/40 to-purple-500/40 dark:from-blue-400/40 dark:to-purple-400/40 blur-3xl"
        />
      </div>
    ),
    // Background 2
    (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-[0.15]">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-32 h-32 rounded-full bg-blue-500/40 dark:bg-blue-400/40 blur-2xl"
        />
      </div>
    ),
    // Background 3
    (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-[0.15]">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-full h-full bg-gradient-to-b from-blue-500/40 dark:from-blue-400/40 to-transparent blur-2xl"
        />
      </div>
    ),
    // Background 4
    (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-[0.15]">
        <motion.div
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="w-96 h-96 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-blue-400/40 dark:from-blue-400/40 dark:via-purple-400/40 dark:to-blue-300/40 blur-3xl"
        />
      </div>
    ),
    // Background 5
    (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-[0.15]">
        <motion.div
          animate={{ 
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-40 h-40 rounded-full bg-blue-500/40 dark:bg-blue-400/40 blur-2xl"
        />
      </div>
    ),
    // Background 6
    (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-[0.15]">
        <motion.div
          animate={{ 
            x: [-100, 100, -100],
            y: [-20, 20, -20]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-full h-32 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-blue-400/40 dark:from-blue-400/40 dark:via-purple-400/40 dark:to-blue-300/40 blur-3xl"
        />
      </div>
    ),
  ];
};

// Define grid classes based on position
const gridClasses = [
  "col-span-3 lg:col-span-2", 
  "col-span-3 lg:col-span-1", 
  "col-span-3 lg:col-span-1",
  "col-span-3 lg:col-span-2", 
  "col-span-3 lg:col-span-1", 
  "col-span-3 lg:col-span-3"
];

// Icon sequence to use for FAQ items
const IconSequence = [PenTool, Film, Code, Sparkles, Palette, Rocket];

// English FAQs - to be used as fallback
const enFaqs = [
  {
    name: "What is Arthur AI?",
    description: "Arthur AI is your storytelling companion that transforms text into animated stories. From scripts to storyboards to animation, we help bring your imagination to life with AI-powered creativity.",
    cta: "Learn more",
  },
  {
    name: "How does it work?",
    description: "Start with any text - a paragraph, story, or pitch. Arthur AI converts it into a professional screenplay, generates storyboards, and brings it to life with AI animation.",
    cta: "See the process",
  },
  {
    name: "Can I use my own AI tools?",
    description: "Yes! Arthur AI supports custom API keys for Luma Labs, Gemini, Sync Labs, and Elevenlabs. Use your preferred AI models to customize your creative workflow.",
    cta: "View integrations",
  },
  {
    name: "What can I create?",
    description: "From marketing videos to animated shorts, educational content to book trailers - if you can write it, Arthur can help you animate it. Perfect for creators, educators, and businesses.",
    cta: "Explore possibilities",
  },
  {
    name: "What about style?",
    description: "Choose from a variety of animation styles, from Studio Ghibli-inspired warmth to modern minimalism. Customize every aspect of your story's visual identity.",
    cta: "View styles",
  },
  {
    name: "Ready to start?",
    description: "Join our creative community today. Start with our free tier, or unlock full creative freedom with our Pro plan at $49/month. Enterprise solutions available.",
    cta: "Get started",
  },
];

export function FAQ({ 
  localeData = { 
    title: "Turn Your Stories Into Animation",
    subtitle: "Discover how Arthur AI helps you bring your imagination to life, from text to animated story."
  },
  locale = "en"
}: { 
  localeData?: { 
    title: string; 
    subtitle: string 
  },
  locale?: string 
}) {
  const [faqItems, setFaqItems] = useState<any[]>([]);
  const backgrounds = createBackgrounds();

  useEffect(() => {
    // Function to load and process FAQ data
    const loadFaqData = async () => {
      try {
        // Load translation file for the current locale
        const translationModule = await import(`../../app/lib/translations/${locale}.json`);
        const translations = translationModule.default;
        
        if (translations?.home?.faq?.questions && Array.isArray(translations.home.faq.questions)) {
          // Map questions from translations to FAQ items with visual styling
          const localizedFaqs = translations.home.faq.questions.map((q: any, index: number) => ({
            Icon: IconSequence[index % IconSequence.length],
            name: q.name,
            description: q.description,
            href: "#",
            cta: q.cta || "Learn more",
            className: gridClasses[index % gridClasses.length],
            background: backgrounds[index % backgrounds.length]
          }));
          setFaqItems(localizedFaqs);
        } else {
          // If no questions found in translation, create items from English FAQs
          const fallbackFaqs = enFaqs.map((faq, index) => ({
            Icon: IconSequence[index % IconSequence.length],
            name: faq.name,
            description: faq.description,
            href: "#",
            cta: faq.cta,
            className: gridClasses[index % gridClasses.length],
            background: backgrounds[index % backgrounds.length]
          }));
          setFaqItems(fallbackFaqs);
        }
      } catch (error) {
        console.error(`Error loading FAQ data for locale ${locale}:`, error);
        // Create fallback from English FAQs
        const fallbackFaqs = enFaqs.map((faq, index) => ({
          Icon: IconSequence[index % IconSequence.length],
          name: faq.name,
          description: faq.description,
          href: "#",
          cta: faq.cta,
          className: gridClasses[index % gridClasses.length],
          background: backgrounds[index % backgrounds.length]
        }));
        setFaqItems(fallbackFaqs);
      }
    };

    loadFaqData();
  }, [locale]); // Re-run when locale changes

  return (
    <section className="relative py-24">
      <div className="container">
        <div className="mx-auto mb-12 max-w-[58rem] text-center">
          <h2 className="font-bold text-3xl leading-tight sm:text-4xl md:text-5xl text-foreground">
            {localeData.title}
          </h2>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            {localeData.subtitle}
          </p>
        </div>
        <BentoGrid>
          {faqItems.map((faq, index) => (
            <BentoCard key={index} {...faq} />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
} 