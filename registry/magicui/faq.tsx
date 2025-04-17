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

// English FAQs
const enFaqs = [
  {
    Icon: PenTool,
    name: "What is Arthur AI?",
    description: "Arthur AI is your storytelling companion that transforms text into animated stories. From scripts to storyboards to animation, we help bring your imagination to life with AI-powered creativity.",
    href: "#",
    cta: "Learn more",
    className: "col-span-3 lg:col-span-2",
    background: (
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
  },
  {
    Icon: Film,
    name: "How does it work?",
    description: "Start with any text - a paragraph, story, or pitch. Arthur AI converts it into a professional screenplay, generates storyboards, and brings it to life with AI animation.",
    href: "#",
    cta: "See the process",
    className: "col-span-3 lg:col-span-1",
    background: (
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
  },
  {
    Icon: Code,
    name: "Can I use my own AI tools?",
    description: "Yes! Arthur AI supports custom API keys for Luma Labs, Gemini, Sync Labs, and Elevenlabs. Use your preferred AI models to customize your creative workflow.",
    href: "#",
    cta: "View integrations",
    className: "col-span-3 lg:col-span-1",
    background: (
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
  },
  {
    Icon: Sparkles,
    name: "What can I create?",
    description: "From marketing videos to animated shorts, educational content to book trailers - if you can write it, Arthur can help you animate it. Perfect for creators, educators, and businesses.",
    href: "#",
    cta: "Explore possibilities",
    className: "col-span-3 lg:col-span-2",
    background: (
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
  },
  {
    Icon: Palette,
    name: "What about style?",
    description: "Choose from a variety of animation styles, from Studio Ghibli-inspired warmth to modern minimalism. Customize every aspect of your story's visual identity.",
    href: "#",
    cta: "View styles",
    className: "col-span-3 lg:col-span-1",
    background: (
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
  },
  {
    Icon: Rocket,
    name: "Ready to start?",
    description: "Join our creative community today. Start with our free tier, or unlock full creative freedom with our Pro plan at $49/month. Enterprise solutions available.",
    href: "#",
    cta: "Get started",
    className: "col-span-3 lg:col-span-3",
    background: (
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
  },
];

// Spanish FAQs
const esFaqs = [
  {
    Icon: PenTool,
    name: "¿Qué es Arthur AI?",
    description: "Arthur AI es tu compañero de narración que transforma texto en historias animadas. Desde guiones hasta storyboards y animación, te ayudamos a dar vida a tu imaginación con creatividad impulsada por IA.",
    href: "#",
    cta: "Saber más",
    className: "col-span-3 lg:col-span-2",
    background: (
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
  },
  {
    Icon: Film,
    name: "¿Cómo funciona?",
    description: "Comienza con cualquier texto - un párrafo, historia o idea. Arthur AI lo convierte en un guión profesional, genera storyboards y lo lleva a la vida con animación de IA.",
    href: "#",
    cta: "Ver el proceso",
    className: "col-span-3 lg:col-span-1",
    background: (
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
  },
  {
    Icon: Code,
    name: "¿Puedo usar mis propias herramientas de IA?",
    description: "¡Sí! Arthur AI admite claves API personalizadas para Luma Labs, Gemini, Sync Labs y Elevenlabs. Usa tus modelos de IA preferidos para personalizar tu flujo de trabajo creativo.",
    href: "#",
    cta: "Ver integraciones",
    className: "col-span-3 lg:col-span-1",
    background: (
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
  },
  {
    Icon: Sparkles,
    name: "¿Qué puedo crear?",
    description: "Desde videos de marketing hasta cortos animados, contenido educativo o avances de libros - si puedes escribirlo, Arthur puede ayudarte a animarlo. Perfecto para creadores, educadores y empresas.",
    href: "#",
    cta: "Explorar posibilidades",
    className: "col-span-3 lg:col-span-2",
    background: (
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
  },
  {
    Icon: Palette,
    name: "¿Qué hay del estilo?",
    description: "Elige entre una variedad de estilos de animación, desde la calidez inspirada en Studio Ghibli hasta el minimalismo moderno. Personaliza cada aspecto de la identidad visual de tu historia.",
    href: "#",
    cta: "Ver estilos",
    className: "col-span-3 lg:col-span-1",
    background: (
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
  },
  {
    Icon: Rocket,
    name: "¿Listo para empezar?",
    description: "Únete a nuestra comunidad creativa hoy. Comienza con nuestro plan gratuito, o desbloquea libertad creativa completa con nuestro plan Pro a $49/mes. Soluciones empresariales disponibles.",
    href: "#",
    cta: "Comenzar",
    className: "col-span-3 lg:col-span-3",
    background: (
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
  },
];

// Urdu FAQs
const urFaqs = [
  {
    Icon: PenTool,
    name: "آرتھر اے آئی کیا ہے؟",
    description: "آرتھر اے آئی آپ کا سٹوری ٹیلنگ ساتھی ہے جو متن کو متحرک کہانیوں میں تبدیل کرتا ہے۔ اسکرپٹ سے لے کر اسٹوری بورڈ اور اینیمیشن تک، ہم اے آئی پاورڈ تخلیقی صلاحیت کے ساتھ آپ کے تخیل کو زندگی بخشتے ہیں۔",
    href: "#",
    cta: "مزید جانیں",
    className: "col-span-3 lg:col-span-2",
    background: (
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
  },
  {
    Icon: Film,
    name: "یہ کیسے کام کرتا ہے؟",
    description: "کسی بھی متن سے شروع کریں - ایک پیراگراف، کہانی، یا خیال۔ آرتھر اے آئی اسے ایک پیشہ ورانہ اسکرین پلے میں تبدیل کرتا ہے، اسٹوری بورڈ بناتا ہے، اور اے آئی اینیمیشن کے ساتھ اسے زندہ کرتا ہے۔",
    href: "#",
    cta: "عمل دیکھیں",
    className: "col-span-3 lg:col-span-1",
    background: (
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
  },
  {
    Icon: Code,
    name: "کیا میں اپنے اے آئی ٹولز استعمال کر سکتا ہوں؟",
    description: "ہاں! آرتھر اے آئی لوما لیبز، جیمینی، سنک لیبز، اور الیون لیبز کے لیے کسٹم اے پی آئی کیز کی حمایت کرتا ہے۔ اپنے پسندیدہ اے آئی ماڈلز کا استعمال کرکے اپنے تخلیقی ورک فلو کو اپنی مرضی کے مطابق بنائیں۔",
    href: "#",
    cta: "انٹیگریشنز دیکھیں",
    className: "col-span-3 lg:col-span-1",
    background: (
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
  },
  {
    Icon: Sparkles,
    name: "میں کیا بنا سکتا ہوں؟",
    description: "مارکیٹنگ ویڈیوز سے لے کر اینیمیٹڈ شارٹس، تعلیمی مواد تک کتاب کے ٹریلرز - اگر آپ اسے لکھ سکتے ہیں، آرتھر آپ کی مدد کر سکتا ہے اسے متحرک کرنے میں۔ خالقین، اساتذہ، اور کاروباری اداروں کے لیے بالکل موزوں۔",
    href: "#",
    cta: "امکانات دریافت کریں",
    className: "col-span-3 lg:col-span-2",
    background: (
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
  },
  {
    Icon: Palette,
    name: "اسٹائل کے بارے میں کیا خیال ہے؟",
    description: "اینیمیشن کے متعدد اسٹائلز میں سے انتخاب کریں، سٹوڈیو غیبلی سے متاثر گرمجوشی سے لے کر جدید منملزم تک۔ اپنی کہانی کی بصری شناخت کے ہر پہلو کو اپنی مرضی کے مطابق بنائیں۔",
    href: "#",
    cta: "اسٹائلز دیکھیں",
    className: "col-span-3 lg:col-span-1",
    background: (
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
  },
  {
    Icon: Rocket,
    name: "شروع کرنے کے لیے تیار ہیں؟",
    description: "آج ہی ہماری تخلیقی کمیونٹی میں شامل ہوں۔ ہمارے مفت پلان سے شروع کریں، یا پرو پلان کے ساتھ $49/ماہ پر مکمل تخلیقی آزادی حاصل کریں۔ انٹرپرائز حل بھی دستیاب ہیں۔",
    href: "#",
    cta: "شروع کریں",
    className: "col-span-3 lg:col-span-3",
    background: (
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
  },
];

// Map of FAQs by locale
const faqsByLocale = {
  en: enFaqs,
  es: esFaqs,
  ur: urFaqs
};

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
  // Default to English if the locale is not supported
  const faqs = faqsByLocale[locale as keyof typeof faqsByLocale] || enFaqs;

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
          {faqs.map((faq) => (
            <BentoCard key={faq.name} {...faq} />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
} 